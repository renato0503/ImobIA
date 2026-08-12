"""Servidor HTTP (Flask) para ingestão de imóveis via API e webhook WhatsApp.

Permite integrar o backend com WhatsApp bots, bots de captação ou chamadas externas.

Uso:
    python server.py

Endpoints:
    GET  /health           → status do serviço
    POST /ingestir         → { "texto": "..." } | { "url": "..." } | { "audio": "..." }
    POST /whatsapp         → webhook estilo Twilio (Body / MediaUrl0 / NumMedia)
"""

import argparse
import logging
import os
from pathlib import Path

from flask import Flask, jsonify, request, Response
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from captura import capturar_conteudo
from estrutura import estruturar_imovel, transcrever_audio
from firestore_repo import salvar_imovel
from validacao import PayloadInvalido, validar_payload

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("server")

app = Flask(__name__)

# Rate limiting simples por IP (em memória). Em produção multi-instância,
# troque o storage por Redis (ex: "redis://localhost:6379").
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=os.getenv("RATE_LIMIT_STORAGE", "memory://"),
)
limiter.init_app(app)

# Limites padrão (configuráveis por env). Formato flask-limiter, ex: "30 per minute".
INGESTIR_LIMITE = os.getenv("INGESTIR_LIMITE", "30 per minute")
WHATSAPP_LIMITE = os.getenv("WHATSAPP_LIMITE", "60 per minute")

# Lista simples de tokens de API (configuráveis via variável de ambiente).
# Ex: API_TOKENS="tokenteste" separados por vírgula.
API_TOKENS = {
    token.strip()
    for token in os.getenv("API_TOKENS", "dev-token").split(",")
    if token.strip()
}


def _requer_token() -> bool:
    """Valida o cabeçalho Authorization: Bearer <token>."""
    if not API_TOKENS or "dev-token" in API_TOKENS:
        return True  # modo dev
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "").strip()
    return token in API_TOKENS


def _twiML(texto: str) -> str:
    """Monta resposta TwiML para o Twilio WhatsApp."""
    from xml.sax.saxutils import escape

    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        "<Response><Message>"
        f"{escape(texto)}"
        "</Message></Response>"
    )


@app.get("/health")
@limiter.exempt
def health():
    return jsonify({"status": "ok", "servico": "imobia-ingest"})


@app.post("/ingestir")
@limiter.limit(INGESTIR_LIMITE)
def ingestir():
    if not _requer_token():
        return jsonify({"erro": "Não autorizado"}), 401

    dados = request.get_json(silent=True) or {}
    try:
        payload = validar_payload(dados)
    except PayloadInvalido as exc:
        return jsonify({"erro": str(exc)}), 400

    try:
        if "texto" in payload:
            conteudo = payload["texto"]
        elif "url" in payload:
            logger.info("Capturando URL %s", payload["url"])
            conteudo = capturar_conteudo(payload["url"])
        else:
            # validação extra de existência para áudio
            caminho = payload["audio"]
            if not Path(caminho).exists():
                return jsonify({"erro": "Arquivo de áudio não encontrado"}), 400
            conteudo = transcrever_audio(caminho)

        imovel = estruturar_imovel(conteudo)
        imovel_id = salvar_imovel(imovel)
        return jsonify({"ok": True, "id": imovel_id, "imovel": imovel}), 201

    except FileNotFoundError as exc:
        logger.error("Arquivo de serviço ausente: %s", exc)
        return jsonify({"erro": "Backend não configurado (serviceAccount.json)"}), 500
    except RuntimeError as exc:
        logger.error("Erro de configuração: %s", exc)
        return jsonify({"erro": str(exc)}), 500
    except Exception as exc:  # noqa: BLE001 - API de borda
        logger.exception("Erro ao ingerir imóvel")
        return jsonify({"erro": f"Erro interno: {exc}"}), 500


@app.post("/whatsapp")
@limiter.limit(WHATSAPP_LIMITE)
def whatsapp():
    """Webhook estilo Twilio WhatsApp.

    Campos esperados (application/x-www-form-urlencoded):
      - From, To, Body
      - NumMedia, MediaUrl0, MediaContentType0

    Texto → ingere direto. Áudio → baixa o MediaUrl e transcreve.
    """
    # Suporta form-urlencoded (Twilio) e JSON (teste/local)
    if request.is_json:
        dados = request.get_json(silent=True) or {}
        corpo = dados.get("Body") or dados.get("texto")
        num_media = int(dados.get("NumMedia", 0) or 0)
        media_url = dados.get("MediaUrl0") or dados.get("media_url")
        media_tipo = dados.get("MediaContentType0") or dados.get("media_tipo", "")
    else:
        dados = request.form
        corpo = dados.get("Body", "")
        num_media = int(dados.get("NumMedia", "0") or "0")
        media_url = dados.get("MediaUrl0", "")
        media_tipo = dados.get("MediaContentType0", "")

    origem = dados.get("From", "desconhecido")
    logger.info("Mensagem WhatsApp de %s (media=%d)", origem, num_media)

    if num_media > 0 and media_url:
        try:
            if "audio" in media_tipo:
                conteudo = _transcrever_media_url(media_url)
            else:
                return Response(
                    _twiML("Envie um texto ou áudio descrevendo o imóvel."),
                    mimetype="text/xml",
                )
        except Exception as exc:  # noqa: BLE001
            logger.exception("Falha ao processar mídia")
            return Response(_twiML("Não consegui processar o áudio. Tente novamente."), mimetype="text/xml")
    else:
        try:
            conteudo = validar_payload({"texto": corpo})["texto"]
        except PayloadInvalido as exc:
            return Response(_twiML(str(exc)), mimetype="text/xml")

    try:
        imovel = estruturar_imovel(conteudo)
        imovel_id = salvar_imovel(imovel)
        resposta = (
            f"Imóvel cadastrado! {imovel['tipo']} em {imovel.get('bairro') or '?'}. "
            f"ID: {imovel_id}"
        )
        return Response(_twiML(resposta), mimetype="text/xml")
    except Exception as exc:  # noqa: BLE001
        logger.exception("Erro ao ingerir via WhatsApp")
        return Response(_twiML("Erro ao cadastrar o imóvel. Tente novamente."), mimetype="text/xml")


def _transcrever_media_url(url: str) -> str:
    """Baixa um áudio de uma URL e transcreve via Groq."""
    import tempfile

    import requests

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        resposta = requests.get(url, timeout=30)
        resposta.raise_for_status()
        tmp.write(resposta.content)
        caminho = tmp.name
    try:
        return transcrever_audio(caminho)
    finally:
        os.unlink(caminho)


def main():
    parser = argparse.ArgumentParser(description="Servidor de ingestão do ImobIA")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=5000)
    args = parser.parse_args()

    app.run(host=args.host, port=args.port, debug=False)


if __name__ == "__main__":
    main()
