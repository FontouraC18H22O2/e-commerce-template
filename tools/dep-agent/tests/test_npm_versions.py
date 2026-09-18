"""
Testes da logica de versoes do ecossistema npm.

Estas funcoes sao puras (sem rede, sem ficheiros): rapidas, deterministas
e faceis de raciocinar - o ponto ideal para comecar.

O teste central e o do Prisma: reproduz o bug real que apanhamos (a
etiqueta "latest" a apontar para uma release candidate) e garante que
nunca mais volta sem alguem dar por isso.
"""

from dep_agent.ecosystems.npm import (
    _is_prerelease,
    _parse_version,
    _classify_bump,
    _latest_stable_from_doc,
)


class TestIsPrerelease:
    def test_versao_estavel_nao_e_prerelease(self):
        assert _is_prerelease("7.10.0") is False

    def test_release_candidate_e_prerelease(self):
        assert _is_prerelease("8.0.0-rc.14") is True

    def test_beta_e_prerelease(self):
        assert _is_prerelease("2.0.0-beta.1") is True

    def test_prefixo_de_intervalo_nao_confunde(self):
        # O "^" e um prefixo de intervalo, nao um sufixo de pre-release.
        assert _is_prerelease("^7.10.0") is False


class TestParseVersion:
    def test_versao_simples(self):
        assert _parse_version("1.2.3") == (1, 2, 3)

    def test_ignora_prefixo_de_intervalo(self):
        assert _parse_version("^1.2.3") == (1, 2, 3)
        assert _parse_version("~4.0.0") == (4, 0, 0)

    def test_ignora_sufixo_de_prerelease(self):
        assert _parse_version("8.0.0-rc.14") == (8, 0, 0)

    def test_versao_incompleta_devolve_none(self):
        assert _parse_version("1.2") is None

    def test_range_exotico_devolve_none(self):
        assert _parse_version("*") is None
        assert _parse_version(None) is None


class TestClassifyBump:
    def test_patch(self):
        assert _classify_bump((1, 2, 3), (1, 2, 4)) == "patch"

    def test_minor(self):
        assert _classify_bump((1, 2, 3), (1, 3, 0)) == "minor"

    def test_major(self):
        assert _classify_bump((1, 2, 3), (2, 0, 0)) == "major"

    def test_mesma_versao_e_none(self):
        assert _classify_bump((1, 2, 3), (1, 2, 3)) == "none"

    def test_downgrade_e_none(self):
        # Se o "ultimo" for inferior ao atual, tratamos como "sem
        # atualizacao" em vez de propor um downgrade.
        assert _classify_bump((2, 0, 0), (1, 9, 9)) == "none"


class TestLatestStableFromDoc:
    def test_usa_latest_quando_estavel(self):
        doc = {
            "dist-tags": {"latest": "2.11.0"},
            "versions": {"2.10.0": {}, "2.11.0": {}},
        }
        assert _latest_stable_from_doc(doc) == "2.11.0"

    def test_o_bug_do_prisma(self):
        # Cenario real que nos mordeu: "latest" aponta para uma release
        # candidate. O agente NAO pode propor uma rc - tem de escolher a
        # ultima ESTAVEL da lista de versoes.
        doc = {
            "dist-tags": {"latest": "8.0.0-rc.14"},
            "versions": {"6.12.0": {}, "7.10.0": {}, "8.0.0-rc.14": {}},
        }
        assert _latest_stable_from_doc(doc) == "7.10.0"

    def test_sem_versoes_estaveis_devolve_none(self):
        doc = {
            "dist-tags": {"latest": "1.0.0-beta.1"},
            "versions": {"1.0.0-beta.1": {}},
        }
        assert _latest_stable_from_doc(doc) is None