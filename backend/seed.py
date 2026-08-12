"""Popula a coleção 'imoveis' com dados de exemplo (útil no início).

Os imóveis passam por _normalizar (estrutura.py), que garante os campos
padronizados e deriva os booleanos tem_* para busca nativa.

Uso:
    python seed.py            # grava (se --limpar, remove os atuais primeiro)
    python seed.py --limpar   # apaga os imóveis de exemplo antigos e re-grava
"""

import argparse

from estrutura import _normalizar
from firestore_repo import _inicializar, listar_imoveis, salvar_imovel


FOTO_PADRAO = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"

IMOVEIS_EXEMPLO = [
    {
        "tipo": "Casa",
        "finalidade": "aluguel",
        "bairro": "Centro",
        "cidade": "São Paulo",
        "valor_venda": None,
        "valor_aluguel": 2500.0,
        "caracteristicas": ["3 quartos", "energia solar", "quintal", "2 banheiros", "garagem"],
        "contato_nome": "João Corretor",
        "contato_telefone": "(11) 99999-9999",
        "descricao": "Casa espaçosa com energia solar e quintal amplo, perfeita para família.",
        "fotos": [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
            "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea",
        ],
    },
    {
        "tipo": "Apartamento",
        "finalidade": "ambos",
        "bairro": "Jardim Paulista",
        "cidade": "São Paulo",
        "valor_venda": 620000.0,
        "valor_aluguel": 3200.0,
        "caracteristicas": ["2 quartos", "varanda", "vista mar", "mobiliado"],
        "contato_nome": "Maria Imóveis",
        "contato_telefone": "(11) 98888-8888",
        "descricao": "Apartamento com varanda gourmet e vista para o mar.",
        "fotos": [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
        ],
    },
    {
        "tipo": "Casa",
        "finalidade": "venda",
        "bairro": "Vila Nova",
        "cidade": "Campinas",
        "valor_venda": 890000.0,
        "valor_aluguel": None,
        "caracteristicas": ["4 quartos", "piscina", "churrasqueira", "3 banheiros"],
        "contato_nome": "Carlos Negócios",
        "contato_telefone": "(19) 97777-7777",
        "descricao": "Casa de alto padrão com piscina e churrasqueira.",
        "fotos": [
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9",
            "https://images.unsplash.com/photo-1600585152915-d208bec867a1",
        ],
    },
    {
        "tipo": "Kitnet",
        "finalidade": "aluguel",
        "bairro": "Centro",
        "cidade": "São Paulo",
        "valor_venda": None,
        "valor_aluguel": 850.0,
        "caracteristicas": ["1 quarto", "mobiliado", "ponto comercial"],
        "contato_nome": "Imobiliária Central",
        "contato_telefone": "(11) 96666-6666",
        "descricao": "Kitnet mobiliada, ótima localização, ideal para estudante.",
        "fotos": [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
        ],
    },
    {
        "tipo": "Casa em Condomínio",
        "finalidade": "ambos",
        "bairro": "Alphaville",
        "cidade": "Barueri",
        "valor_venda": 1250000.0,
        "valor_aluguel": 6800.0,
        "caracteristicas": ["4 quartos", "piscina", "condomínio fechado", "garagem dupla", "churrasqueira"],
        "contato_nome": "Fernanda Almeida",
        "contato_telefone": "(11) 95555-5555",
        "descricao": "Casa em condomínio fechado com área de lazer completa.",
        "fotos": [
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
            "https://images.unsplash.com/photo-1600585152220-90363fe7e115",
        ],
    },
    {
        "tipo": "Sala Comercial",
        "finalidade": "aluguel",
        "bairro": "Berrini",
        "cidade": "São Paulo",
        "valor_venda": None,
        "valor_aluguel": 9500.0,
        "caracteristicas": ["ponto comercial", "ar condicionado", "recepção"],
        "contato_nome": "Grupo Torre",
        "contato_telefone": "(11) 94444-4444",
        "descricao": "Sala comercial no coração do Berrini, pronta para uso.",
        "fotos": [
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
            "https://images.unsplash.com/photo-1497366811353-6870744d04b2",
        ],
    },
    {
        "tipo": "Cobertura",
        "finalidade": "venda",
        "bairro": "Moema",
        "cidade": "São Paulo",
        "valor_venda": 2400000.0,
        "valor_aluguel": None,
        "caracteristicas": ["3 quartos", "terraço", "vista mar", "piscina", "garagem"],
        "contato_nome": "Renato Rosa",
        "contato_telefone": "(11) 93333-3333",
        "descricao": "Cobertura de alto padrão com terraço e vista panorâmica.",
        "fotos": [
            "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d",
            "https://images.unsplash.com/photo-1600607688969-a5bfcd646154",
        ],
    },
    {
        "tipo": "Terreno",
        "finalidade": "venda",
        "bairro": "Granja Viana",
        "cidade": "Cotia",
        "valor_venda": 480000.0,
        "valor_aluguel": None,
        "caracteristicas": ["500 m²", "zona residencial", "topografia plana"],
        "contato_nome": "Loteadora Sul",
        "contato_telefone": "(11) 92222-2222",
        "descricao": "Terreno plano de 500 m² em condomínio residencial.",
        "fotos": [],
    },
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limpar", action="store_true", help="Remove os imóveis atuais antes de gravar")
    args = parser.parse_args()

    if args.limpar:
        _limpar_imoveis()

    print(f"Salvando {len(IMOVEIS_EXEMPLO)} imóveis de exemplo...")
    for imovel in IMOVEIS_EXEMPLO:
        normalizado = _normalizar(imovel)
        imovel_id = salvar_imovel(normalizado)
        print(f"  -> {imovel_id}: {normalizado['tipo']} em {normalizado['bairro']}")
    print("Seed concluído!")


def _limpar_imoveis():
    db = _inicializar()
    docs = listar_imoveis(limite=1000)
    print(f"Removendo {len(docs)} imóveis atuais...")
    for d in docs:
        db.collection("imoveis").document(d["id"]).delete()
    print("Limpeza concluída.")


if __name__ == "__main__":
    main()
