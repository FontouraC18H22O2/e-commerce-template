"""
Implementacao do ecossistema npm.

Sabe fazer o inventario (ler package.json) e descobrir que versoes novas
ESTAVEIS existem, consultando o registry publico do npm. Ainda nao aplica
nada: so observa e classifica. Aplicar updates e abrir PRs vem depois.
"""

from __future__ import annotations
import json
import urllib.request
import urllib.parse
from pathlib import Path

from dep_agent.ecosystems.base import Dependency, UpdateCandidate, Ecosystem


_REGISTRY = "https://registry.npmjs.org"
# Versao "abreviada" do documento do pacote (bem mais pequena), que inclui
# na mesma as dist-tags e a lista de versoes de que precisamos.
_ABBREVIATED = "application/vnd.npm.install-v1+json"


def _is_prerelease(version: str) -> bool:
    """
    True se a versao for uma pre-release (ex: 8.0.0-rc.14, 2.0.0-beta.1).

    Pela regra do semver, qualquer versao com sufixo apos '-' e uma
    pre-release: instavel por definicao. Nunca as propomos.
    """
    core = version.strip().lstrip("^~>=<v ").strip()
    return "-" in core


def _parse_version(text: str | None) -> tuple[int, int, int] | None:
    """
    Extrai (major, minor, patch) de uma string de versao.

    Ignora prefixos de intervalo (^, ~, >=, v) e o sufixo de pre-release.
    Devolve None para o que nao seja uma versao simples comparavel com
    seguranca (ranges complexos, "*", aliases...).
    """
    if not text:
        return None
    cleaned = text.strip().lstrip("^~>=<v ").strip()
    core = cleaned.split("-")[0].split("+")[0]
    parts = core.split(".")
    if len(parts) < 3:
        return None
    try:
        return (int(parts[0]), int(parts[1]), int(parts[2]))
    except ValueError:
        return None


def _classify_bump(current: tuple[int, int, int],
                   latest: tuple[int, int, int]) -> str:
    """Classifica o salto entre duas versoes segundo o semver."""
    if latest <= current:
        return "none"
    if latest[0] > current[0]:
        return "major"
    if latest[1] > current[1]:
        return "minor"
    return "patch"


def _latest_stable_from_doc(data: dict) -> str | None:
    """
    Determina a ultima versao ESTAVEL a partir do documento do registry.

    Caminho normal: a dist-tag "latest" ja aponta para uma versao estavel.
    Mas nem sempre - ha pacotes cujo "latest" aponta para uma release
    candidate (o Prisma e um deles). Por isso, se a "latest" for
    pre-release (ou nao existir), varremos a lista de versoes e escolhemos
    a estavel mais alta. Assim nunca propomos uma pre-release por engano.
    """
    tag = data.get("dist-tags", {}).get("latest")
    if tag and not _is_prerelease(tag):
        return tag

    best: tuple[int, int, int] | None = None
    best_str: str | None = None
    for ver in data.get("versions", {}).keys():
        if _is_prerelease(ver):
            continue
        parsed = _parse_version(ver)
        if parsed is None:
            continue
        if best is None or parsed > best:
            best = parsed
            best_str = ver
    return best_str


def _fetch_latest_stable(name: str, timeout: float = 10.0) -> str | None:
    """
    Consulta o registry do npm e devolve a ultima versao estavel publicada.

    Devolve None em qualquer problema (sem rede, pacote privado, resposta
    inesperada): preferimos "nao sei" a inventar. Nunca corre comandos -
    e so um GET HTTP a um URL que nos proprios construimos.
    """
    encoded = urllib.parse.quote(name, safe="@")  # mantem "@", codifica "/"
    url = f"{_REGISTRY}/{encoded}"
    req = urllib.request.Request(url, headers={"Accept": _ABBREVIATED})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None
    return _latest_stable_from_doc(data)


class NpmEcosystem(Ecosystem):
    name = "npm"

    def read_inventory(self, project_dir: Path) -> list[Dependency]:
        manifest = project_dir / "package.json"
        if not manifest.is_file():
            raise FileNotFoundError(f"Nao existe package.json em: {project_dir}")

        data = json.loads(manifest.read_text(encoding="utf-8"))

        deps: list[Dependency] = []
        for spec_key, kind in (("dependencies", "prod"), ("devDependencies", "dev")):
            for name, spec in data.get(spec_key, {}).items():
                deps.append(Dependency(name=name, current_spec=str(spec), kind=kind))
        return deps

    def check_updates(self, deps: list[Dependency]) -> list[UpdateCandidate]:
        candidates: list[UpdateCandidate] = []
        for dep in deps:
            latest = _fetch_latest_stable(dep.name)
            current_v = _parse_version(dep.current_spec)
            latest_v = _parse_version(latest)

            if current_v is None or latest_v is None:
                bump = "unknown"
            else:
                bump = _classify_bump(current_v, latest_v)

            candidates.append(UpdateCandidate(
                name=dep.name,
                kind=dep.kind,
                current_spec=dep.current_spec,
                latest_version=latest,
                bump_type=bump,
            ))
        return candidates


def _find_repo_root(start: Path) -> Path:
    """Sobe na arvore de pastas ate a raiz do repo (a que tem .git)."""
    for folder in (start, *start.parents):
        if (folder / ".git").exists():
            return folder
    raise RuntimeError("Nao encontrei a raiz do repositorio (.git).")


if __name__ == "__main__":
    # Sinal de vida v2: le as dependencias e diz quais tem versao ESTAVEL nova.
    #   cd tools\dep-agent
    #   python -m dep_agent.ecosystems.npm
    from dep_agent import config

    repo_root = _find_repo_root(Path(__file__).resolve())
    npm = NpmEcosystem()

    for rel_dir in config.NPM_PROJECT_DIRS:
        project_dir = repo_root / rel_dir
        deps = npm.read_inventory(project_dir)
        updates = npm.check_updates(deps)

        outdated = [u for u in updates if u.bump_type in ("patch", "minor", "major")]
        print(f"\n[{rel_dir}] {len(deps)} dependencias, {len(outdated)} com versao nova:")
        for u in updates:
            if u.bump_type in ("patch", "minor", "major"):
                print(f"  {u.bump_type:<5} {u.name}: {u.current_spec} -> {u.latest_version}")
        for u in updates:
            if u.bump_type == "unknown":
                print(f"  (?)   {u.name}: nao consegui verificar ({u.current_spec})")