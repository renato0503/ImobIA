"""Persistência no Firestore usando firebase-admin."""

import os
import time

import firebase_admin
from firebase_admin import credentials, firestore

from config import SERVICE_ACCOUNT_PATH

_app = None
_db = None


def _inicializar():
    global _app, _db
    if _app is not None:
        return _db

    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        raise FileNotFoundError(
            f"Chave de serviço não encontrada em {SERVICE_ACCOUNT_PATH}. "
            "Baixe-a no Firebase Console (Configurações > Contas de serviço)."
        )

    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    _app = firebase_admin.initialize_app(cred)
    _db = firestore.client(_app)
    return _db


def salvar_imovel(dados: dict) -> str:
    """Salva um imóvel estruturado na coleção 'imoveis' e retorna o id."""
    db = _inicializar()

    registro = dict(dados)
    registro["criado_em"] = time.time() * 1000  # ms, para casar com o frontend

    doc_ref = db.collection("imoveis").add(registro)
    return doc_ref[1].id


def listar_imoveis(limite: int = 100) -> list:
    """Lista imóveis salvos (útil para testes e logs)."""
    db = _inicializar()
    docs = (
        db.collection("imoveis")
        .order_by("criado_em", direction=firestore.Query.DESCENDING)
        .limit(limite)
        .stream()
    )
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]
