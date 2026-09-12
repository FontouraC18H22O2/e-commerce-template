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
    # A versao/intervalo tal como esta declarado (ex: "^1.2.3", "~4.0.0").
    current_spec: str
    # "prod" ou "dev": separa dependencias de producao das de desenvolvimento.
    kind: str


class Ecosystem(ABC):
    """
    Interface que cada ecossistema tem de implementar.

    O nucleo do agente so conhece este contrato; nunca fala diretamente
    com o npm ou o pip. E assim que o agente se mantem multi-linguagem.
    """

    # Nome curto do ecossistema, para mensagens e logs (ex: "npm").
    name: str

    @abstractmethod
    def read_inventory(self, project_dir: Path) -> list[Dependency]:
        """
        Le as dependencias declaradas num projeto.

        `project_dir` e a pasta (em caminho absoluto) onde vive o ficheiro
        de manifesto (package.json, requirements.txt, ...). Devolve o que
        esta declarado, sem julgar nada ainda.
        """
        raise NotImplementedError