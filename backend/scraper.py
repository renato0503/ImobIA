"""Scraping de portais externos de imóveis.

Pipeline:
    1. Coleta anúncios de sites-alvo (adapter por site).
    2. Normaliza cada anúncio no formato padrão (estrutura.py).
    3. Detecta duplicados por bairro+tipo+valor antes de salvar.

Uso:
    python scraper.py --site exemplo --limite 5
    python scraper.py --todos --dry-run

ATENÇÃO: respeite os termos de uso e robots.txt de cada site. Use apenas para
captação autorizada ou dados públicos com rate limiting.
"""

import argparse
import logging

from estrutura import estruturar_imovel
from firestore_repo import listar_imoveis, salvar_imovel

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("scraper")

# Registry de adapters por site. Cada adapter implementa:
#   coletar(limite: int) -> list[dict]  # anúncios brutos (texto/JSON)
ADAPTERS = {}


def registrar_adapter(nome):
    def decorator(fn):
        ADAPTERS[nome] = fn
        return fn

    return decorator


@registrar_adapter("exemplo")
def _adapter_exemplo(limite: int) -> list:
    """Exemplo de adapter. Substitua/adicione adapters por portal alvo."""
    logger.warning(
        "Adapter 'exemplo' não está configurado para nenhum portal real. "
        "Retornando lista vazia."
    )
    return []


def _ja_existe(imovel: dict, acervo: list) -> bool:
    """Detecta duplicado comparando bairro + tipo + valores."""
    for existente in acervo:
        if (
            existente.get("bairro") == imovel.get("bairro")
            and existente.get("tipo") == imovel.get("tipo")
            and existente.get("valor_venda") == imovel.get("valor_venda")
            and existente.get("valor_aluguel") == imovel.get("valor_aluguel")
        ):
            return True
    return False


def _rodar_pipeline(nome_site: str, limite: int, dry_run: bool):
    if nome_site not in ADAPTERS:
        logger.error("Site '%s' não registrado. Disponíveis: %s", nome_site, list(ADAPTERS))
        return

    anúncios = ADAPTERS[nome_site](limite)
    logger.info("%d anúncios coletados de %s", len(anúncios), nome_site)

    if not anúncios:
        logger.info("Nada a processar.")
        return

    acervo = listar_imoveis(limite=500)
    logger.info("Acervo atual: %d imóveis (para detecção de duplicados)", len(acervo))

    novos = 0
    duplicados = 0
    for anúncio in anúncios:
        try:
            imovel = estruturar_imovel(str(anúncio))
        except Exception as exc:  # noqa: BLE001
            logger.warning("Falha ao estruturar anúncio: %s", exc)
            continue

        if _ja_existe(imovel, acervo):
            duplicados += 1
            logger.info("Duplicado ignorado: %s em %s", imovel["tipo"], imovel["bairro"])
            continue

        if dry_run:
            logger.info("[dry-run] Novo imóvel: %s em %s", imovel["tipo"], imovel["bairro"])
            novos += 1
        else:
            imovel_id = salvar_imovel(imovel)
            novos += 1
            acervo.append({**imovel, "id": imovel_id})

    logger.info(
        "Pipeline concluído: %d novos, %d duplicados (dry_run=%s)",
        novos,
        duplicados,
        dry_run,
    )


def main():
    parser = argparse.ArgumentParser(description="Scraper de portais de imóveis")
    parser.add_argument("--site", help="Adapter a usar (ex: exemplo)")
    parser.add_argument("--todos", action="store_true", help="Roda todos os adapters")
    parser.add_argument("--limite", type=int, default=10)
    parser.add_argument("--dry-run", action="store_true", help="Não grava, apenas loga")
    args = parser.parse_args()

    sites = list(ADAPTERS) if args.todos else ([args.site] if args.site else [])
    if not sites:
        logger.error("Informe --site ou --todos")
        return

    for site in sites:
        _rodar_pipeline(site, args.limite, args.dry_run)


if __name__ == "__main__":
    main()
