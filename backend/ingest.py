"""Injeta um texto livre (ou link/áudio) no Firestore via IA do Groq.

Uso:
    python ingest.py --entrada "Casa com energia solar e quintal no centro, aluguel 2500"
    python ingest.py --arquivo anuncio.txt
    python ingest.py --link "https://exemplo.com/imovel/123"
    python ingest.py --audio caminho/audio.mp3
"""

import argparse
import logging
import sys

from captura import capturar_conteudo
from estrutura import estruturar_imovel, transcrever_audio
from firestore_repo import salvar_imovel

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("ingest")


def main():
    parser = argparse.ArgumentParser(description="Ingestão de imóvel via Groq + Firestore")
    grupo = parser.add_mutually_exclusive_group(required=True)
    grupo.add_argument("--entrada", help="Texto livre do imóvel")
    grupo.add_argument("--arquivo", help="Caminho de um arquivo .txt com o anúncio")
    grupo.add_argument("--link", help="URL de um anúncio")
    grupo.add_argument("--audio", help="Caminho de um arquivo de áudio (.mp3/.m4a/.wav)")
    args = parser.parse_args()

    texto = None
    if args.arquivo:
        with open(args.arquivo, encoding="utf-8") as f:
            texto = f.read()
    elif args.link:
        logger.info("Capturando conteúdo do link %s...", args.link)
        texto = capturar_conteudo(args.link)
    elif args.audio:
        logger.info("Transcrevendo áudio %s...", args.audio)
        texto = transcrever_audio(args.audio)
    else:
        texto = args.entrada

    if not texto or not texto.strip():
        logger.error("Entrada vazia.")
        sys.exit(1)

    logger.info("Estruturando dados com Groq...")
    imovel = estruturar_imovel(texto)

    print("\nImóvel estruturado:")
    for k, v in imovel.items():
        print(f"  {k}: {v}")

    imovel_id = salvar_imovel(imovel)
    logger.info("Salvo no Firestore! Documento id: %s", imovel_id)


if __name__ == "__main__":
    main()
