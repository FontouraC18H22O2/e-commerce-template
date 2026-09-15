"""
Orquestrador do agente: junta tudo e decide o que propor.

Fluxo, por cada projeto (client, server):
  1. le o inventario de dependencias;
  2. descobre versoes novas estaveis;
  3. deteta vulnerabilidades conhecidas (npm audit);
  4. pede ao Claude um juizo de risco das atualizacoes;
  5. aplica a POLITICA do config.py e produz um PLANO do que propor.

Este modulo ainda NAO altera nada nem abre PRs. So decide e mostra o
plano. Aplicar e abrir Pull Requests vem nos passos seguintes. Manter a
decisao separada da acao facilita a revisao e os testes.
"""
import sys
from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

from dep_agent import config
from dep_agent.ecosystems.base import UpdateCandidate, Vulnerability
from dep_agent.ecosystems.npm import NpmEcosystem, _find_repo_root
from dep_agent.judge import judge_updates, UpdateJudgment


@dataclass(frozen=True)
class Decision:
    """O que o agente decidiu fazer sobre uma atualizacao concreta."""
    project: str
    name: str
    kind: str
    current_spec: str
    target_version: str | None
    bump_type: str
    action: str          # "propose" | "flag" | "skip"
    is_security: bool
    risk: str            # juizo da AI: low/medium/high
    breaking: bool       # juizo da AI
    reason: str


def _vulnerable_direct_packages(vulns: list[Vulnerability]) -> set[str]:
    """Dependencias DIRETAS vulneraveis com correcao disponivel."""
    return {v.package for v in vulns if v.is_direct and v.fix_available}


def _decide(project: str,
            candidate: UpdateCandidate,
            judgment: UpdateJudgment,
            security_pkgs: set[str]) -> Decision:
    """
    Combina politica + seguranca + juizo da AI numa unica decisao.

    Prioridades:
      1. Seguranca manda: se corrige uma vulnerabilidade, propoe-se sempre.
      2. Caso contrario, a politica do config decide pelo tipo de salto.
      3. A AI so pode AGRAVAR: uma proposta com risco alto ou breaking
         changes passa a "flag" (proposta, mas marcada para revisao
         cuidada). Nunca torna algo mais permissivo do que a politica manda.
    """
    is_security = candidate.name in security_pkgs

    if is_security and config.ALWAYS_PROPOSE_SECURITY_FIXES:
        action = "propose"
        base_reason = "Corrige vulnerabilidade conhecida (prioridade)."
    elif candidate.bump_type in ("patch", "minor", "major"):
        action = getattr(config.UPDATE_POLICY, candidate.bump_type)
        base_reason = f"Salto {candidate.bump_type} (politica)."
    else:
        action = "skip"
        base_reason = f"Salto '{candidate.bump_type}': nao avaliavel com seguranca."

    if action == "propose" and (judgment.breaking_changes or judgment.risk == "high"):
        action = "flag"
        base_reason += " Agravado pela AI (risco elevado / breaking)."

    reason = f"{base_reason} AI: {judgment.risk}. {judgment.rationale}"

    return Decision(
        project=project, name=candidate.name, kind=candidate.kind,
        current_spec=candidate.current_spec, target_version=candidate.latest_version,
        bump_type=candidate.bump_type, action=action, is_security=is_security,
        risk=judgment.risk, breaking=judgment.breaking_changes, reason=reason,
    )


def build_plan_for_project(project: str, project_dir: Path
                           ) -> tuple[list[Decision], list[Vulnerability]]:
    """Produz as decisoes e as vulnerabilidades por resolver de um projeto."""
    npm = NpmEcosystem()

    deps = npm.read_inventory(project_dir)
    updates = npm.check_updates(deps)
    outdated = [u for u in updates if u.bump_type in ("patch", "minor", "major")]

    try:
        vulns = npm.check_vulnerabilities(project_dir)
    except RuntimeError:
        vulns = []
    security_pkgs = _vulnerable_direct_packages(vulns)

    judgments = {j.name: j for j in judge_updates(outdated)}

    decisions: list[Decision] = []
    for cand in outdated:
        judgment = judgments.get(cand.name) or UpdateJudgment(
            name=cand.name, risk="high", breaking_changes=True,
            rationale="Sem avaliacao da AI.", pr_note="Requer revisao manual.",
        )
        decisions.append(_decide(project, cand, judgment, security_pkgs))

    # Vulnerabilidades que nao sao cobertas por uma atualizacao direta
    # (ex: transitivas como o 'qs') ficam listadas para atencao a parte.
    covered = {d.name for d in decisions if d.is_security}
    leftover = [v for v in vulns if not (v.is_direct and v.package in covered)]
    return decisions, leftover


def _print_plan(project: str, decisions: list[Decision],
                leftover: list[Vulnerability]) -> None:
    order = {"propose": 0, "flag": 1, "skip": 2}
    decisions = sorted(decisions, key=lambda d: (order.get(d.action, 9), d.name))

    print(f"\n=== PLANO: {project} ===")
    grupos = (
        ("propose", "PROPOR"),
        ("flag", "PROPOR (marcado: rever com cuidado)"),
        ("skip", "IGNORAR (decisao manual)"),
    )
    for action, titulo in grupos:
        grupo = [d for d in decisions if d.action == action]
        if not grupo:
            continue
        print(f"\n  {titulo}:")
        for d in grupo:
            sec = " [SEGURANCA]" if d.is_security else ""
            brk = " [BREAKING]" if d.breaking else ""
            print(f"    - {d.name}: {d.current_spec} -> {d.target_version} "
                  f"({d.bump_type}, risco {d.risk}){sec}{brk}")
            print(f"        {d.reason}")

    if leftover:
        print("\n  VULNERABILIDADES POR RESOLVER (sem atualizacao direta simples):")
        for v in leftover:
            scope = "direta" if v.is_direct else "transitiva"
            fix = "correcao disponivel" if v.fix_available else "sem correcao"
            print(f"    - {v.severity:<8} {v.package} ({scope}) - {fix}")


def main() -> None:
    apply = "--apply" in sys.argv
    dry_run = "--dry-run" in sys.argv

    load_dotenv()
    repo_root = _find_repo_root(Path(__file__).resolve())

    plans = []
    for rel_dir in config.NPM_PROJECT_DIRS:
        project_dir = repo_root / rel_dir
        decisions, leftover = build_plan_for_project(rel_dir, project_dir)
        _print_plan(rel_dir, decisions, leftover)
        plans.append((rel_dir, project_dir, decisions, leftover))

    if apply:
        from dep_agent.github_pr import create_update_pr
        modo = "simulacao" if dry_run else "a serio"
        print(f"\n--- A aplicar atualizacoes seguras ({modo}) ---")
        create_update_pr(repo_root, config.DEFAULT_BASE_BRANCH, plans, dry_run=dry_run)
    else:
        print("\n(Plano apenas. Corre com --apply para criar o branch e o PR, "
              "ou --apply --dry-run para simular localmente sem enviar nada.)")

if __name__ == "__main__":
    main()