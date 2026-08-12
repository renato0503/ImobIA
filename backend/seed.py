"""Popula a coleção 'imoveis' com dados de exemplo (útil no início).

Uso:
    python seed.py
"""

from firestore_repo import salvar_imovel

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
        "fotos": [],
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
        "fotos": [],
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
        "fotos": [],
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
        "fotos": [],
    },
]


def main():
    print(f"Salvando {len(IMOVEIS_EXEMPLO)} imóveis de exemplo...")
    for imovel in IMOVEIS_EXEMPLO:
        imovel_id = salvar_imovel(imovel)
        print(f"  -> {imovel_id}: {imovel['tipo']} em {imovel['bairro']}")
    print("Seed concluído!")


if __name__ == "__main__":
    main()
