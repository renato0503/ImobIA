"""Testes unitários dos normalizadores de backend/estrutura.py."""

import pytest

from estrutura import (
    _normalizar,
    _normalizar_caracteristicas,
    _normalizar_finalidade,
    _normalizar_tipo,
    _normalizar_valor,
)


class TestNormalizarValor:
    def test_sem_simbolo(self):
        assert _normalizar_valor(2500) == 2500.0

    def test_formato_br_currency(self):
        assert _normalizar_valor("R$ 2.500,00") == 2500.0

    def test_virgula_decimal(self):
        assert _normalizar_valor("3.450,50") == 3450.5

    def test_none_vazio_null(self):
        assert _normalizar_valor(None) is None
        assert _normalizar_valor("") is None
        assert _normalizar_valor("null") is None

    def test_valor_invalido(self):
        assert _normalizar_valor("abc") is None


class TestNormalizarFinalidade:
    @pytest.mark.parametrize(
        "entrada,esperado",
        [
            ("venda", "venda"),
            ("vender", "venda"),
            ("comprar", "venda"),
            ("à venda", "venda"),
            ("aluguel", "aluguel"),
            ("alugar", "aluguel"),
            ("para alugar", "aluguel"),
            ("locação", "aluguel"),
            ("VENDa", "venda"),
            ("Ambos", "ambos"),
            ("qualquer coisa", "ambos"),
            (None, "ambos"),
        ],
    )
    def test_variacoes(self, entrada, esperado):
        assert _normalizar_finalidade(entrada) == esperado


class TestNormalizarTipo:
    def test_tipo_casa_abreviado(self):
        assert _normalizar_tipo("casa") == "Casa"

    def test_tipo_apartamento(self):
        assert _normalizar_tipo("apartamento") == "Apartamento"

    def test_tipo_nao_listado(self):
        assert _normalizar_tipo("studio") == "Studio"

    def test_tipo_vazio(self):
        assert _normalizar_tipo("") == "Imóvel"
        assert _normalizar_tipo(None) == "Imóvel"


class TestNormalizarCaracteristicas:
    def test_lista_lowercase(self):
        assert _normalizar_caracteristicas(["Energia Solar", "Quintal"]) == [
            "energia solar",
            "quintal",
        ]

    def test_string_unica(self):
        assert _normalizar_caracteristicas("piscina") == ["piscina"]

    def test_nao_lista(self):
        assert _normalizar_caracteristicas(42) == []

    def test_itens_vazios_removidos(self):
        assert _normalizar_caracteristicas(["garagem", "", "  "]) == ["garagem"]


class TestNormalizarCompleto:
    def test_imovel_aluguel_com_valor_br(self):
        dados = {
            "tipo": "casa",
            "finalidade": "para alugar",
            "valor_aluguel": "R$ 2.500,00",
            "caracteristicas": ["Energia Solar", "Quintal"],
        }
        norm = _normalizar(dados)
        assert norm["tipo"] == "Casa"
        assert norm["finalidade"] == "aluguel"
        assert norm["valor_aluguel"] == 2500.0
        assert norm["caracteristicas"] == ["energia solar", "quintal"]

    def test_bairro_default_quando_ausente(self):
        norm = _normalizar({})
        assert norm["bairro"] == "Outros"
        assert norm["tipo"] == "Imóvel"
        assert norm["finalidade"] == "ambos"
        assert norm["valor_venda"] is None
        assert norm["valor_aluguel"] is None
        assert norm["fotos"] == []

    def test_bairro_mapeado(self):
        norm = _normalizar({"bairro": "Centro"})
        assert norm["bairro"] == "Centro"

    def test_fotos_invalidas_viram_lista_vazia(self):
        norm = _normalizar({"fotos": "nao-e-lista"})
        assert norm["fotos"] == []

    def test_tipo_casa_em_condominio(self):
        norm = _normalizar({"tipo": "casa em condominio"})
        assert norm["tipo"] == "Casa em Condomínio"

    def test_contato_preservado(self):
        norm = _normalizar(
            {"contato_nome": "João", "contato_telefone": "(11) 99999-9999"}
        )
        assert norm["contato_nome"] == "João"
        assert norm["contato_telefone"] == "(11) 99999-9999"
