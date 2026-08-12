"""Testes do firestore_repo.py usando mocks (sem serviceAccount real)."""

from unittest.mock import Mock, patch

import pytest

import firestore_repo


def test_salvar_imovel_grava_criado_em():
    """salvar_imovel deve adicionar criado_em (ms) e persistir na coleção imoveis."""
    db_mock = Mock()
    doc_ref_mock = Mock()
    # db.collection('imoveis').add(registro) retorna tuple (write_result, doc_ref)
    db_mock.collection.return_value.add.return_value = (None, doc_ref_mock)
    doc_ref_mock.id = "abc123"

    with patch("firestore_repo._inicializar", return_value=db_mock) as mock_init:
        resultado = firestore_repo.salvar_imovel({"tipo": "Casa", "bairro": "Centro"})

    assert resultado == "abc123"
    mock_init.assert_called_once()

    registro_enviado = db_mock.collection.return_value.add.call_args[0][0]
    assert registro_enviado["tipo"] == "Casa"
    assert isinstance(registro_enviado["criado_em"], (int, float))
    assert registro_enviado["criado_em"] > 0


def test_salvar_imovel_sem_service_account():
    """Sem serviceAccount.json, _inicializar levanta FileNotFoundError."""
    with patch("firestore_repo.SERVICE_ACCOUNT_PATH", "inexistente.json"):
        with patch("firestore_repo.os.path.exists", return_value=False):
            # garante que o cache global não mascare o teste
            firestore_repo._app = None
            firestore_repo._db = None
            with pytest.raises(FileNotFoundError):
                firestore_repo._inicializar()
    firestore_repo._app = None
    firestore_repo._db = None


def test_salvar_imovel_sem_alterar_dados_originais():
    """O dict de entrada não pode ser mutado pela função."""
    db_mock = Mock()
    doc_ref_mock = Mock()
    db_mock.collection.return_value.add.return_value = (None, doc_ref_mock)
    doc_ref_mock.id = "xyz"

    dados = {"tipo": "Apartamento"}
    dados_originais = dict(dados)

    with patch("firestore_repo._inicializar", return_value=db_mock):
        firestore_repo.salvar_imovel(dados)

    assert dados == dados_originais
