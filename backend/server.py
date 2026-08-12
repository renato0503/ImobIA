"""Servidor HTTP (Flask) para ingestão de imóveis via API.

Permite integrar o backend com WhatsApp bots, bots de captação ou chamadas externas.

Uso:
    python server.py

Endpoints:
    GET  /health            → status do serviço
    POST /ingestir          → { "texto": "..." } | { "url": "..." } | { "audio": "..." }
"""

import argparse
import logging
import os
import sys
from pathlib import Path

from flask import Flask, jsonify, request

from captura import capturar_conteudo
from estrutura import estruturar_imovel, transcrever_audio
from firestore_repo import salvar_imovel

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("server")

app = Flask(__name__)

# Lista simples de tokens de API (configuráveis via variável de ambiente).
# Ex: API_TOKENS="tokenteste" separados por vírgula.
API_TOKENS = {
    token.strip()
    for token in os.getenv("API_TOKENS", "dev-token")
    if token.strip()
}


def _requer_token():
    """Valida o cabeçalho Authorization: Bearer <token>."""
    if not API_TOKENS or "dev-token" in API_TOKENS:
        return True  # modo dev
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "").strip()
    return token in API_TOKENS


@app.get("/health")
def health():
    return jsonify({"status": "ok", "servico": "imobia-ingest"})


@app.post("/ingestir")
def ingestir():
    if not _requer_token():
        return jsonify({"erro": "Não autorizado"}), 401

    dados = request.get_json(silent=True) or {}
    texto = dados.get("texto")
    url = dados.get("url")
    audio = dados.get("audio")

    try:
        if texto:
            conteudo = texto
        elif url:
            logger.info("Capturando URL %s", url)
            conteudo = capturar_conteudo(url)
        elif audio:
            # O upload de áudio pode chegar como caminho local (execução local)
            # ou como base64/data (futuro). Aqui aceitamos caminho local.
            if not Path(audio).exists():
                return jsonify({"erro": "Arquivo de áudio não encontrado"}), 400
            conteudo = transcrever_audio(audio)
        else:
            return jsonify({"erro": "Informe 'texto', 'url' ou 'audio'"}), 400

        if not conteudo.strip():
            return jsonify({"erro": "Conteúdo vazio"}), 400

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


def main():
    parser = argparse.ArgumentParser(description="Servidor de ingestão do ImobIA")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=5000)
    args = parser.parse_args()

    app.run(host=args.host, port=args.port, debug=False)


if __name__ == "__main__":
    main()
