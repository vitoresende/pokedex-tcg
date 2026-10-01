/**
 * Pokémon TCG Set Metadata: Release Years & Formatting Utilities
 * 
 * Provides official expansion release years and formatting helpers
 * to display sets uniformly across the application (e.g., "YYYY - SIGLA - Nome da Coleção").
 */

export const SET_RELEASE_YEARS: Record<string, number> = {
  // === 2025 (Mega / Gen 9 Era) ===
  'BLK': 2025, // Black Bolt
  'WHT': 2025, // White Flare
  'DRI': 2025, // Destined Rivals / Rivais Predestinados
  'PRE': 2025, // Prismatic Evolutions / Evoluções Prismáticas
  'PBL': 2025, // Evoluções Prismáticas alias
  'JTG': 2025, // Journey Together
  'SV10': 2025,

  // === 2024 (Scarlet & Violet) ===
  'SSP': 2024, // Surging Sparks / Fagulhas Impetuosas
  'SV08': 2024, 'SV8': 2024,
  'SCR': 2024, // Stellar Crown / Coroa Estelar
  'SV07': 2024, 'SV7': 2024,
  'SFA': 2024, // Shrouded Fable / Fábulas Nebulosas
  'SV06.5': 2024, 'SV6.5': 2024,
  'TWM': 2024, // Twilight Masquerade / Máscaras do Crepúsculo
  'SV06': 2024, 'SV6': 2024,
  'TEF': 2024, // Temporal Forces / Forças Temporais
  'SV05': 2024, 'SV5': 2024,
  'PAF': 2024, // Paldean Fates / Destinos de Paldea
  'SV04.5': 2024, 'SV4.5': 2024,

  // === 2023 (Scarlet & Violet & SWSH finale) ===
  'PAR': 2023, // Paradox Rift / Fenda Paradoxal
  'SV04': 2023, 'SV4': 2023,
  'MEW': 2023, // 151 / Pokémon 151
  '151': 2023, 'SV03.5': 2023, 'SV3.5': 2023,
  'OBF': 2023, // Obsidian Flames / Obsidiana em Chamas
  'SV03': 2023, 'SV3': 2023,
  'PAL': 2023, // Paldea Evolved / Evoluções em Paldea
  'SV02': 2023, 'SV2': 2023,
  'SVI': 2023, 'SV1': 2023, 'SV01': 2023, // Scarlet & Violet Base / Escarlate e Violeta
  'SVE': 2023, 'SV-BE': 2023, 'BAS': 2023, // Basic Energy / Cartas Promocionais / Básicas
  'SVP': 2023, // Scarlet & Violet Promos
  'CRZ': 2023, // Crown Zenith / Zênite Régio
  'SWSH12.5': 2023, 'SWSH12pt5': 2023,

  // === 2022 (Sword & Shield) ===
  'SIT': 2022, // Silver Tempest / Tempestade Prateada
  'SWSH12': 2022,
  'LOR': 2022, // Lost Origin / Origem Perdida
  'SWSH11': 2022,
  'PGO': 2022, // Pokémon GO
  'SWSH10.5': 2022,
  'ASR': 2022, // Astral Radiance / Resplendor Astral
  'SWSH10': 2022,
  'BRS': 2022, // Brilliant Stars / Astros Cintilantes
  'SWSH9': 2022,

  // === 2021 (Sword & Shield) ===
  'FST': 2021, // Fusion Strike / Golpe Fusão
  'SWSH8': 2021,
  'CEL': 2021, // Celebrations / Celebrações
  'CEL25': 2021,
  'EVS': 2021, // Evolving Skies / Céus Evolutivos
  'SWSH7': 2021,
  'CRE': 2021, // Chilling Reign / Reinado Implacável
  'SWSH6': 2021,
  'BST': 2021, // Battle Styles / Estilos de Batalha
  'SWSH5': 2021,
  'SHF': 2021, // Shining Fates / Destinos Brilhantes
  'SWSH4.5': 2021,

  // === 2020 (Sword & Shield) ===
  'VIV': 2020, // Vivid Voltage / Voltagem Vívida
  'SWSH4': 2020,
  'CPA': 2020, // Champion's Path / Caminho do Campeão
  'SWSH3.5': 2020,
  'DAA': 2020, // Darkness Ablaze / Escuridão Incandescente
  'SWSH3': 2020,
  'RCL': 2020, // Rebel Clash / Rixa Rebelde
  'SWSH2': 2020,
  'SSH': 2020, 'SWSH': 2020, 'SWSH1': 2020, // Sword & Shield Base
  'SWSHP': 2020,

  // === 2019 (Sun & Moon) ===
  'CEC': 2019, // Cosmic Eclipse / Eclipse Cósmico
  'SM12': 2019,
  'HIF': 2019, 'SMA': 2019, // Hidden Fates / Destinos Ocultos
  'SM11.5': 2019,
  'UNM': 2019, // Unified Minds / Sintonia Mental
  'SM11': 2019,
  'UNB': 2019, // Unbroken Bonds / Elos Inquebráveis
  'SM10': 2019,
  'DET': 2019, // Detective Pikachu
  'TEU': 2019, // Team Up / União de Aliados
  'SM9': 2019,

  // === 2018 (Sun & Moon) ===
  'LOT': 2018, // Lost Thunder / Trovões Perdidos
  'SM8': 2018,
  'DRM': 2018, // Dragon Majesty / Majestade dos Dragões
  'SM7.5': 2018,
  'CES': 2018, // Celestial Storm / Tempestade Celestial
  'SM7': 2018,
  'FLI': 2018, // Forbidden Light / Luz Proibida
  'SM6': 2018,
  'UPR': 2018, // Ultra Prism / Ultra Prisma
  'SM5': 2018,

  // === 2017 (Sun & Moon) ===
  'CRI': 2017, // Crimson Invasion / Caos Ascendente / Invasão Carmim
  'SM4': 2017,
  'SLG': 2017, // Shining Legends / Lendas Brilhantes
  'SM3.5': 2017,
  'BUS': 2017, // Burning Shadows / Sombras Ardentes
  'SM3': 2017,
  'GRI': 2017, // Guardians Rising / Guardiões Ascendentes
  'SM2': 2017,
  'SUM': 2017, 'SM1': 2017, // Sun & Moon Base / Sol e Lua
  'SMP': 2017, // Sun & Moon Promos
  'MEP': 2017, // Mega Powers

  // === 2016 (XY) ===
  'EVO': 2016, // Evolutions / Evoluções
  'XY12': 2016,
  'STS': 2016, // Steam Siege / Cerco de Vapor
  'XY11': 2016,
  'FCO': 2016, // Fates Collide / Fusão de Destinos
  'XY10': 2016,
  'GEN': 2016, // Generations / Gerações
  'BKP': 2016, // BREAKpoint / Ponto de Ruptura
  'XY9': 2016,

  // === 2015 (XY) ===
  'BKT': 2015, // BREAKthrough / Origens Ancestrais
  'XY8': 2015,
  'AOR': 2015, // Ancient Origins / Origens Ancestrais
  'XY7': 2015,
  'ROS': 2015, // Roaring Skies / Céus Estrondosos
  'XY6': 2015,
  'DCR': 2015, // Double Crisis
  'PRC': 2015, // Primal Clash / Conflito Primitivo
  'XY5': 2015,

  // === 2014 (XY) ===
  'PHF': 2014, // Phantom Forces / Forças Fantasmas
  'XY4': 2014,
  'FFI': 2014, // Furious Fists / Punhos Furiosos
  'XY3': 2014,
  'FLF': 2014, // Flashfire / Flash de Fogo
  'XY2': 2014,
  'XY': 2014, 'XY1': 2014, // XY Base
  'XYP': 2014,

  // === 2013 (Black & White) ===
  'LTR': 2013, // Legendary Treasures
  'BW11': 2013,
  'PLB': 2013, // Plasma Blast / Explosão de Plasma
  'BW10': 2013,
  'PFL': 2013, // Plasma Freeze / Congelamento de Plasma
  'BW9': 2013,
  'PLS': 2013, // Plasma Storm / Tempestade de Plasma
  'BW8': 2013,

  // === 2012 (Black & White) ===
  'BCR': 2012, // Boundaries Crossed
  'BW7': 2012,
  'DRV': 2012, // Dragon Vault
  'DRX': 2012, // Dragons Exalted
  'BW6': 2012,
  'DEX': 2012, // Dark Explorers
  'BW5': 2012,
  'NXD': 2012, // Next Destinies / Próximos Destinos
  'BW4': 2012,

  // === 2011 (Black & White) ===
  'NVI': 2011, // Noble Victories
  'BW3': 2011,
  'EPO': 2011, // Emerging Powers
  'BW2': 2011,
  'BLW': 2011, 'BW': 2011, 'BW1': 2011, // Black & White Base
  'BWP': 2011,

  // === 2010 (HGSS) ===
  'TM': 2010, // HS - Triumphant
  'UD': 2010, // HS - Undaunted
  'UL': 2010, // HS - Unleashed
  'HS': 2010, // HeartGold & SoulSilver

  // === 2009 (Diamond & Pearl / Platinum) ===
  'AR': 2009, // Arceus
  'SV': 2009, // Supreme Victors
  'RR': 2009, // Rising Rivals
  'PL': 2009, // Platinum

  // === 2008 (Diamond & Pearl) ===
  'SF': 2008, // Stormfront
  'LA': 2008, // Legends Awakened
  'MD': 2008, // Majestic Dawn
  'GE': 2008, // Great Encounters

  // === 2007 (Diamond & Pearl & EX Series) ===
  'SW': 2007, // Secret Wonders
  'MT': 2007, // Mysterious Treasures
  'DP': 2007, // Diamond & Pearl Base
  'PK': 2007, // EX Power Keepers

  // === 2003-2006 (EX Series) ===
  'DF': 2006, // EX Dragon Frontiers
  'CG': 2006, // EX Crystal Guardians
  'HP': 2006, // EX Holon Phantoms
  'LM': 2006, // EX Legend Maker
  'DS': 2005, // EX Delta Species
  'UF': 2005, // EX Unseen Forces
  'EM': 2005, // EX Emerald
  'DX': 2005, // EX Deoxys
  'TRR': 2004, // EX Team Rocket Returns
  'FR': 2004, 'FRLG': 2004, // EX FireRed & LeafGreen
  'HL': 2004, // EX Hidden Legends
  'MA': 2004, // EX Team Magma vs Team Aqua
  'DR': 2003, // EX Dragon
  'SS': 2003, // EX Sandstorm
  'RS': 2003, // EX Ruby & Sapphire

  // === 1999-2003 (Classic / WotC Era) ===
  'SK': 2003, // Skyridge
  'AQ': 2003, // Aquapolis
  'EX': 2002, // Expedition Base Set
  'LC': 2002, // Legendary Collection
  'N4': 2002, // Neo Destiny
  'N3': 2001, // Neo Revelation
  'N2': 2001, // Neo Discovery
  'N1': 2000, // Neo Genesis
  'G2': 2000, // Gym Challenge
  'G1': 2000, // Gym Heroes
  'TR': 2000, // Team Rocket
  'B2': 2000, // Base Set 2
  'FO': 1999, // Fossil
  'JU': 1999, // Jungle
  'BS': 1999, // Base Set
};

