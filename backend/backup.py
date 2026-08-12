"""Backup da coleção 'imoveis' (e 'leads') para arquivos JSON locais.

Custo zero: exporta os dados via firebase-admin para um arquivo JSON,
sem usar serviços pagos (ex: Cloud Storage export).

Uso:
    python backup.py                       # backup completo (imoveis + leads + usuarios)
    python backup.py --colecoes imoveis    # só uma coleção
    python backup.py --pasta backups       # diretório de saída
"""

import argparse
import json
import os
import time
from datetime import datetime

from firestore_repo import _inicializar

COLECOES_DEFAULT = ["imoveis", "leads", "usuarios"]


def _exportar_colecao(db, nome: str) -> list:
    docs = db.collection(nome).stream()
    registros = []
    for doc in docs:
        dados = doc.to_dict()
        dados["_id"] = doc.id
        registros.append(dados)
    return registros


def main():
    parser = argparse.ArgumentParser(description="Backup JSON do Firestore")
    parser.add_argument(
        "--colecoes",
        nargs="+",
        default=COLECOES_DEFAULT,
        help="Coleções a exportar (default: imoveis leads usuarios)",
    )
    parser.add_argument("--pasta", default="backups", help="Diretório de saída")
    args = parser.parse_args()

    db = _inicializar()
    os.makedirs(args.pasta, exist_ok=True)

    carimbo = datetime.now().strftime("%Y%m%d_%H%M%S")
    for nome in args.colecoes:
        registros = _exportar_colecao(db, nome)
        caminho = os.path.join(args.pasta, f"{nome}_{carimbo}.json")
        with open(caminho, "w", encoding="utf-8") as f:
            json.dump(registros, f, ensure_ascii=False, indent=2)
        print(f"  {nome}: {len(registros)} registros -> {caminho}")

    print("Backup concluído!")


if __name__ == "__main__":
    main()
