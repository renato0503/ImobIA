"""Testes do validacao.py."""

import pytest

from validacao import (
    PayloadInvalido,
    validar_audio,
    validar_payload,
    validar_texto,
    validar_url,
)


class TestValidarTexto:
    def test_texto_valido(self):
        assert validar_texto("  Casa com piscina  ") == "Casa com piscina"

    def test_texto_vazio(self):
        with pytest.raises(PayloadInvalido):
            validar_texto("   ")

    def test_texto_none(self):
        with pytest.raises(PayloadInvalido):
            validar_texto(None)

    def test_texto_nao_string(self):
        with pytest.raises(PayloadInvalido):
            validar_texto(123)

    def test_texto_muito_longo(self):
        with pytest.raises(PayloadInvalido):
            validar_texto("a" * 7000)


class TestValidarUrl:
    def test_url_http_valida(self):
        assert validar_url("http://exemplo.com/imovel/1") == "http://exemplo.com/imovel/1"

    def test_url_https_valida(self):
        assert validar_url("https://exemplo.com") == "https://exemplo.com"

    def test_url_ftp_invalida(self):
        with pytest.raises(PayloadInvalido):
            validar_url("ftp://exemplo.com")

    def test_url_sem_dominio(self):
        with pytest.raises(PayloadInvalido):
            validar_url("nao-e-uma-url")

    def test_url_none(self):
        with pytest.raises(PayloadInvalido):
            validar_url(None)


class TestValidarAudio:
    def test_audio_extensao_valida(self):
        assert validar_audio("/tmp/audio.mp3") == "/tmp/audio.mp3"

    def test_audio_extensao_invalida(self):
        with pytest.raises(PayloadInvalido):
            validar_audio("/tmp/arquivo.exe")

    def test_audio_vazio(self):
        with pytest.raises(PayloadInvalido):
            validar_audio("   ")

    def test_audio_none(self):
        with pytest.raises(PayloadInvalido):
            validar_audio(None)


class TestValidarPayload:
    def test_apenas_texto(self):
        assert validar_payload({"texto": "casa"}) == {"texto": "casa"}

    def test_apenas_url(self):
        assert validar_payload({"url": "https://exemplo.com"}) == {"url": "https://exemplo.com"}

    def test_apenas_audio(self):
        assert validar_payload({"audio": "/tmp/a.mp3"}) == {"audio": "/tmp/a.mp3"}

    def test_mais_de_um_campo(self):
        with pytest.raises(PayloadInvalido):
            validar_payload({"texto": "casa", "url": "https://exemplo.com"})

    def test_sem_campo(self):
        with pytest.raises(PayloadInvalido):
            validar_payload({"foo": "bar"})

    def test_payload_nao_dict(self):
        with pytest.raises(PayloadInvalido):
            validar_payload(["texto"])
