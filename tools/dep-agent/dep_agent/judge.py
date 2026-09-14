"""
Camada de AI do agente: avaliacao de risco das atualizacoes.

Recebe uma lista de UpdateCandidate e pede ao Claude um juizo sobre cada
uma: nivel de risco, probabilidade de breaking changes, uma justificacao
curta e uma nota pronta a por no Pull Request.

Fronteira de seguranca (o coracao deste modulo):
- O Claude RECEBE dados e DEVOLVE texto/juizo. Nunca executa nada.
- A resposta e validada de forma defensiva: se vier malformada ou com
  valores fora do esperado, assumimos o pior caso (risco alto) em vez de
  confiar as cegas. Falha para o lado seguro.
"""

from __future__ import annotations
import json
from dataclasses import dataclass

import anthropic

from dep_agent import config
from dep_agent.ecosystems.base import UpdateCandidate


# Valores validos para o risco. Tudo o que venha fora disto vira "high".
_ALLOWED_RISK = {"low", "medium", "high"}


@dataclass(frozen=True)
class UpdateJudgment:
    """O juizo do Claude sobre uma atualizacao concreta."""
    name: str
    risk: str                 # "low" | "medium" | "high"
    breaking_changes: bool    # True se forem provaveis breaking changes
    rationale: str            # justificacao curta (1 frase)
    pr_note: str              # nota pronta a incluir no Pull Request


_SYSTEM_PROMPT = (
    "Es um avaliador de risco de atualizacoes de dependencias npm. "
    "Recebes uma lista de atualizacoes e devolves uma avaliacao para cada uma. "
    "Baseia-te no tipo de salto semver (major e mais arriscado que minor, "
    "que e mais arriscado que patch), no facto de ser dependencia de "
    "producao ou de desenvolvimento, e no que sabes sobre cada pacote. "
    "Nao executas nem instalas nada; apenas avalias. "
    "Respondes SEMPRE e SO com JSON valido, sem texto a volta, sem markdown."
)


def _build_user_prompt(candidates: list[UpdateCandidate]) -> str:
    """Descreve as candidatas e o formato exato de resposta esperado."""
    linhas = [
        "Avalia estas atualizacoes e devolve um array JSON. "
        "Cada elemento tem exatamente estes campos:",
        '  "name": nome do pacote (igual ao recebido),',
        '  "risk": "low" | "medium" | "high",',
        '  "breaking_changes": true ou false,',
        '  "rationale": justificacao numa frase curta (em portugues),',
        '  "pr_note": nota curta para o Pull Request (em portugues).',
        "",
        "Atualizacoes:",
    ]
    for c in candidates:
        linhas.append(
            f"- {c.name} ({c.kind}): {c.current_spec} -> {c.latest_version} "
            f"[salto: {c.bump_type}]"
        )
    return "\n".join(linhas)


def _coerce_judgment(item: dict, fallback_name: str) -> UpdateJudgment:
    """
    Converte um elemento do JSON do modelo num UpdateJudgment validado.

    Campo em falta ou invalido cai num valor seguro: risco alto e breaking
    changes assumidas. Nunca confiamos cegamente no que o modelo devolve.
    """
    name = str(item.get("name") or fallback_name)

    risk = str(item.get("risk", "")).lower().strip()
    if risk not in _ALLOWED_RISK:
        risk = "high"

    breaking = item.get("breaking_changes")
    if not isinstance(breaking, bool):
        breaking = True  # na duvida, assume o pior

    rationale = str(item.get("rationale") or "").strip() or "Sem justificacao fornecida."
    pr_note = str(item.get("pr_note") or "").strip() or rationale

    return UpdateJudgment(name, risk, breaking, rationale, pr_note)


def _extract_json_array(text: str) -> list:
    """
    Isola o array JSON da resposta, de forma tolerante.

    O modelo deve devolver so JSON, mas por precaucao removemos eventuais
    cercas de markdown e apanhamos do primeiro '[' ao ultimo ']'.
    """
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
    start = cleaned.find("[")
    end = cleaned.rfind("]")
    if start == -1 or end == -1 or end < start:
        raise ValueError("Resposta do modelo nao continha um array JSON.")
    return json.loads(cleaned[start:end + 1])


def judge_updates(candidates: list[UpdateCandidate]) -> list[UpdateJudgment]:
    """
    Pede ao Claude uma avaliacao de risco para todas as candidatas.

    Faz um unico pedido com todas (mais barato e rapido que um por pacote).
    Qualquer candidata que o modelo ignore recebe um juizo seguro por
    omissao, para que nenhuma passe sem avaliacao.
    """
    if not candidates:
        return []

    # anthropic.Anthropic() le a chave da variavel de ambiente
    # ANTHROPIC_API_KEY. A chave nunca aparece em codigo.
    client = anthropic.Anthropic()

    message = client.messages.create(
        model=config.ANTHROPIC_MODEL,
        max_tokens=4096,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": _build_user_prompt(candidates)}],
    )

    text = "".join(
        block.text for block in message.content
        if getattr(block, "type", None) == "text"
    )

    raw_items = _extract_json_array(text)

    judgments = [
        _coerce_judgment(item, fallback_name="desconhecido")
        for item in raw_items if isinstance(item, dict)
    ]

    julgadas = {j.name for j in judgments}
    for c in candidates:
        if c.name not in julgadas:
            judgments.append(UpdateJudgment(
                name=c.name,
                risk="high",
                breaking_changes=True,
                rationale="O modelo nao avaliou esta dependencia.",
                pr_note="Requer revisao manual: sem avaliacao automatica.",
            ))

    return judgments


if __name__ == "__main__":
    # Primeiro pedido real a API: le dependencias, filtra as desatualizadas
    # e pede ao Claude um juizo de risco. Precisa da chave no ambiente.
    #   cd tools\dep-agent
    #   python -m dep_agent.judge
    from pathlib import Path
    from dotenv import load_dotenv
    from dep_agent.ecosystems.npm import NpmEcosystem, _find_repo_root

    load_dotenv()  # carrega o .env em execucao local; no Actions vem dos Secrets

    repo_root = _find_repo_root(Path(__file__).resolve())
    npm = NpmEcosystem()

    for rel_dir in config.NPM_PROJECT_DIRS:
        project_dir = repo_root / rel_dir
        deps = npm.read_inventory(project_dir)
        updates = npm.check_updates(deps)
        outdated = [u for u in updates if u.bump_type in ("patch", "minor", "major")]

        print(f"\n[{rel_dir}] a avaliar {len(outdated)} atualizacoes com o Claude...")
        judgments = judge_updates(outdated)
        by_name = {j.name: j for j in judgments}

        for u in outdated:
            j = by_name.get(u.name)
            if j is None:
                continue
            flag = "BREAKING" if j.breaking_changes else "        "
            print(f"  [{j.risk:<6}] {flag} {u.name}: {u.current_spec} -> {u.latest_version}")
            print(f"            {j.rationale}")