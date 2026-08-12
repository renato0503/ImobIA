"""Gera os ícones e favicons da plataforma a partir das logos.

Converte as logos (originalmente WebP nomeadas .png) para os formatos usados:
  - public/logosimbolo.png   (símbolo — PNG, usado em ícones/favicon)
  - public/logoletras.png    (letreiro — PNG largo, usado nos headers)
  - public/favicon.ico       (favicon tradicional)
  - public/icon-192.png      (PWA)
  - public/icon-512.png      (PWA)
  - public/apple-touch-icon.png (iOS)
"""

from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
SIMBOLO = RAIZ / "logosimbolo.png"
LETRAS = RAIZ / "logoletras.png"
PUBLIC = RAIZ / "frontend" / "public"

TAMANHOS = {
    "icon-192.png": 192,
    "icon-512.png": 512,
    "apple-touch-icon.png": 180,
    "logosimbolo.png": None,  # mantém a maior resolução (máx 512 para não inflar o bundle)
}


def _converter(caminho, destino, tamanho=None, max_lado=512):
    img = Image.open(caminho)
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    if tamanho:
        img = img.resize((tamanho, tamanho), Image.LANCZOS)
    else:
        maior = max(img.size)
        if maior > max_lado:
            escala = max_lado / maior
            img = img.resize(
                (round(img.width * escala), round(img.height * escala)), Image.LANCZOS
            )
    img.save(destino, format="PNG")
    return img


def main():
    PUBLIC.mkdir(parents=True, exist_ok=True)

    if SIMBOLO.exists():
        for nome, tamanho in TAMANHOS.items():
            destino = PUBLIC / nome
            out = _converter(SIMBOLO, destino, tamanho)
            print(f"  OK {destino.name} ({out.width}x{out.height})")
        ico = PUBLIC / "favicon.ico"
        Image.open(SIMBOLO).resize((32, 32), Image.LANCZOS).save(
            ico, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)]
        )
        print("  OK favicon.ico (16/32/48)")
    else:
        print("  ! logosimbolo.png não encontrado na raiz (pulando ícones)")

    if LETRAS.exists():
        out = _converter(LETRAS, PUBLIC / "logoletras.png")
        print(f"  OK logoletras.png ({out.width}x{out.height})")
    else:
        print("  ! logoletras.png não encontrado na raiz (pulando letreiro)")

    print("Logos/ícones gerados com sucesso.")


if __name__ == "__main__":
    main()
