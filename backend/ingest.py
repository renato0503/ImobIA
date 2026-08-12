"""Injeta um texto livre (ou link) no Firestore via IA do Groq.

Uso:
    python ingest.py --entrada "Casa com energia solar e quintal no centro, aluguel 2500"
    python ingest.py --arquivo anuncio.txt
    python ingest.py --link "https://exemplo.com/imovel/123"
"""

import argparse
import sys

from estrutura import estruturar_imovel
from firestore_repo import salvar_imovel


def main():
    parser = argparse.ArgumentParser(description="Ingestão de imóvel via Groq + Firestore")
    grupo = parser.add_mutually_exclusive_group(required=True)
    grupo.add_argument("--entrada", help="Texto livre do imóvel")
    grupo.add_argument("--arquivo", help="Caminho de um arquivo .txt com o anúncio")
    grupo.add_argument("--link", help="URL de um anúncio")
    args = parser.parse_args()

    if args.arquivo:
        with open(args.arquivo, encoding="utf-8") as f:
            texto = f.read()
    elif args.link:
        texto = f"Anúncio de imóvel (conteúdo da página): {args.link}"
    else:
        texto = args.entrada

    if not texto.strip():
        print("Entrada vazia.", file=sys.stderr)
        sys.exit(1)

    print("Estruturando dados com Groq...")
    imovel = estruturar_imovel(texto)

    print("\nImóvel estruturado:")
    for k, v in imovel.items():
        print(f"  {k}: {v}")

    imovel_id = salvar_imovel(imovel)
    print(f"\nSalvo no Firestore! Documento id: {imovel_id}")


if __name__ == "__main__":
    main()
