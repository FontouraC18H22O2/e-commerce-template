"""
Testes da logica que ESCREVE no package.json (_write_new_spec).

Ao contrario dos testes de versoes (funcoes puras), estes mexem num
ficheiro. Usamos o tmp_path do pytest: uma pasta temporaria, unica para
cada teste, que o pytest cria e limpa sozinho. Assim testamos a escrita
a serio sem nunca tocar nos teus ficheiros reais.

Esta e a unica peca do agente que altera os teus ficheiros, por isso e a
que mais merece uma rede de testes.
"""

import json
from pathlib import Path

from dep_agent.ecosystems.npm import _write_new_spec


def _make_manifest(tmp_path: Path, data: dict) -> Path:
    """Escreve um package.json de teste no tmp_path e devolve o caminho."""
    manifest = tmp_path / "package.json"
    manifest.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return manifest


def _read(manifest: Path) -> dict:
    return json.loads(manifest.read_text(encoding="utf-8"))


class TestWriteNewSpec:
    def test_preserva_prefixo_caret(self, tmp_path):
        manifest = _make_manifest(tmp_path, {
            "dependencies": {"react": "^19.2.8"},
        })
        novo = _write_new_spec(manifest, "react", "19.3.0")
        assert novo == "^19.3.0"
        assert _read(manifest)["dependencies"]["react"] == "^19.3.0"

    def test_preserva_prefixo_tilde(self, tmp_path):
        manifest = _make_manifest(tmp_path, {
            "dependencies": {"pg": "~8.23.0"},
        })
        novo = _write_new_spec(manifest, "pg", "8.24.0")
        assert novo == "~8.24.0"

    def test_versao_exata_continua_exata(self, tmp_path):
        # Sem prefixo de intervalo, mantem-se exata (o mais conservador).
        manifest = _make_manifest(tmp_path, {
            "dependencies": {"left-pad": "1.2.3"},
        })
        novo = _write_new_spec(manifest, "left-pad", "1.3.0")
        assert novo == "1.3.0"

    def test_funciona_em_devdependencies(self, tmp_path):
        manifest = _make_manifest(tmp_path, {
            "dependencies": {},
            "devDependencies": {"vite": "^8.2.2"},
        })
        novo = _write_new_spec(manifest, "vite", "8.3.0")
        assert novo == "^8.3.0"
        assert _read(manifest)["devDependencies"]["vite"] == "^8.3.0"

    def test_pacote_inexistente_devolve_none(self, tmp_path):
        manifest = _make_manifest(tmp_path, {
            "dependencies": {"react": "^19.2.8"},
        })
        assert _write_new_spec(manifest, "nao-existe", "1.0.0") is None

    def test_nao_estraga_o_resto_do_ficheiro(self, tmp_path):
        # A funcao reescreve o ficheiro INTEIRO. Este teste garante que so
        # muda a dependencia pedida e preserva tudo o resto intacto.
        manifest = _make_manifest(tmp_path, {
            "name": "a-minha-loja",
            "version": "1.0.0",
            "scripts": {"build": "vite build"},
            "dependencies": {"react": "^19.2.8", "stripe": "^22.5.0"},
        })
        _write_new_spec(manifest, "react", "19.3.0")

        data = _read(manifest)
        assert data["name"] == "a-minha-loja"
        assert data["version"] == "1.0.0"
        assert data["scripts"] == {"build": "vite build"}
        assert data["dependencies"]["stripe"] == "^22.5.0"   # intacta
        assert data["dependencies"]["react"] == "^19.3.0"    # a unica alterada