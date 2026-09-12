"""
Contrato comum a todos os ecossistemas de dependencias.

Um "ecossistema" e o npm, o pip, o composer, etc. Cada um sabe mexer
nas dependencias a sua maneira, mas todos expoem a MESMA interface,
definida aqui. E isto que permite acrescentar linguagens no futuro sem
tocar no nucleo do agente: basta uma classe nova que cumpra este contrato.
"""

from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Dependency:
    """Uma dependencia declarada num projeto."""
    name: str
    current_spec: str   # versao/intervalo declarado (ex: "^1.2.3", "~4.0.0")
    kind: str           # "prod" ou "dev"


@dataclass(frozen=True)
class UpdateCandidate:
    """Uma dependencia analisada quanto a existencia de versao mais recente."""
    name: str
    kind: str                    # "prod" ou "dev"
    current_spec: str            # tal como declarado (ex: "^1.2.3")
    latest_version: str | None   # ultima versao publicada, ou None se desconhecida
    bump_type: str               # "patch" | "minor" | "major" | "none" | "unknown"


class Ecosystem(ABC):
    """
    Interface que cada ecossistema tem de implementar.

    O nucleo do agente so conhece este contrato; nunca fala diretamente
    com o npm ou o pip. E assim que o agente se mantem multi-linguagem.
    """

    name: str   # nome curto do ecossistema (ex: "npm")

    @abstractmethod
    def read_inventory(self, project_dir: Path) -> list[Dependency]:
        """
        Le as dependencias declaradas num projeto (sem julgar nada ainda).
        `project_dir` e a pasta absoluta onde vive o manifesto.
        """
        raise NotImplementedError

    @abstractmethod
    def check_updates(self, deps: list[Dependency]) -> list[UpdateCandidate]:
        """
        Para cada dependencia, descobre a ultima versao disponivel e
        classifica o tipo de salto (patch/minor/major). Nao aplica nada.
        """
        raise NotImplementedError