/**
 * Returns the release year for a given set code, or null if unknown.
 */
export function getSetReleaseYear(setCode: string): number | null {
  if (!setCode) return null;
  const clean = setCode.trim().toUpperCase();
  return SET_RELEASE_YEARS[clean] || null;
}

/**
 * Formats a collection expansion with its release year in front:
 * Example: "2022 - BRS - Astros Cintilantes"
 * If year is unknown: "BRS - Astros Cintilantes"
 */
export function formatSetWithYear(setCode: string, setName: string): string {
  const year = getSetReleaseYear(setCode);
  const cleanCode = (setCode || '').trim().toUpperCase();
  const cleanName = (setName || '').trim();

  if (year) {
    return `${year} - ${cleanCode} - ${cleanName}`;
  }
  return `${cleanCode} - ${cleanName}`;
}

/**
 * Sorts an array of set codes chronologically by release year (newest first).
 * Ties are sorted alphabetically by set code.
 */
export function sortSetsChronologically(setCodes: string[]): string[] {
  return [...setCodes].sort((a, b) => {
    const yearA = getSetReleaseYear(a) || 0;
    const yearB = getSetReleaseYear(b) || 0;

    if (yearB !== yearA) {
      return yearB - yearA; // Newest first
    }
    return a.localeCompare(b);
  });
}
