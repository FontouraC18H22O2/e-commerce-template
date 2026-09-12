"""
Implementacao do ecossistema npm.

Por agora sabe apenas fazer o INVENTARIO: ler o package.json e devolver
a lista de dependencias. Os passos seguintes (versoes novas,
vulnerabilidades, aplicar updates) sao acrescentados aqui, um a um.
"""

from __future__ import annotations
import json
from pathlib import Path

from dep_agent.ecosystems.base import Dependency, Ecosystem


class NpmEcosystem(Ecosystem):
    name = "npm"

    def read_inventory(self, project_dir: Path) -> list[Dependency]:
        manifest = project_dir / "package.json"
        if not manifest.is_file():
            # Falha explicita: preferimos um erro claro a devolver uma lista
            # vazia em silencio e mascarar um caminho mal configurado.
            raise FileNotFoundError(f"Nao existe package.json em: {project_dir}")

        data = json.loads(manifest.read_text(encoding="utf-8"))

        deps: list[Dependency] = []
        # "dependencies" sao de producao; "devDependencies" so de
        # desenvolvimento. Guardamos a distincao para decisoes futuras.
        for spec_key, kind in (("dependencies", "prod"), ("devDependencies", "dev")):
            for name, spec in data.get(spec_key, {}).items():
                deps.append(Dependency(name=name, current_spec=str(spec), kind=kind))

        return deps


def _find_repo_root(start: Path) -> Path:
    """Sobe na arvore de pastas ate a raiz do repo (a que tem .git)."""
    for folder in (start, *start.parents):
        if (folder / ".git").exists():
            return folder
    raise RuntimeError("Nao encontrei a raiz do repositorio (.git).")


if __name__ == "__main__":
    # Demo de "sinal de vida": corre este modulo diretamente para ver
    # o agente a listar dependencias. Nao precisa de chaves nem de rede.
    #   cd tools/dep-agent
    #   python -m dep_agent.ecosystems.npm
    from dep_agent import config

    repo_root = _find_repo_root(Path(__file__).resolve())
    npm = NpmEcosystem()

    for rel_dir in config.NPM_PROJECT_DIRS:
        project_dir = repo_root / rel_dir
        deps = npm.read_inventory(project_dir)
        print(f"\n[{rel_dir}] {len(deps)} dependencias:")
        for d in deps:
            marker = "(dev)" if d.kind == "dev" else "     "
            print(f"  {marker} {d.name} {d.current_spec}")