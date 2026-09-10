"""
Configuracao central do agente de dependencias.

Aqui vivem as REGRAS do agente (a sua politica) e as definicoes que
podem mudar de projeto para projeto. Quem ler so este ficheiro deve
perceber o que o agente pode e nao pode fazer, sem abrir mais nada.
"""

from __future__ import annotations
from dataclasses import dataclass


# Pastas (relativas a raiz do repo) onde existe um package.json a vigiar.
# Neste repo: o frontend (client) e o backend (server).
NPM_PROJECT_DIRS: list[str] = ["client", "server"]

# Branch base contra a qual os Pull Requests sao abertos.
DEFAULT_BASE_BRANCH: str = "master"

# Modelo do Claude usado na camada de juizo (judge.py).
# Sonnet: melhor equilibrio entre capacidade e custo para ler changelogs
# e avaliar risco, sem o preco do modelo de topo.
ANTHROPIC_MODEL: str = "claude-sonnet-5"


# --- Politica de atualizacoes ------------------------------------------------
# E aqui que a postura de seguranca vira codigo.

# Invariante global, nao negociavel: o agente NUNCA faz merge nem deploy.
# Abre sempre um Pull Request para revisao humana.
NEVER_AUTO_MERGE: bool = True

# Correcoes de seguranca (vulnerabilidades conhecidas) sao sempre propostas,
# mesmo que impliquem um salto de versao maior. Tem prioridade.
ALWAYS_PROPOSE_SECURITY_FIXES: bool = True


@dataclass(frozen=True)
class UpdatePolicy:
    """
    Como o agente reage a cada tipo de salto de versao (semver).

    'propose' -> inclui a atualizacao no Pull Request.
    'flag'    -> inclui, mas marca como risco elevado no resumo, para
                 chamar a atencao de quem revê.
    'skip'    -> nao propoe; fica para decisao manual explicita.
    """
    patch: str = "propose"   # 1.2.3 -> 1.2.4 : baixo risco
    minor: str = "propose"   # 1.2.3 -> 1.3.0 : risco moderado
    major: str = "flag"      # 1.2.3 -> 2.0.0 : alto risco de breaking changes


# Politica em vigor. Comecamos conservadores: propor patch e minor,
# sinalizar major. Podes endurecer ou suavizar isto mais tarde num so sitio.
UPDATE_POLICY = UpdatePolicy()