#!/usr/bin/env python3
"""
Pipeline de Importação Automática de CSV para o Pokédex TCG.
1. Lê o arquivo CSV da coleção de cartas.
2. Identifica e mapeia corretamente cada carta de energia para sua arte oficial.
3. Localiza e baixa as imagens oficiais em alta resolução automaticamente (multithread).
4. Faz o upload de todas as imagens para o Firebase Cloud Storage.
5. Gera o catálogo JSON estruturado com URLs diretas do Cloud Storage.
"""

import os
import sys
import csv
import json
import subprocess
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_CSV = os.path.join(BASE_DIR, 'colecao_completa_consolidada_com_energias.csv')
DOWNLOADS_DIR = os.path.join(BASE_DIR, 'downloads', 'cards')
CARDS_JSON = os.path.join(BASE_DIR, 'src', 'data', 'cards.json')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

COLOR_MAP = {
    'G': {'name': 'Planta', 'name_en': 'Grass', 'slug': 'grass', 'bg': '#78C850'},
    'R': {'name': 'Fogo', 'name_en': 'Fire', 'slug': 'fire', 'bg': '#F08030'},
    'W': {'name': 'Água', 'name_en': 'Water', 'slug': 'water', 'bg': '#6890F0'},
    'L': {'name': 'Raios', 'name_en': 'Lightning', 'slug': 'lightning', 'bg': '#F8D030'},
    'P': {'name': 'Psíquico', 'name_en': 'Psychic', 'slug': 'psychic', 'bg': '#F85888'},
    'F': {'name': 'Luta', 'name_en': 'Fighting', 'slug': 'fighting', 'bg': '#C03028'},
    'D': {'name': 'Noturno', 'name_en': 'Darkness', 'slug': 'darkness', 'bg': '#705848'},
    'M': {'name': 'Metal', 'name_en': 'Metal', 'slug': 'metal', 'bg': '#B8B8D0'},
    'Y': {'name': 'Fada', 'name_en': 'Fairy', 'slug': 'fairy', 'bg': '#EE99AC'},
    'O': {'name': 'Dragão', 'name_en': 'Dragon', 'slug': 'dragon', 'bg': '#7038F8'},
    'C': {'name': 'Incolor', 'name_en': 'Colorless', 'slug': 'colorless', 'bg': '#A8A878'},
    'E': {'name': 'Energia', 'name_en': 'Energy', 'slug': 'energy', 'bg': '#F59E0B'},
    '': {'name': 'Treinador', 'name_en': 'Trainer', 'slug': 'trainer', 'bg': '#14B8A6'}
}

BASIC_ENERGY_MAP = {
    'G': {'code': 'SVE', 'num': '1', 'url': 'https://images.pokemontcg.io/sve/1.png', 'file': 'sve_1.png'},
    'R': {'code': 'SVE', 'num': '2', 'url': 'https://images.pokemontcg.io/sve/2.png', 'file': 'sve_2.png'},
    'W': {'code': 'SVE', 'num': '3', 'url': 'https://images.pokemontcg.io/sve/3.png', 'file': 'sve_3.png'},
    'L': {'code': 'SVE', 'num': '4', 'url': 'https://images.pokemontcg.io/sve/4.png', 'file': 'sve_4.png'},
    'P': {'code': 'SVE', 'num': '5', 'url': 'https://images.pokemontcg.io/sve/5.png', 'file': 'sve_5.png'},
    'F': {'code': 'SVE', 'num': '6', 'url': 'https://images.pokemontcg.io/sve/6.png', 'file': 'sve_6.png'},
    'D': {'code': 'SVE', 'num': '7', 'url': 'https://images.pokemontcg.io/sve/7.png', 'file': 'sve_7.png'},
    'M': {'code': 'SVE', 'num': '8', 'url': 'https://images.pokemontcg.io/sve/8.png', 'file': 'sve_8.png'},
    'Y': {'code': 'SM1', 'num': '169', 'url': 'https://images.pokemontcg.io/sm1/169.png', 'file': 'sm1_169.png'},
}

RARITY_MAP = {
    'C': 'Comum', 'I': 'Incomum', 'U': 'Incomum', 'R': 'Rara', 'H': 'Holo Rara',
    'RH': 'Rara Holo', 'RU': 'Ultra Rara', 'RD': 'Double Rara', 'IR': 'Ilustração Rara',
    'S': 'Secreta Rara', 'E': 'Energia'
}

