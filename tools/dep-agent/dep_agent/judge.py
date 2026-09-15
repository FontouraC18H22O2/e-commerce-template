"""
Camada de AI do agente: avaliacao de risco das atualizacoes.

Recebe uma lista de UpdateCandidate e pede ao modelo um juizo sobre cada
uma: nivel de risco, probabilidade de breaking changes, uma justificacao
curta e uma nota pronta a por no Pull Request.

Fronteira de seguranca (o coracao deste modulo):
- O modelo RECEBE dados e DEVOLVE texto/juizo. Nunca executa nada.
- A resposta e validada de forma defensiva: campo invalido cai em valor
  seguro (risco alto). Falha para o lado seguro.
- Se o modelo estiver indisponivel, tentamos de novo com backoff; se
  falhar mesmo, marcamos tudo para revisao manual em vez de rebentar.

O provedor de AI esta isolado na funcao _call_model: trocar de modelo
(Gemini, Groq, Claude, ...) mexe so ai; o resto do ficheiro nao muda.
"""

from __future__ import annotations
import os
import json
import time
from dataclasses import dataclass

from google import genai
from google.genai import types
from google.genai import errors as genai_errors

from dep_agent import config
from dep_agent.ecosystems.base import UpdateCandidate


_ALLOWED_RISK = {"low", "medium", "high"}

# Resiliencia a falhas transitorias do provedor de AI.
_MAX_ATTEMPTS = 4          # tentativas totais antes de desistir
_RETRY_BASE_SLEEP = 2.0    # segundos; cresce exponencialmente (2, 4, 8...)
_RETRYABLE_CODES = {429, 503}  # rate limit e sobrecarga: vale a pena repetir


@dataclass(frozen=True)
class UpdateJudgment:
    """O juizo do modelo sobre uma atualizacao concreta."""
    name: str
    risk: str                 # "low" | "medium" | "high"
    breaking_changes: bool
    rationale: str
    pr_note: str


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


def _safe_fallback(name: str, reason: str) -> UpdateJudgment:
    """Juizo seguro por omissao: na duvida, risco alto e revisao manual."""
    return UpdateJudgment(
        name=name,
        risk="high",
        breaking_changes=True,
        rationale=reason,
        pr_note="Requer revisao manual.",
    )


def _coerce_judgment(item: dict, fallback_name: str) -> UpdateJudgment:
    """
    Converte um elemento do JSON do modelo num UpdateJudgment validado.

    Campo em falta ou invalido cai num valor seguro. Nunca confiamos
    cegamente no que o modelo devolve.
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

    Com response_mime_type=application/json o modelo ja devolve JSON puro,
    mas mantemos esta rede: removemos eventuais cercas de markdown e
    apanhamos do primeiro '[' ao ultimo ']'.
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


def _call_model(system_prompt: str, user_prompt: str) -> str:
    """
    Unico ponto que fala com o provedor de AI. Devolve o texto da resposta.

    A chave vem de GEMINI_API_KEY (nunca do codigo). Em falhas transitorias
    (429/503) tenta de novo com pausas crescentes; num erro definitivo
    (ex: chave invalida) desiste logo, sem insistir em vao.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("Falta a variavel de ambiente GEMINI_API_KEY.")

    client = genai.Client(api_key=api_key)

    for attempt in range(1, _MAX_ATTEMPTS + 1):
        try:
            response = client.models.generate_content(
                model=config.JUDGE_MODEL,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    temperature=0.2,
                    max_output_tokens=8192,
                ),
            )
            return response.text or ""
        except genai_errors.APIError as err:
            code = getattr(err, "code", None) or getattr(err, "status_code", None)
            # Erro definitivo (chave errada, pedido invalido) ou ultima
            # tentativa: nao insistimos, deixamos rebentar para cima.
            if code not in _RETRYABLE_CODES or attempt == _MAX_ATTEMPTS:
                raise
            sleep_s = _RETRY_BASE_SLEEP * (2 ** (attempt - 1))
            print(f"    modelo indisponivel (codigo {code}); nova tentativa "
                  f"em {sleep_s:.0f}s...")
            time.sleep(sleep_s)

    # Salvaguarda: o loop devolve ou levanta antes de chegar aqui.
    raise RuntimeError("Falha ao contactar o modelo apos varias tentativas.")


def judge_updates(candidates: list[UpdateCandidate]) -> list[UpdateJudgment]:
    """
    Pede ao modelo uma avaliacao de risco para todas as candidatas.

    Um unico pedido com todas. Se o modelo falhar por completo, NAO
    rebentamos a execucao: devolvemos um juizo seguro para cada candidata
    (revisao manual). Se o modelo responder mas ignorar alguma, essa
    tambem recebe o juizo seguro. Assim nenhuma passa sem avaliacao.
    """
    if not candidates:
        return []

    try:
        text = _call_model(_SYSTEM_PROMPT, _build_user_prompt(candidates))
        raw_items = _extract_json_array(text)
    except Exception as err:
        print(f"    aviso: avaliacao automatica indisponivel ({err}). "
              "Tudo marcado para revisao manual.")
        return [_safe_fallback(c.name, "Avaliacao automatica indisponivel.")
                for c in candidates]

    judgments = [
        _coerce_judgment(item, fallback_name="desconhecido")
        for item in raw_items if isinstance(item, dict)
    ]

    julgadas = {j.name for j in judgments}
    for c in candidates:
        if c.name not in julgadas:
            judgments.append(_safe_fallback(
                c.name, "O modelo nao avaliou esta dependencia."))

    return judgments


if __name__ == "__main__":
    # Pedido ao Gemini: le dependencias, filtra as desatualizadas e pede
    # um juizo de risco. Precisa da chave GEMINI_API_KEY no ambiente.
    #   cd tools\dep-agent
    #   python -m dep_agent.judge
    from pathlib import Path
    from dotenv import load_dotenv
    from dep_agent.ecosystems.npm import NpmEcosystem, _find_repo_root

    load_dotenv()

    repo_root = _find_repo_root(Path(__file__).resolve())
    npm = NpmEcosystem()

    for rel_dir in config.NPM_PROJECT_DIRS:
        project_dir = repo_root / rel_dir
        deps = npm.read_inventory(project_dir)
        updates = npm.check_updates(deps)
        outdated = [u for u in updates if u.bump_type in ("patch", "minor", "major")]

        print(f"\n[{rel_dir}] a avaliar {len(outdated)} atualizacoes com o modelo...")
        judgments = judge_updates(outdated)
        by_name = {j.name: j for j in judgments}

        for u in outdated:
            j = by_name.get(u.name)
            if j is None:
                continue
            flag = "BREAKING" if j.breaking_changes else "        "
            print(f"  [{j.risk:<6}] {flag} {u.name}: {u.current_spec} -> {u.latest_version}")
            print(f"            {j.rationale}")