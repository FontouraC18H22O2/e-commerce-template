"""
Coordenador de aplicacao de atualizacoes.

Recebe as decisoes do main.py e aplica APENAS as seguras (action ==
"propose"). Para cada uma, delega no ecossistema (que edita o manifesto
e corre install/build) e recolhe o resultado. Nao aplica majors nem toca
em nada fora do que a politica autorizou.

Este modulo NAO faz git nem abre PRs: so aplica ficheiros no working tree.
O git e o Pull Request vem no passo seguinte (github_pr.py).
"""

from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path

from dep_agent.ecosystems.base import ApplyResult
from dep_agent.ecosystems.npm import NpmEcosystem


@dataclass(frozen=True)
class ProjectApplyReport:
    """Resultado de aplicar as atualizacoes seguras a um projeto."""
    project: str
    applied: list[ApplyResult]   # as que passaram install/build
    failed: list[ApplyResult]    # as que falharam (revertidas, ver nota)


def apply_safe_updates(project: str, project_dir: Path, decisions) -> ProjectApplyReport:
    """
    Aplica, uma a uma, as decisoes marcadas "propose".

    Cada atualizacao e aplicada e verificada isoladamente. Se uma falhar o
    install/build, e registada como falha e seguimos para a proxima - nunca
    deixamos uma atualizacao partida contaminar as boas.
    """
    npm = NpmEcosystem()
    applied: list[ApplyResult] = []
    failed: list[ApplyResult] = []

    for d in decisions:
        if d.action != "propose" or not d.target_version:
            continue  # majors ("flag") e ignorados ("skip") ficam de fora
        result = npm.apply_update(
            project_dir=project_dir,
            name=d.name,
            to_version=d.target_version,
            from_spec=d.current_spec,
        )
        (applied if result.ok else failed).append(result)

    return ProjectApplyReport(project=project, applied=applied, failed=failed)