"""
Implementacao do ecossistema npm.

Sabe: (1) inventario, (2) versoes novas estaveis, (3) vulnerabilidades
(npm audit) e (4) aplicar uma atualizacao (editar package.json +
verificar install/build). As tres primeiras sao read-only. A quarta
ESCREVE, por isso so deve correr num branch isolado.
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
    ApplyResult,
    Ecosystem,
)


_REGISTRY = "https://registry.npmjs.org"
_ABBREVIATED = "application/vnd.npm.install-v1+json"


# --- Deteccao de versoes novas -----------------------------------------------

def _is_prerelease(version: str) -> bool:
    core = version.strip().lstrip("^~>=<v ").strip()
    return "-" in core


def _parse_version(text: str | None) -> tuple[int, int, int] | None:
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

def _npm_exe() -> str | None:
    """Resolve o executavel do npm (npm.cmd no Windows, npm no Linux)."""
    return shutil.which("npm")


def _run_npm(args: list[str], project_dir: Path, timeout: float) -> subprocess.CompletedProcess | None:
    """
    Corre um comando npm FIXO na pasta do projeto, sem shell.

    args e sempre uma lista de tokens definidos por nos (nunca input do
    utilizador interpolado), com shell=False: fecha a porta a injecao de
    comandos. Devolve None se o npm nao estiver disponivel.
    """
    npm = _npm_exe()
    if npm is None:
        return None
    try:
        return subprocess.run(
            [npm, *args],
            cwd=str(project_dir),
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=False,
        )
    except Exception:
        return None


def _run_npm_audit(project_dir: Path, timeout: float = 120.0) -> dict | None:
    if not (project_dir / "package-lock.json").is_file():
        return None
    result = _run_npm(["audit", "--json"], project_dir, timeout)
    if result is None:
        return None
    out = (result.stdout or "").strip()
    if not out:
        return None
    try:
        return json.loads(out)
    except json.JSONDecodeError:
        return None


def _parse_audit(data: dict) -> list[Vulnerability]:
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


# --- Aplicar uma atualizacao (ESCREVE) ---------------------------------------

def _write_new_spec(manifest: Path, name: str, to_version: str) -> str | None:
    """
    Muda a versao de UM pacote no package.json, preservando o prefixo de
    intervalo original (ex: "^1.2.3" -> "^1.3.0"). Devolve o novo spec,
    ou None se o pacote nao estiver la. Le e reescreve o ficheiro inteiro
    para nao corromper formatacao com edicoes cirurgicas frageis.
    """
    data = json.loads(manifest.read_text(encoding="utf-8"))
    for section in ("dependencies", "devDependencies"):
        block = data.get(section)
        if isinstance(block, dict) and name in block:
            old = str(block[name])
            # Preserva o prefixo (^, ~) do intervalo original; se nao houver,
            # fica a versao exata.
            prefix = ""
            for ch in old:
                if ch in "^~":
                    prefix = ch
                break
            new_spec = f"{prefix}{to_version}"
            block[name] = new_spec
            manifest.write_text(
                json.dumps(data, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
            return new_spec
    return None


def _has_build_script(project_dir: Path) -> bool:
    data = json.loads((project_dir / "package.json").read_text(encoding="utf-8"))
    return "build" in data.get("scripts", {})


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
 
    def apply_update(self, project_dir: Path, name: str,
                     to_version: str, from_spec: str) -> ApplyResult:
        manifest = project_dir / "package.json"
        lockfile = project_dir / "package-lock.json"

     # Guardamos o estado antes de mexer, para reverter se algo falhar.
     # Assim uma atualizacao partida nunca fica no working tree.
        manifest_backup = manifest.read_text(encoding="utf-8")
        lock_backup = lockfile.read_text(encoding="utf-8") if lockfile.is_file() else None

        def _restore() -> None:
            manifest.write_text(manifest_backup, encoding="utf-8")
            if lock_backup is not None:
                lockfile.write_text(lock_backup, encoding="utf-8")

        new_spec = _write_new_spec(manifest, name, to_version)
        if new_spec is None:
            return ApplyResult(name, from_spec, to_version, False,
                               "Pacote nao encontrado no package.json.")

        install = _run_npm(["install"], project_dir, timeout=300.0)
        if install is None or install.returncode != 0:
            _restore()
            tail = ((install.stderr or install.stdout or "")[-400:]) if install else "npm indisponivel"
            return ApplyResult(name, from_spec, to_version, False,
                               f"npm install falhou: {tail}")

        if _has_build_script(project_dir):
            build = _run_npm(["run", "build"], project_dir, timeout=600.0)
            if build is None or build.returncode != 0:
                _restore()
                tail = ((build.stderr or build.stdout or "")[-400:]) if build else "npm indisponivel"
                return ApplyResult(name, from_spec, to_version, False,
                                   f"build falhou: {tail}")

        return ApplyResult(name, from_spec, to_version, True, "install + build OK.")


def _find_repo_root(start: Path) -> Path:
    for folder in (start, *start.parents):
        if (folder / ".git").exists():
            return folder
    raise RuntimeError("Nao encontrei a raiz do repositorio (.git).")