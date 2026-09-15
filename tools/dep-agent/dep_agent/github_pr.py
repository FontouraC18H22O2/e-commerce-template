"""
github_pr.py — fechar o ciclo: branch, aplicar, commit, push, abrir PR.

Para os projetos com atualizacoes seguras:
  1. exige um working tree limpo e guarda o branch atual;
  2. cria um branch novo;
  3. aplica as atualizacoes seguras (apply.py) em cada projeto;
  4. faz commit dos manifestos e lockfiles alterados;
  5. faz push e abre UM Pull Request (se houver token); senao imprime o
     link para o abrires a mao;
  6. volta sempre ao branch original no fim.

Modo dry_run: faz tudo localmente ate ao commit, mostra o resultado e
limpa o branch. Nao envia nada nem toca no remoto. Ideal para testar.

Nunca faz merge. Nunca mexe em alteracoes tuas por committar.
"""

from __future__ import annotations
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from dep_agent.apply import apply_safe_updates, ProjectApplyReport


def _run_git(args: list[str], repo_root: Path, check: bool = True) -> subprocess.CompletedProcess:
    """Corre um comando git FIXO na raiz do repo, sem shell."""
    result = subprocess.run(
        ["git", *args], cwd=str(repo_root),
        capture_output=True, text=True, shell=False,
    )
    if check and result.returncode != 0:
        raise RuntimeError(
            f"git {' '.join(args)} falhou: {(result.stderr or result.stdout).strip()}")
    return result


def _ensure_clean(repo_root: Path) -> None:
    """Recusa-se a atuar se houver alteracoes por committar."""
    if _run_git(["status", "--porcelain"], repo_root).stdout.strip():
        raise RuntimeError(
            "Working tree com alteracoes por committar. Faz commit ou stash "
            "antes de correr o agente, para nao misturar o teu trabalho com o dele.")


def _current_branch(repo_root: Path) -> str:
    return _run_git(["rev-parse", "--abbrev-ref", "HEAD"], repo_root).stdout.strip()


def _repo_full_name(repo_root: Path) -> str | None:
    """owner/repo, do ambiente (Actions) ou do remote origin (local)."""
    env = os.environ.get("GITHUB_REPOSITORY", "").strip()
    if env:
        return env
    url = _run_git(["remote", "get-url", "origin"], repo_root, check=False).stdout.strip()
    if not url or "github.com" not in url:
        return None
    tail = url.split("github.com")[-1].lstrip(":/")
    return tail[:-4] if tail.endswith(".git") else (tail or None)


def _build_pr_body(reports: list[tuple[str, ProjectApplyReport, list, list]]) -> str:
    """Resumo humano do PR a partir do que foi aplicado / adiado."""
    linhas = ["Atualizacoes de dependencias propostas pelo dep-agent.",
              "Nao ha merge automatico: revê e junta manualmente.", ""]
    for project, report, flagged, leftover in reports:
        linhas.append(f"## {project}")
        if report.applied:
            linhas.append("### Aplicadas (install + build OK)")
            linhas += [f"- `{r.name}` {r.from_spec} -> {r.to_version}" for r in report.applied]
        if report.failed:
            linhas.append("### Falharam a verificacao (nao incluidas)")
            linhas += [f"- `{r.name}` -> {r.to_version}: {r.detail}" for r in report.failed]
        if flagged:
            linhas.append("### Requerem accao manual (majors / alto risco)")
            linhas += [f"- `{d.name}` {d.current_spec} -> {d.target_version} (risco {d.risk})"
                       for d in flagged]
        if leftover:
            linhas.append("### Vulnerabilidades por resolver")
            linhas += [f"- {v.severity} `{v.package}` "
                       f"({'direta' if v.is_direct else 'transitiva'})" for v in leftover]
        linhas.append("")
    return "\n".join(linhas)


def _open_pr(full_name: str, token: str, base: str, head: str, title: str, body: str) -> str | None:
    """Abre o PR via API do GitHub. Devolve o URL, ou None se falhar."""
    from github import Github
    try:
        pr = Github(token).get_repo(full_name).create_pull(
            title=title, body=body, base=base, head=head)
        return pr.html_url
    except Exception as err:
        print(f"    aviso: nao consegui abrir o PR via API ({err}).")
        return None


def create_update_pr(repo_root: Path, base_branch: str,
                     plans: list[tuple[str, Path, list, list]],
                     dry_run: bool = False) -> None:
    """plans: lista de (project, project_dir, decisions, leftover_vulns)."""
    _ensure_clean(repo_root)
    original = _current_branch(repo_root)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    branch = f"dep-agent/updates-{stamp}"

    reports: list[tuple[str, ProjectApplyReport, list, list]] = []
    try:
        _run_git(["checkout", "-b", branch], repo_root)

        touched_any = False
        for project, project_dir, decisions, leftover in plans:
            report = apply_safe_updates(project, project_dir, decisions)
            flagged = [d for d in decisions if d.action == "flag"]
            reports.append((project, report, flagged, leftover))
            if report.applied:
                touched_any = True
            for fname in ("package.json", "package-lock.json"):
                fpath = project_dir / fname
                if fpath.is_file():
                    _run_git(["add", fpath.relative_to(repo_root).as_posix()],
                             repo_root, check=False)

        if not touched_any:
            print("Nenhuma atualizacao segura aplicada com sucesso. Sem PR.")
            return

        _run_git(["commit", "-m", "chore(deps): atualizacoes seguras (dep-agent)"], repo_root)

        if dry_run:
            print(f"\n[SIMULACAO] branch '{branch}' criado e commitado localmente.")
            print(_run_git(["diff", "--stat", f"{base_branch}...{branch}"], repo_root).stdout)
            print("Nada foi enviado. O branch vai ser apagado no fim.")
            return

        _run_git(["push", "-u", "origin", branch], repo_root)
        full_name = _repo_full_name(repo_root)
        body = _build_pr_body(reports)
        title = "chore(deps): atualizacoes seguras propostas pelo dep-agent"
        token = os.environ.get("GITHUB_TOKEN", "").strip()

        url = _open_pr(full_name, token, base_branch, branch, title, body) \
            if (token and full_name) else None
        if url:
            print(f"Pull Request aberto: {url}")
        elif full_name:
            print("Branch enviado. Abre o PR aqui:")
            print(f"  https://github.com/{full_name}/compare/{base_branch}...{branch}?expand=1")
        else:
            print(f"Branch '{branch}' enviado. Abre o PR manualmente no GitHub.")
    finally:
        _run_git(["checkout", original], repo_root, check=False)
        if dry_run:
            _run_git(["branch", "-D", branch], repo_root, check=False)