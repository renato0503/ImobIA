"""Estrutura texto/áudio solto em JSON padronizado usando a API do Groq."""

import json
import logging
import unicodedata

from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL

logger = logging.getLogger(__name__)

MODELO_TRANSCRICAO = "whisper-large-v3"

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
    _adicionar_booleanos_caracteristicas(norm)
    return norm


def _adicionar_booleanos_caracteristicas(norm: dict) -> None:
    """Deriva campos booleanos tem_* de cada característica para buscas nativas.

    O Firestore não permite múltiplos `array-contains` no mesmo campo em uma query.
    Para permitir buscar por várias características de forma nativa (ex: energia
    solar + quintal), gravamos um campo booleano por característica:
    `tem_energia_solar: true`, `tem_quintal: true`.
    """
    for caracteristica in norm.get("caracteristicas", []):
        slug = slug_de_caracteristica(caracteristica)
        if slug:
            norm[f"tem_{slug}"] = True


def slug_de_caracteristica(caracteristica: str) -> str:
    """Converte 'energia solar' → 'energia_solar'; '3 quartos' → '3_quartos'."""
    sem_acento = (
        unicodedata.normalize("NFKD", caracteristica)
        .encode("ascii", "ignore")
        .decode("ascii")
    )
    slug = "_".join(sem_acento.lower().split())
    return slug


def transcrever_audio(caminho: str) -> str:
    """Transcreve um arquivo de áudio usando a API de transcrição do Groq.

    Retorna o texto transcrito, pronto para ser estruturado como imóvel.
    """
    if not GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY não definida. Configure no backend/.env "
            "(veja .env.example)."
        )

    client = Groq(api_key=GROQ_API_KEY)
    with open(caminho, "rb") as f:
        resposta = client.audio.transcriptions.create(
            file=(caminho, f),
            model=MODELO_TRANSCRICAO,
            response_format="text",
            language="pt",
        )

    texto = resposta.text if hasattr(resposta, "text") else str(resposta)
    logger.info("Áudio transcrito (%d caracteres)", len(texto))
    return texto.strip()


def _sem_acento(texto: str) -> str:
    """Remove acentos e normaliza o texto para comparação robusta."""
    return (
        unicodedata.normalize("NFKD", texto)
        .encode("ascii", "ignore")
        .decode("ascii")
        .lower()
    )


def _normalizar_tipo(valor) -> str:
    texto = str(valor or "").strip()
    if not texto:
        return "Imóvel"
    texto_norm = _sem_acento(texto)

    # Match exato (ou completo do tipo dentro do texto)
    for tipo in TIPOS_VALIDOS:
        if texto_norm == _sem_acento(tipo):
            return tipo

    # Prioriza tipos multi-palavra (ex: "casa em condomínio") por
    # comprimento decrescente para não casar parcial com tipos menores.
    tipos_por_comprimento = sorted(TIPOS_VALIDOS, key=len, reverse=True)
    for tipo in tipos_por_comprimento:
        if _sem_acento(tipo) in texto_norm:
            return tipo

    # Texto contido num tipo (ex: "casa" -> "Casa")
    for tipo in TIPOS_VALIDOS:
        if texto_norm in _sem_acento(tipo):
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
