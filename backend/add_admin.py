"""Cria (ou promove) um usuário na coleção 'usuarios' com papel admin/owner.

Uso:
    python add_admin.py --uid ef6Nu3M7FMRjaSmmTSvGlfOOiQI3 --email gestor.renatorosa@gmail.com

Pré-requisito: backend/serviceAccount.json com a chave privada do Firebase.
"""

import argparse

from firestore_repo import _inicializar


def main():
    parser = argparse.ArgumentParser(description="Define papel admin para um usuário")
    parser.add_argument("--uid", required=True, help="UID do usuário (Firebase Auth)")
    parser.add_argument("--email", required=True, help="E-mail do usuário")
    parser.add_argument("--role", default="admin", choices=["admin", "owner", "leitor"])
    args = parser.parse_args()

    db = _inicializar()

    registro = {
        "role": args.role,
        "email": args.email,
        "criado_em": __import__("time").time(),
    }

    db.collection("usuarios").document(args.uid).set(registro, merge=True)
    print(
        f"Usuário {args.email} ({args.uid}) definido como '{args.role}' na coleção usuarios."
    )


if __name__ == "__main__":
    main()
