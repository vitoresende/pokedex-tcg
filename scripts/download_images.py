#!/usr/bin/env python3
"""
Script para Download Automático das Imagens das Cartas Pokémon TCG.
Salva as imagens na pasta public/cards/ para uso local ou posterior upload ao Firebase Storage.
"""

import os
import json
import urllib.request
import urllib.error
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARDS_JSON = os.path.join(BASE_DIR, 'src', 'data', 'cards.json')
OUTPUT_DIR = os.path.join(BASE_DIR, 'public', 'cards')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def download_card(card):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    card_id = card['id']
    set_code = card['set_code'].lower()
    card_num = card['card_number'].replace('/', '_')
    local_filename = f"{set_code}_{card_num}.png"
    local_path = os.path.join(OUTPUT_DIR, local_filename)

    if os.path.exists(local_path) and os.path.getsize(local_path) > 1000:
        return {'id': card_id, 'status': 'already_exists', 'path': local_path}

    urls_to_try = [
        card.get('image_url'),
        f"https://limitlesstcg.nyc3.digitaloceanspaces.com/tpci/{card['set_code']}/{card['set_code']}_{card['card_number'].zfill(3)}_R_PT.png",
        f"https://limitlesstcg.nyc3.digitaloceanspaces.com/tpci/{card['set_code']}/{card['set_code']}_{card['card_number'].zfill(3)}_R_EN.png",
        f"https://assets.pokemon.com/assets/cms2/img/cards/web/{card['set_code']}/{card['set_code']}_EN_{card['card_number']}.png"
    ]

    for url in urls_to_try:
        if not url:
            continue
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=8) as response:
                if response.status == 200:
                    content = response.read()
                    if len(content) > 1000:  # Validate that it's a real image
                        with open(local_path, 'wb') as f:
                            f.write(content)
                        return {'id': card_id, 'name': card['name_pt'], 'status': 'downloaded', 'url': url}
        except Exception:
            continue

    return {'id': card_id, 'name': card['name_pt'], 'status': 'failed'}

def main():
    print(f"=== Iniciando Download de Imagens Pokémon TCG ===")
    if not os.path.exists(CARDS_JSON):
        print(f"Erro: Arquivo {CARDS_JSON} não encontrado!")
        return

    with open(CARDS_JSON, 'r', encoding='utf-8') as f:
        cards = json.load(f)

    print(f"Total de cartas a processar: {len(cards)}")
    print(f"Diretório de destino: {OUTPUT_DIR}\n")

    downloaded = 0
    existing = 0
    failed = 0

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(download_card, card): card for card in cards}
        for future in as_completed(futures):
            res = future.result()
            if res['status'] == 'downloaded':
                downloaded += 1
                print(f"[DOWNLOAD] {res['name']} -> {res['url']}")
            elif res['status'] == 'already_exists':
                existing += 1
            else:
                failed += 1
                print(f"[FALHA] {res['name']} ({futures[future]['set_code']} #{futures[future]['card_number']})")

    print("\n=== Resumo do Download ===")
    print(f"Baixadas com sucesso: {downloaded}")
    print(f"Já existentes:        {existing}")
    print(f"Não encontradas:      {failed}")
    print(f"Total:                {len(cards)}")
    print(f"\nImagens prontas em {OUTPUT_DIR}")

if __name__ == '__main__':
    main()
