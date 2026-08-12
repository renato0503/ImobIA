"""Validação de payloads da ingestão (texto, URL e áudio)."""

from urllib.parse import urlparse

MAX_TEXTO_CARACTERES = 6000
EXTENSOES_AUDIO = {".mp3", ".m4a", ".wav", ".ogg", ".opus"}


class PayloadInvalido(ValueError):
    """Erro de validação de payload com mensagem amigável."""


def validar_texto(texto: str | None) -> str:
    """Valida e normaliza um texto livre de anúncio."""
    if not texto or not isinstance(texto, str):
        raise PayloadInvalido("Campo 'texto' é obrigatório.")
    texto = texto.strip()
    if not texto:
        raise PayloadInvalido("Campo 'texto' está vazio.")
    if len(texto) > MAX_TEXTO_CARACTERES:
        raise PayloadInvalido(
            f"Texto muito longo (máximo {MAX_TEXTO_CARACTERES} caracteres)."
        )
    return texto


def validar_url(url: str | None) -> str:
    """Valida que a URL é http(s) com domínio."""
    if not url or not isinstance(url, str):
        raise PayloadInvalido("Campo 'url' é obrigatório.")
    url = url.strip()
    partes = urlparse(url)
    if partes.scheme not in ("http", "https") or not partes.netloc:
        raise PayloadInvalido(f"URL inválida: {url}")
    return url


def validar_audio(caminho: str | None) -> str:
    """Valida caminho local de arquivo de áudio (extensão e existência)."""
    if not caminho or not isinstance(caminho, str):
        raise PayloadInvalido("Campo 'audio' é obrigatório.")
    caminho = caminho.strip()
    if not caminho:
        raise PayloadInvalido("Campo 'audio' está vazio.")

    extensao = ""
    if "." in caminho.split("/")[-1].split("\\")[-1]:
        extensao = (
            caminho.split("/")[-1].split("\\")[-1]
        )
        if "." in extensao:
            extensao = "." + extensao.split(".")[-1].lower()

    if extensao and extensao not in EXTENSOES_AUDIO:
        raise PayloadInvalido(
            f"Extensão não suportada ({extensao}). Use: {', '.join(sorted(EXTENSOES_AUDIO))}"
        )
    return caminho


def validar_payload(dados: dict) -> dict:
    """Valida o payload de /ingestir e retorna {texto|url|audio} resolvido."""
    if not isinstance(dados, dict):
        raise PayloadInvalido("Payload deve ser um JSON objeto.")

    chaves = {k for k in dados if dados[k] not in (None, "")}
    escolhidos = chaves & {"texto", "url", "audio"}
    if not escolhidos:
        raise PayloadInvalido("Informe 'texto', 'url' ou 'audio'.")
    if len(escolhidos) > 1:
        raise PayloadInvalido("Envie apenas um de 'texto', 'url' ou 'audio'.")

    if "texto" in escolhidos:
        return {"texto": validar_texto(dados.get("texto"))}
    if "url" in escolhidos:
        return {"url": validar_url(dados.get("url"))}
    return {"audio": validar_audio(dados.get("audio"))}
