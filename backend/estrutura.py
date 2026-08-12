"""Estrutura texto/áudio solto em JSON padronizado usando a API do Groq."""

import json
from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL

TIPOS_VALIDOS = [
    "Casa",
    "Apartamento",
    "Kitnet",
    "Terreno",
    "Sala Comercial",
    "Cobertura",
    "Casa em Condomínio",
]

SCHEMA = {
    "tipo": "string (Casa, Apartamento, Kitnet, Terreno, Sala Comercial, Cobertura, Casa em Condomínio)",
    "finalidade": "'venda' | 'aluguel' | 'ambos'",
    "bairro": "string",
    "cidade": "string",
    "valor_venda": "number | null",
    "valor_aluguel": "number | null",
    "caracteristicas": "array de strings (ex: ['3 quartos', 'energia solar', 'quintal', 'piscina', 'garagem'])",
    "contato_nome": "string | null",
    "contato_telefone": "string | null",
    "descricao": "string",
    "fotos": "array de URLs (pode ser vazio)",
}

SYSTEM_PROMPT = f"""
Você é um assistente especializado em cadastro imobiliário.
Receba um texto livre (anúncio, descrição, áudio transcrito, mensagem de WhatsApp)
e extraia as informações no formato JSON estruturado abaixo.

RETORNE APENAS UM JSON VÁLIDO, sem texto adicional, sem markdown.

Formato esperado:
{json.dumps(SCHEMA, ensure_ascii=False, indent=2)}

Regras:
- 'tipo': normalize para o tipo mais próximo (Casa, Apartamento, Kitnet, Terreno, Sala Comercial, Cobertura, Casa em Condomínio).
- 'finalidade': 'venda' se for venda, 'aluguel' se for aluguel, 'ambos' se mencionar os dois.
- 'valor_venda' e 'valor_aluguel': apenas números (sem R$, sem pontos), ou null se não informado.
- 'bairro': só o nome do bairro. null se não souber.
- 'caracteristicas': liste TODAS as características/qualidades citadas (quartos, banheiros, áreas, diferenciais, energia solar, mobília, etc.) em minúsculo.
- Use null para campos ausentes. Nunca invente informação que não está no texto.
"""


def estruturar_imovel(texto: str) -> dict:
    """Envia texto bruto ao Groq e retorna o imóvel estruturado em dict."""
    if not GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY não definida. Configure no backend/.env "
            "(veja .env.example)."
        )

    client = Groq(api_key=GROQ_API_KEY)

    resposta = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": texto},
        ],
        temperature=0.1,
        response_format={"type": "json_object"},
    )

    conteudo = resposta.choices[0].message.content
    dados = json.loads(conteudo)
    return _normalizar(dados)


def _normalizar(dados: dict) -> dict:
    """Garante que os campos obrigatórios existam com tipos corretos."""
    norm = {
        "tipo": _normalizar_tipo(dados.get("tipo")),
        "finalidade": _normalizar_finalidade(dados.get("finalidade")),
        "bairro": str(dados.get("bairro") or "").strip() or None,
        "cidade": str(dados.get("cidade") or "").strip() or None,
        "valor_venda": _normalizar_valor(dados.get("valor_venda")),
        "valor_aluguel": _normalizar_valor(dados.get("valor_aluguel")),
        "caracteristicas": _normalizar_caracteristicas(dados.get("caracteristicas")),
        "contato_nome": str(dados.get("contato_nome") or "").strip() or None,
        "contato_telefone": str(dados.get("contato_telefone") or "").strip() or None,
        "descricao": str(dados.get("descricao") or "").strip() or None,
    }
    if norm["bairro"] is None:
        norm["bairro"] = "Outros"

    fotos = dados.get("fotos")
    norm["fotos"] = fotos if isinstance(fotos, list) else []
    return norm


def _normalizar_tipo(valor) -> str:
    texto = str(valor or "").strip()
    if not texto:
        return "Imóvel"
    texto_lower = texto.lower()
    for tipo in TIPOS_VALIDOS:
        if tipo.lower() in texto_lower or texto_lower in tipo.lower():
            return tipo
    return texto.title()


def _normalizar_finalidade(valor) -> str:
    v = str(valor or "").lower()
    if v in ("venda", "vender", "comprar", "à venda"):
        return "venda"
    if v in ("aluguel", "alugar", "para alugar", "locação"):
        return "aluguel"
    return "ambos"


def _normalizar_valor(valor):
    if valor in (None, "", "null", "null"):
        return None
    try:
        return float(str(valor).replace("R$", "").replace(".", "").replace(",", "."))
    except (TypeError, ValueError):
        return None


def _normalizar_caracteristicas(valor) -> list:
    if isinstance(valor, str):
        valor = [valor]
    if not isinstance(valor, list):
        return []
    resultado = []
    for item in valor:
        texto = str(item).strip().lower()
        if texto:
            resultado.append(texto)
    return resultado