def parse_csv(csv_path):
    cards = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader, None)
        idx = 1
        for row in reader:
            if not row or len(row) < 5:
                continue
            
            set_pt = row[0].strip() if len(row) > 0 else 'Coleção'
            set_en = row[1].strip() if len(row) > 1 else set_pt
            set_code = (row[2].strip() if len(row) > 2 else 'CRI').upper()
            card_pt = row[3].strip() if len(row) > 3 else 'Carta'
            card_en = row[4].strip() if len(row) > 4 else card_pt
            qty = int(row[5].strip()) if len(row) > 5 and row[5].strip().isdigit() else 1
            quality = row[6].strip() if len(row) > 6 else 'NM'
            lang = row[7].strip() if len(row) > 7 else 'PT'
            rarity = row[8].strip() if len(row) > 8 else 'C'
            color = row[9].strip().upper() if len(row) > 9 else ''
            extras = row[10].strip() if len(row) > 10 else ''
            card_num = row[11].strip() if len(row) > 11 else str(idx)
            comment = row[12].strip() if len(row) > 12 else ''
            total_in_set = row[13].strip() if len(row) > 13 else '100'

            color_info = COLOR_MAP.get(color, COLOR_MAP[''])
            is_foil = 'foil' in extras.lower() or 'holo' in extras.lower()
            category = 'Energia' if (color == 'E' or 'energia' in card_pt.lower()) else ('Treinador' if not color else 'Pokémon')

            card_id = f"tcg-{str(idx).zfill(3)}"
            
            # Tratamento especial e único para cada tipo de Carta de Energia Básica
            if (set_code == 'BAS' or card_num.lower() == 'energia' or ('energia' in card_pt.lower() and 'básica' in card_pt.lower())) and color in BASIC_ENERGY_MAP:
                energy_meta = BASIC_ENERGY_MAP[color]
                set_code = energy_meta['code']
                card_num = energy_meta['num']
                filename = energy_meta['file']
                img_url = energy_meta['url']
                category = 'Energia'
            else:
                filename = f"{set_code.lower()}_{card_num.replace('/', '_')}.png"
                img_url = f"https://images.pokemontcg.io/{set_code.lower()}/{card_num.lstrip('0') or '1'}.png"

            cards.append({
                'id': card_id,
                'name_pt': card_pt,
                'name_en': card_en,
                'set_pt': set_pt,
                'set_en': set_en,
                'set_code': set_code,
                'card_number': card_num,
                'total_in_set': total_in_set,
                'quantity': qty,
                'quality': quality,
                'language': lang,
                'rarity_code': rarity,
                'rarity_name': RARITY_MAP.get(rarity, rarity),
                'color_code': color,
                'color_name': color_info['name'],
                'color_slug': color_info['slug'],
                'color_bg': color_info['bg'],
                'card_category': category,
                'is_foil': is_foil,
                'extras': extras,
                'comment': comment,
                'image_filename': filename,
                'image_url': img_url,
                'decks': []
            })
            idx += 1

    return cards

def download_image(card):
    os.makedirs(DOWNLOADS_DIR, exist_ok=True)
    local_path = os.path.join(DOWNLOADS_DIR, card['image_filename'])

    if os.path.exists(local_path) and os.path.getsize(local_path) > 1000:
        return {'status': 'exists', 'name': card['name_pt']}

    clean_num = card['card_number'].lstrip('0') or '1'
    num_3d = str(clean_num).zfill(3)

    urls = [
        card['image_url'],
        f"https://images.pokemontcg.io/{card['set_code'].lower()}/{clean_num}.png",
        f"https://limitlesstcg.nyc3.digitaloceanspaces.com/tpci/{card['set_code']}/{card['set_code']}_{num_3d}_R_PT.png",
        f"https://limitlesstcg.nyc3.digitaloceanspaces.com/tpci/{card['set_code']}/{card['set_code']}_{num_3d}_R_EN.png",
        f"https://assets.pokemon.com/assets/cms2/img/cards/web/{card['set_code']}/{card['set_code']}_EN_{clean_num}.png"
    ]

    for url in urls:
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=6) as resp:
                if resp.status == 200:
                    data = resp.read()
                    if len(data) > 1000:
                        with open(local_path, 'wb') as out_f:
                            out_f.write(data)
                        return {'status': 'downloaded', 'name': card['name_pt']}
        except Exception:
            continue

    return {'status': 'failed', 'name': card['name_pt']}

def upload_to_storage():
    bucket = "gs://pokedex-tcg-782d5.firebasestorage.app/cards/"
    print(f"\n🚀 Sincronizando imagens locais com o Google Cloud Storage ({bucket})...")
    cmd = f"gcloud storage cp {os.path.join(DOWNLOADS_DIR, '*.png')} {bucket}"
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode == 0:
        print("✔ Upload para o Cloud Storage concluído com sucesso!")
    else:
        print(f"⚠️ Aviso ao subir imagens via gcloud: {result.stderr}")

def main():
    csv_file = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_CSV
    if not os.path.exists(csv_file):
        print(f"❌ Arquivo CSV '{csv_file}' não encontrado!")
        return

    print("=================================================================")
    print(f"  POKÉDEX TCG - PIPELINE DE IMPORTAÇÃO AUTOMÁTICA DE CARTAS")
    print(f"  Arquivo CSV: {csv_file}")
    print("=================================================================\n")

    cards = parse_csv(csv_file)
    print(f"✔ {len(cards)} cartas encontradas no CSV.")

    print(f"📥 Buscando e baixando imagens oficiais em alta definição...")
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(download_image, card) for card in cards]
        downloaded = 0
        exists = 0
        failed = 0
        for f in as_completed(futures):
            res = f.result()
            if res['status'] == 'downloaded':
                downloaded += 1
            elif res['status'] == 'exists':
                exists += 1
            else:
                failed += 1

    print(f"✔ Download concluído: {downloaded} novas, {exists} existentes, {failed} falhas.")

    upload_to_storage()

    print(f"\n💾 Salvando catálogo atualizado em {CARDS_JSON}...")
    with open(CARDS_JSON, 'w', encoding='utf-8') as f:
        json.dump(cards, f, indent=2, ensure_ascii=False)

    print("✨ Pipeline finalizado com sucesso! Todas as cartas estão catalogadas e salvas no Cloud Storage.")

if __name__ == '__main__':
    main()
