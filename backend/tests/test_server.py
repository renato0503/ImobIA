"""Testes dos endpoints do server.py usando o Flask test client."""

import pytest

from server import app


@pytest.fixture
def cliente(mocker):
    app.config.update(TESTING=True, RATELIMIT_ENABLED=False)
    # Evita chamadas reais ao Groq/Firestore nos testes
    mocker.patch("server.estruturar_imovel", return_value={
        "tipo": "Casa", "bairro": "Centro", "finalidade": "venda",
    })
    mocker.patch("server.salvar_imovel", return_value="doc-test-123")
    with app.test_client() as c:
        yield c


class TestHealth:
    def test_health_ok(self, cliente):
        resp = cliente.get("/health")
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "ok"


class TestIngestir:
    def test_payload_vazio(self, cliente):
        resp = cliente.post("/ingestir", json={})
        assert resp.status_code == 400
        assert "Informe" in resp.get_json()["erro"]

    def test_texto_e_url_juntos(self, cliente):
        resp = cliente.post(
            "/ingestir", json={"texto": "casa", "url": "https://exemplo.com"}
        )
        assert resp.status_code == 400
        assert "apenas um" in resp.get_json()["erro"]

    def test_texto_vazio(self, cliente):
        resp = cliente.post("/ingestir", json={"texto": "   "})
        assert resp.status_code == 400

    def test_audio_inexistente(self, cliente):
        resp = cliente.post("/ingestir", json={"audio": "nao/existe.mp3"})
        assert resp.status_code == 400
        assert "Arquivo de áudio" in resp.get_json()["erro"]

    def test_url_invalida(self, cliente):
        resp = cliente.post("/ingestir", json={"url": "nao-url"})
        assert resp.status_code == 400
        assert "URL inválida" in resp.get_json()["erro"]

    def test_texto_sucesso(self, cliente, mocker):
        resp = cliente.post("/ingestir", json={"texto": "Casa com piscina"})
        assert resp.status_code == 201
        dados = resp.get_json()
        assert dados["ok"] is True
        assert dados["id"] == "doc-test-123"
        assert dados["imovel"]["tipo"] == "Casa"


class TestWhatsapp:
    def test_texto_webhook_requer_corpo(self, cliente):
        resp = cliente.post("/whatsapp", data={"From": "whatsapp:+5511999999999"})
        # sem Body → erro de validação, retorna TwiML com a mensagem
        assert resp.status_code == 200
        assert "Informe 'texto'" in resp.get_data(as_text=True)

    def test_midia_nao_audio(self, cliente):
        resp = cliente.post(
            "/whatsapp",
            data={
                "From": "whatsapp:+5511999999999",
                "NumMedia": "1",
                "MediaUrl0": "https://exemplo.com/foto.jpg",
                "MediaContentType0": "image/jpeg",
            },
        )
        assert resp.status_code == 200
        assert "Envie um texto ou áudio" in resp.get_data(as_text=True)

    def test_twiml_content_type(self, cliente):
        resp = cliente.post(
            "/whatsapp", data={"From": "whatsapp:+5511", "Body": "casa"}
        )
        assert resp.content_type.startswith("text/xml")
        assert resp.get_data(as_text=True).startswith('<?xml version="1.0"')
