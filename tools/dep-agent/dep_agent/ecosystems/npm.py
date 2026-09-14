"""
Implementacao do ecossistema npm.

Sabe: (1) ler o package.json (inventario), (2) descobrir versoes novas
ESTAVEIS via registry publico, e (3) detetar vulnerabilidades conhecidas
via `npm audit`. Tudo read-only: observa e classifica, nao altera nada.
Aplicar updates e abrir PRs vem nos passos seguintes.
"""

from __future__ import annotations
import json
import shutil
import subprocess
import urllib.request
import urllib.parse
from pathlib import Path

from dep_agent.ecosystems.base import (
    Dependency,
    UpdateCandidate,
    Vulnerability,
    Ecosystem,
)


_REGISTRY = "https://registry.npmjs.org"
_ABBREVIATED = "application/vnd.npm.install-v1+json"


# --- Deteccao de versoes novas -----------------------------------------------

def _is_prerelease(version: str) -> bool:
    """True se for pre-release (ex: 8.0.0-rc.14). Nunca as propomos."""
    core = version.strip().lstrip("^~>=<v ").strip()
    return "-" in core


def _parse_version(text: str | None) -> tuple[int, int, int] | None:
    """Extrai (major, minor, patch); None para versoes nao comparaveis."""
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


def _classify_bump(current, latest) -> str:
    if latest <= current:
        return "none"
    if latest[0] > current[0]:
        return "major"
    if latest[1] > current[1]:
        return "minor"
    return "patch"


def _latest_stable_from_doc(data: dict) -> str | None:
    """Ultima versao estavel; ignora pre-releases mesmo que sejam "latest"."""
    tag = data.get("dist-tags", {}).get("latest")
    if tag and not _is_prerelease(tag):
        return tag
    best = None
    best_str = None
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
    """GET ao registry; devolve None em qualquer problema (nao inventa)."""
    encoded = urllib.parse.quote(name, safe="@")
    url = f"{_REGISTRY}/{encoded}"
    req = urllib.request.Request(url, headers={"Accept": _ABBREVIATED})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None
    return _latest_stable_from_doc(data)


# --- Deteccao de vulnerabilidades (npm audit) --------------------------------

def _run_npm_audit(project_dir: Path, timeout: float = 120.0) -> dict | None:
    """
    Corre `npm audit --json` na pasta do projeto e devolve o JSON.

    Comando FIXO, sem shell e sem interpolar input do utilizador: fecha a
    porta a injecao de comandos. `npm audit` e read-only (le o lockfile e
    consulta a base de avisos; nao altera ficheiros). Devolve None quando
    nao e possivel auditar, para nunca fingirmos que esta tudo seguro.
    """
    if not (project_dir / "package-lock.json").is_file():
        return None
    npm_exe = shutil.which("npm")  # resolve npm.cmd no Windows, npm no Linux
    if npm_exe is None:
        return None
    try:
        result = subprocess.run(
            [npm_exe, "audit", "--json"],
            cwd=str(project_dir),
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=False,
        )
    except Exception:
        return None
    # `npm audit` devolve codigo != 0 quando encontra vulnerabilidades.
    # Isso e esperado: o que nos interessa e o JSON do stdout.
    out = (result.stdout or "").strip()
    if not out:
        return None
    try:
        return json.loads(out)
    except json.JSONDecodeError:
        return None


def _parse_audit(data: dict) -> list[Vulnerability]:
    """Converte o JSON do `npm audit` (formato npm v7+) em Vulnerability."""
    vulns: list[Vulnerability] = []
    for pkg, info in data.get("vulnerabilities", {}).items():
        fix = info.get("fixAvailable", False)
        if isinstance(fix, dict):
            fix_available = True
            fix_is_major = bool(fix.get("isSemVerMajor", False))
        else:
            fix_available = bool(fix)
            fix_is_major = False

        title = ""
        for via in info.get("via", []):
            if isinstance(via, dict) and via.get("title"):
                title = str(via["title"])
                break

        vulns.append(Vulnerability(
            package=str(pkg),
            severity=str(info.get("severity", "unknown")),
            is_direct=bool(info.get("isDirect", False)),
            fix_available=fix_available,
            fix_is_major=fix_is_major,
            title=title,
        ))
    return vulns


# --- Implementacao do contrato -----------------------------------------------

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
            bump = "unknown" if (current_v is None or latest_v is None) \
                else _classify_bump(current_v, latest_v)
            candidates.append(UpdateCandidate(
                name=dep.name, kind=dep.kind, current_spec=dep.current_spec,
                latest_version=latest, bump_type=bump,
            ))
        return candidates

    def check_vulnerabilities(self, project_dir: Path) -> list[Vulnerability]:
        data = _run_npm_audit(project_dir)
        if data is None:
            raise RuntimeError(
                f"Nao foi possivel auditar {project_dir} "
                "(falta package-lock.json, ou npm indisponivel)."
            )
        return _parse_audit(data)


def _find_repo_root(start: Path) -> Path:
    for folder in (start, *start.parents):
        if (folder / ".git").exists():
            return folder
    raise RuntimeError("Nao encontrei a raiz do repositorio (.git).")


if __name__ == "__main__":
    # Sinal de vida v3: versoes novas + vulnerabilidades conhecidas.
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

        print(f"\n[{rel_dir}] {len(deps)} dependencias, {len(outdated)} com versao nova")
        for u in outdated:
            print(f"  {u.bump_type:<5} {u.name}: {u.current_spec} -> {u.latest_version}")

        try:
            vulns = npm.check_vulnerabilities(project_dir)
        except RuntimeError as err:
            print(f"  [audit] {err}")
            continue

        if not vulns:
            print("  [audit] sem vulnerabilidades conhecidas.")
        else:
            direct = sum(1 for v in vulns if v.is_direct)
            print(f"  [audit] {len(vulns)} vulnerabilidades ({direct} diretas):")
            for v in vulns:
                scope = "direta" if v.is_direct else "transitiva"
                if not v.fix_available:
                    fix = "sem correcao"
                elif v.fix_is_major:
                    fix = "correcao disponivel (implica major/breaking)"
                else:
                    fix = "correcao disponivel"
                print(f"    - {v.severity:<8} {v.package} ({scope}) - {fix}")