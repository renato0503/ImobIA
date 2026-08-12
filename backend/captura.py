"""Captura de conteúdo de links de anúncios para alimentar a ingestão via IA.

Extrai texto relevante de uma URL (título, meta description e parágrafos) usando
requests + BeautifulSoup. O texto extraído é enviado ao Groq em estrutura.py.
"""

import logging
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

TIMEOUT_SEGUNDOS = 15
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}

TAGS_RELEVANTES = [
    "article",
    "main",
    "section",
    "div",
]

# Textos que geralmente não são parte do anúncio
TEXTO_IGNORADO = {"menu", "login", "entrar", "cadastre-se", "cookies", "privacy"}


def _url_valida(url: str) -> bool:
    try:
        partes = urlparse(url)
        return partes.scheme in ("http", "https") and bool(partes.netloc)
    except ValueError:
        return False


def capturar_conteudo(url: str) -> str:
    """Busca uma URL e retorna texto estruturado (título + descrição + parágrafos)."""
    if not _url_valida(url):
        raise ValueError(f"URL inválida: {url}")

    logger.info("Capturando conteúdo de %s", url)
    resposta = requests.get(url, headers=HEADERS, timeout=TIMEOUT_SEGUNDOS)
    resposta.raise_for_status()

    sopa = BeautifulSoup(resposta.text, "html.parser")

    titulo = sopa.find("title")
    descricao = sopa.find("meta", attrs={"name": "description"})
    og_titulo = sopa.find("meta", attrs={"property": "og:title"})
    og_descricao = sopa.find("meta", attrs={"property": "og:description"})

    partes = []
    if titulo and titulo.get_text(strip=True):
        partes.append(f"Título: {titulo.get_text(strip=True)}")
    if og_titulo and og_titulo.get("content"):
        partes.append(f"Título (OG): {og_titulo['content']}")
    if descricao and descricao.get("content"):
        partes.append(f"Descrição: {descricao['content']}")
    if og_descricao and og_descricao.get("content"):
        partes.append(f"Descrição (OG): {og_descricao['content']}")

    # Parágrafos com texto relevante, evitando nav/header/footer e textos triviais
    vistos = set()
    for tag in sopa.find_all(["p", "h1", "h2", "h3"]):
        texto = tag.get_text(" ", strip=True)
        if not texto or texto in vistos:
            continue
        if any(tag.find_parent(tag_t) is not None for tag_t in ["nav", "header", "footer"]):
            continue
        if texto.lower() in TEXTO_IGNORADO or len(texto) < 15:
            continue
        vistos.add(texto)
        partes.append(texto)

    if not partes:
        raise ValueError(f"Nenhum conteúdo textual extraído de {url}")

    return "\n".join(partes)[:6000]
