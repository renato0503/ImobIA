"""Testes do captura.py com requests/BeautifulSoup mockados."""

import pytest

from captura import capturar_conteudo


class TestValidacaoUrl:
    def test_url_invalida_nao_http(self):
        with pytest.raises(ValueError):
            capturar_conteudo("ftp://exemplo.com")

    def test_url_vazia(self):
        with pytest.raises(ValueError):
            capturar_conteudo("")

    def test_url_sem_dominio(self):
        with pytest.raises(ValueError):
            capturar_conteudo("nota-uma-url")


class TestExtracao:
    def test_extrai_titulo_e_paragrafos(self, mocker):
        html = """
        <html>
          <head>
            <title>Casa em Condomínio à venda</title>
            <meta name="description" content="Casa com piscina e 3 quartos" />
          </head>
          <body>
            <main>
              <p>Ampla casa em condomínio fechado, 4 quartos, energia solar e quintal.</p>
              <p>Valor R$ 850.000, contato (11) 99999-9999.</p>
            </main>
            <footer>© 2026 Portal</footer>
          </body>
        </html>
        """
        resp = mocker.Mock()
        resp.text = html
        mocker.patch("captura.requests.get", return_value=resp)

        texto = capturar_conteudo("https://exemplo.com/imovel/1")

        assert "Casa em Condomínio à venda" in texto
        assert "Casa com piscina e 3 quartos" in texto
        assert "energia solar e quintal" in texto
        assert "© 2026 Portal" not in texto

    def test_url_valida_aceita(self, mocker):
        resp = mocker.Mock()
        resp.text = "<html><body><p>Texto do anúncio com informação suficiente para teste.</p></body></html>"
        mocker.patch("captura.requests.get", return_value=resp)
        texto = capturar_conteudo("https://exemplo.com/imovel/2")
        assert "Texto do anúncio" in texto

    def test_sem_conteudo_levanta_erro(self, mocker):
        resp = mocker.Mock()
        resp.text = "<html><body><nav>menu</nav></body></html>"
        mocker.patch("captura.requests.get", return_value=resp)
        with pytest.raises(ValueError):
            capturar_conteudo("https://exemplo.com/imovel/3")

    def test_http_error_propagado(self, mocker):
        resp = mocker.Mock()
        resp.raise_for_status.side_effect = Exception("HTTP 404")
        mocker.patch("captura.requests.get", return_value=resp)
        with pytest.raises(Exception):
            capturar_conteudo("https://exemplo.com/imovel/4")
