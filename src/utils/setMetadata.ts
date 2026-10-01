/**
 * Pokémon TCG Set Metadata: Release Years & Formatting Utilities
 * 
 * Provides official expansion release years and formatting helpers
 * to display sets uniformly across the application (e.g., "YYYY - SIGLA - Nome da Coleção").
 */
import { fixMojibake } from './textSanitizer';

export const SET_RELEASE_YEARS: Record<string, number> = {
  // === 2026 (Megaevolução Era) ===
  'ME02.5': 2026, 'ME2.5': 2026, // Heróis Excelsos / Ascended Heroes
  'ME03': 2026, 'ME3': 2026, // Equilíbrio Perfeito / Perfect Order
  'ME04': 2026, 'ME4': 2026, // Caos Ascendente / Chaos Rising
  'ME05': 2026, 'ME5': 2026, // Escuridão Absoluta / Pitch Black
  'ME06': 2026, 'ME6': 2026, // Reinado Delta / Delta Reign
  'ME07': 2026, 'ME7': 2026,
  'ME08': 2026, 'ME8': 2026,
  'ME09': 2026, 'ME9': 2026,
  'ME10': 2026,

  // === 2025 (Megaevolução & Scarlet & Violet finale) ===
  'ME01': 2025, 'ME1': 2025, // Megaevolução Base Set
  'ME02': 2025, 'ME2': 2025, // Fogo Fantasmagórico / Phantasmal Flames
  'BLK': 2025, // Black Bolt
  'WHT': 2025, // White Flare
  'DRI': 2025, // Destined Rivals / Rivais Predestinados
  'PRE': 2025, // Prismatic Evolutions / Evoluções Prismáticas
  'PBL': 2025, // Evoluções Prismáticas alias
  'JTG': 2025, // Journey Together
  'SV09': 2025, 'SV9': 2025,
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

export const SET_OFFICIAL_NAMES_PT: Record<string, string> = {
  // Megaevolução (2025-2026)
  'ME01': 'Megaevolução',
  'ME1': 'Megaevolução',
  'ME02': 'Fogo Fantasmagórico',
  'ME2': 'Fogo Fantasmagórico',
  'ME02.5': 'Heróis Excelsos',
  'ME2.5': 'Heróis Excelsos',
  'ME03': 'Equilíbrio Perfeito',
  'ME3': 'Equilíbrio Perfeito',
  'ME04': 'Caos Ascendente',
  'ME4': 'Caos Ascendente',
  'ME05': 'Escuridão Absoluta',
  'ME5': 'Escuridão Absoluta',
  'ME06': 'Reinado Delta',
  'ME6': 'Reinado Delta',

  // Scarlet & Violet
  'PRE': 'Evoluções Prismáticas',
  'PBL': 'Evoluções Prismáticas',
  'DRI': 'Rivais Predestinados',
  'JTG': 'Jornada Juntos',
  'BLK': 'Raio Preto',
  'WHT': 'Chama Branca',
  'SSP': 'Fagulhas Impetuosas', 'SV08': 'Fagulhas Impetuosas', 'SV8': 'Fagulhas Impetuosas',
  'SCR': 'Coroa Estelar', 'SV07': 'Coroa Estelar', 'SV7': 'Coroa Estelar',
  'SFA': 'Fábulas Nebulosas', 'SV06.5': 'Fábulas Nebulosas', 'SV6.5': 'Fábulas Nebulosas',
  'TWM': 'Máscaras do Crepúsculo', 'SV06': 'Máscaras do Crepúsculo', 'SV6': 'Máscaras do Crepúsculo',
  'TEF': 'Forças Temporais', 'SV05': 'Forças Temporais', 'SV5': 'Forças Temporais',
  'PAF': 'Destinos de Paldea', 'SV04.5': 'Destinos de Paldea', 'SV4.5': 'Destinos de Paldea',
  'PAR': 'Fenda Paradoxal', 'SV04': 'Fenda Paradoxal', 'SV4': 'Fenda Paradoxal',
  '151': '151', 'MEW': '151', 'SV03.5': '151', 'SV3.5': '151',
  'OBF': 'Obsidiana em Chamas', 'SV03': 'Obsidiana em Chamas', 'SV3': 'Obsidiana em Chamas',
  'PAL': 'Evoluções em Paldea', 'SV02': 'Evoluções em Paldea', 'SV2': 'Evoluções em Paldea',
  'SVI': 'Escarlate e Violeta', 'SV01': 'Escarlate e Violeta', 'SV1': 'Escarlate e Violeta',
  'SVP': 'Escarlate e Violeta Promos',
  'SVE': 'Cartas Promocionais / Básicas',

  // Sword & Shield
  'CRZ': 'Zênite Régio', 'SWSH12.5': 'Zênite Régio',
  'SIT': 'Tempestade Prateada', 'SWSH12': 'Tempestade Prateada',
  'LOR': 'Origem Perdida', 'SWSH11': 'Origem Perdida',
  'PGO': 'Pokémon GO', 'SWSH10.5': 'Pokémon GO',
  'ASR': 'Resplendor Astral', 'SWSH10': 'Resplendor Astral',
  'BRS': 'Astros Cintilantes', 'SWSH9': 'Astros Cintilantes',
  'FST': 'Golpe Fusão', 'SWSH8': 'Golpe Fusão',
  'CEL': 'Celebrações', 'CEL25': 'Celebrações', 'SWSH7.5': 'Celebrações',
  'EVS': 'Céus Evolutivos', 'SWSH7': 'Céus Evolutivos',
  'CRE': 'Reinado Implacável', 'SWSH6': 'Reinado Implacável',
  'BST': 'Estilos de Batalha', 'SWSH5': 'Estilos de Batalha',
  'SHF': 'Destinos Brilhantes', 'SWSH4.5': 'Destinos Brilhantes',
  'VIV': 'Voltagem Vívida', 'SWSH4': 'Voltagem Vívida',
  'CPA': 'Caminho do Campeão', 'SWSH3.5': 'Caminho do Campeão',
  'DAA': 'Escuridão Incandescente', 'SWSH3': 'Escuridão Incandescente',
  'RCL': 'Rixa Rebelde', 'SWSH2': 'Rixa Rebelde',
  'SSH': 'Espada e Escudo', 'SWSH': 'Espada e Escudo', 'SWSH1': 'Espada e Escudo',
  'SWSHP': 'Espada e Escudo Promos',

  // Sun & Moon
  'CEC': 'Eclipse Cósmico',
  'HIF': 'Destinos Ocultos',
  'UNM': 'Sintonia Mental',
  'UNB': 'Elos Inquebráveis',
  'DET': 'Detetive Pikachu',
  'TEU': 'União de Aliados',
  'LOT': 'Trovões Perdidos',
  'DRM': 'Majestade dos Dragões',
  'CES': 'Tempestade Celestial',
  'FLI': 'Luz Proibida',
  'UPR': 'Ultra Prisma',
  'CRI': 'Caos Ascendente',
  'SLG': 'Lendas Luminescentes',
  'BUS': 'Sombras Ardentes',
  'GRI': 'Guardiões Ascendentes',
  'SUM': 'Sol e Lua',
  'SM1': 'Cartas Promocionais / Básicas',
  'SMP': 'Sol e Lua Promos',

  // XY
  'EVO': 'Evoluções',
  'STS': 'Cerco de Vapor',
  'FCO': 'Fusão de Destinos',
  'GEN': 'Gerações',
  'BKP': 'Ponto de Ruptura',
  'BKT': 'Origens Ancestrais',
  'AOR': 'Origens Ancestrais',
  'ROS': 'Céus Estrondosos',
  'PRC': 'Conflito Primitivo',
  'PHF': 'Forças Fantasmas',
  'FFI': 'Punhos Furiosos',
  'FLF': 'Flash de Fogo',
  'XY': 'XY',
  
  // Black & White
  'PLB': 'Explosão de Plasma',
  'PFL': 'Congelamento de Plasma',
  'PLS': 'Tempestade de Plasma',
  'NXD': 'Próximos Destinos',
  'EPO': 'Forças Emergentes',
  'BLW': 'Black & White',
  'BW': 'Black & White',
};

/**
 * Official Regulation Mark Letters for Pokémon TCG sets.
 * Introduced in the Sword & Shield era (D, E, F) and continued in Scarlet & Violet (G, H, I).
 * Pre-SWSH expansions used set symbols/drawings ("desenhos") instead of regulation mark letters.
 */
export const SET_REGULATION_MARKS: Record<string, string> = {
  // === 2026 ('J' - Megaevolução Era) ===
  'ME02.5': 'J', 'ME2.5': 'J', // Heróis Excelsos / Ascended Heroes
  'ME03': 'J', 'ME3': 'J', // Equilíbrio Perfeito / Perfect Order
  'ME04': 'J', 'ME4': 'J', // Caos Ascendente / Chaos Rising
  'ME05': 'J', 'ME5': 'J', // Escuridão Absoluta / Pitch Black
  'ME06': 'J', 'ME6': 'J', // Reinado Delta / Delta Reign
  'ME07': 'J', 'ME7': 'J',
  'ME08': 'J', 'ME8': 'J',
  'ME09': 'J', 'ME9': 'J',
  'ME10': 'J',

  // === 2025 ('I') ===
  'ME01': 'I', 'ME1': 'I',
  'ME02': 'I', 'ME2': 'I',
  'BLK': 'I',
  'WHT': 'I',
  'DRI': 'I',
  'PRE': 'I',
  'PBL': 'I',
  'JTG': 'I',
  'SV09': 'I', 'SV9': 'I',
  'SV10': 'I',

  // === 2024 ('H') ===
  'SSP': 'H',
  'SV08': 'H', 'SV8': 'H',
  'SCR': 'H',
  'SV07': 'H', 'SV7': 'H',
  'SFA': 'H',
  'SV06.5': 'H', 'SV6.5': 'H',
  'TWM': 'H',
  'SV06': 'H', 'SV6': 'H',
  'TEF': 'H',
  'SV05': 'H', 'SV5': 'H',
  'PAF': 'H',
  'SV04.5': 'H', 'SV4.5': 'H',

  // === 2023 ('G') ===
  'PAR': 'G',
  'SV04': 'G', 'SV4': 'G',
  'MEW': 'G',
  '151': 'G', 'SV03.5': 'G', 'SV3.5': 'G',
  'OBF': 'G',
  'SV03': 'G', 'SV3': 'G',
  'PAL': 'G',
  'SV02': 'G', 'SV2': 'G',
  'SVI': 'G', 'SV1': 'G', 'SV01': 'G',
  'SVE': 'G', 'SV-BE': 'G', 'BAS': 'G',
  'SVP': 'G',

  // === 2022-2023 SWSH Finale ('F') ===
  'CRZ': 'F',
  'SWSH12.5': 'F', 'SWSH12pt5': 'F',
  'SIT': 'F',
  'SWSH12': 'F',
  'LOR': 'F',
  'SWSH11': 'F',
  'PGO': 'F',
  'SWSH10.5': 'F',
  'ASR': 'F',
  'SWSH10': 'F',
  'BRS': 'F',
  'SWSH9': 'F',

  // === 2021 ('E') ===
  'FST': 'E',
  'SWSH8': 'E',
  'CEL': 'E',
  'CEL25': 'E',
  'EVS': 'E',
  'SWSH7': 'E',
  'CRE': 'E',
  'SWSH6': 'E',
  'BST': 'E',
  'SWSH5': 'E',
  'SHF': 'D',
  'SWSH4.5': 'D',

  // === 2020 ('D') ===
  'VIV': 'D',
  'SWSH4': 'D',
  'CPA': 'D',
  'SWSH3.5': 'D',
  'DAA': 'D',
  'SWSH3': 'D',
  'RCL': 'D',
  'SWSH2': 'D',
  'SSH': 'D', 'SWSH': 'D', 'SWSH1': 'D',
  'SWSHP': 'D',
};

/**
 * Normalizes set code for dictionary and pattern matching:
 * - uppercase, trims whitespace
 * - strips hyphens, underscores, or spaces (e.g. "ME-05" -> "ME05", "SV 08" -> "SV08")
 */
export function normalizeSetCode(code: string): string {
  return (code || '').trim().toUpperCase().replace(/[-\s_]/g, '');
}

interface KnownSetPattern {
  regex: RegExp;
  year: number;
  mark?: string;
  officialNamePt: string;
}

const KNOWN_SET_NAME_PATTERNS: KnownSetPattern[] = [
  // Megaevolução (2025-2026)
  { regex: /escurid[aã]o\s+absoluta|pitch\s+black/i, year: 2026, mark: 'J', officialNamePt: 'Escuridão Absoluta' },
  { regex: /reinado\s+delta|delta\s+reign/i, year: 2026, mark: 'J', officialNamePt: 'Reinado Delta' },
  { regex: /her[oó]is\s+excelsos|ascended\s+heroes/i, year: 2026, mark: 'J', officialNamePt: 'Heróis Excelsos' },
  { regex: /equil[ií]brio\s+perfeito|perfect\s+order/i, year: 2026, mark: 'J', officialNamePt: 'Equilíbrio Perfeito' },
  { regex: /caos\s+ascendente|chaos\s+rising/i, year: 2026, mark: 'J', officialNamePt: 'Caos Ascendente' },
  { regex: /fogo\s+fantasmag[oó]rico|phantasmal\s+flames/i, year: 2025, mark: 'I', officialNamePt: 'Fogo Fantasmagórico' },
  { regex: /megaevolu[cç][aã]o|mega\s+evolution/i, year: 2025, mark: 'I', officialNamePt: 'Megaevolução' },

  // Scarlet & Violet (2023-2025)
  { regex: /evolu[cç][oõ]es\s+prism[aá]ticas|prismatic\s+evolutions/i, year: 2025, mark: 'I', officialNamePt: 'Evoluções Prismáticas' },
  { regex: /rivais\s+predestinados|destined\s+rivals/i, year: 2025, mark: 'I', officialNamePt: 'Rivais Predestinados' },
  { regex: /jornada\s+juntos|journey\s+together/i, year: 2025, mark: 'I', officialNamePt: 'Jornada Juntos' },
  { regex: /raio\s+preto|black\s+bolt/i, year: 2025, mark: 'I', officialNamePt: 'Raio Preto' },
  { regex: /chama\s+branca|white\s+flare/i, year: 2025, mark: 'I', officialNamePt: 'Chama Branca' },
  { regex: /fagulhas\s+impetuosas|surging\s+sparks/i, year: 2024, mark: 'H', officialNamePt: 'Fagulhas Impetuosas' },
  { regex: /coroa\s+estelar|stellar\s+crown/i, year: 2024, mark: 'H', officialNamePt: 'Coroa Estelar' },
  { regex: /f[aá]bulas\s+nebulosas|shrouded\s+fable/i, year: 2024, mark: 'H', officialNamePt: 'Fábulas Nebulosas' },
  { regex: /m[aá]scaras\s+do\s+crep[uú]sculo|twilight\s+masquerade/i, year: 2024, mark: 'H', officialNamePt: 'Máscaras do Crepúsculo' },
  { regex: /for[cç]as\s+temporais|temporal\s+forces/i, year: 2024, mark: 'H', officialNamePt: 'Forças Temporais' },
  { regex: /destinos\s+de\s+paldea|paldean\s+fates/i, year: 2024, mark: 'H', officialNamePt: 'Destinos de Paldea' },
  { regex: /fenda\s+paradoxal|paradox\s+rift/i, year: 2023, mark: 'G', officialNamePt: 'Fenda Paradoxal' },
  { regex: /obsidiana\s+em\s+chamas|obsidian\s+flames/i, year: 2023, mark: 'G', officialNamePt: 'Obsidiana em Chamas' },
  { regex: /evolu[cç][oõ]es\s+em\s+paldea|paldea\s+evolved/i, year: 2023, mark: 'G', officialNamePt: 'Evoluções em Paldea' },
  { regex: /escarlate\s+e\s+violeta|scarlet\s+&\s+violet/i, year: 2023, mark: 'G', officialNamePt: 'Escarlate e Violeta' },
  { regex: /pok[eé]mon\s+151|\b151\b/i, year: 2023, mark: 'G', officialNamePt: '151' },

  // Sword & Shield (2020-2023)
  { regex: /z[eê]nite\s+r[eé]gio|crown\s+zenith/i, year: 2023, mark: 'F', officialNamePt: 'Zênite Régio' },
  { regex: /tempestade\s+prateada|silver\s+tempest/i, year: 2022, mark: 'F', officialNamePt: 'Tempestade Prateada' },
  { regex: /origem\s+perdida|lost\s+origin/i, year: 2022, mark: 'F', officialNamePt: 'Origem Perdida' },
  { regex: /pok[eé]mon\s+go/i, year: 2022, mark: 'F', officialNamePt: 'Pokémon GO' },
  { regex: /resplendor\s+astral|astral\s+radiance/i, year: 2022, mark: 'F', officialNamePt: 'Resplendor Astral' },
  { regex: /astros\s+cintilantes|brilliant\s+stars/i, year: 2022, mark: 'F', officialNamePt: 'Astros Cintilantes' },
  { regex: /golpe\s+fus[aã]o|fusion\s+strike/i, year: 2021, mark: 'E', officialNamePt: 'Golpe Fusão' },
  { regex: /celebra[cç][oõ]es|celebrations/i, year: 2021, mark: 'E', officialNamePt: 'Celebrações' },
  { regex: /c[eé]us\s+evolutivos|evolving\s+skies/i, year: 2021, mark: 'E', officialNamePt: 'Céus Evolutivos' },
  { regex: /reinado\s+implac[aá]vel|chilling\s+reign/i, year: 2021, mark: 'E', officialNamePt: 'Reinado Implacável' },
  { regex: /estilos\s+de\s+batalha|battle\s+styles/i, year: 2021, mark: 'E', officialNamePt: 'Estilos de Batalha' },
  { regex: /destinos\s+brilhantes|shining\s+fates/i, year: 2021, mark: 'D', officialNamePt: 'Destinos Brilhantes' },
  { regex: /voltagem\s+v[ií]vida|vivid\s+voltage/i, year: 2020, mark: 'D', officialNamePt: 'Voltagem Vívida' },
  { regex: /caminho\s+do\s+campe[aã]o|champion'?s\s+path/i, year: 2020, mark: 'D', officialNamePt: 'Caminho do Campeão' },
  { regex: /escurid[aã]o\s+incandescente|darkness\s+ablaze/i, year: 2020, mark: 'D', officialNamePt: 'Escuridão Incandescente' },
  { regex: /rixa\s+rebelde|rebel\s+clash/i, year: 2020, mark: 'D', officialNamePt: 'Rixa Rebelde' },
  { regex: /espada\s+e\s+escudo|sword\s+&\s+shield/i, year: 2020, mark: 'D', officialNamePt: 'Espada e Escudo' },
];

/**
 * Heuristically infers release year and regulation mark from set code patterns.
 * Supports ME (Megaevolução), SV (Scarlet & Violet), SWSH (Sword & Shield), etc.
 */
function inferMetadataFromCodePattern(normCode: string): { year?: number; mark?: string } | null {
  if (!normCode) return null;

  // Megaevolução era (ME01..ME99)
  const meMatch = normCode.match(/^ME0?([1-9]\d*(\.\d+)?)$/i);
  if (meMatch) {
    const num = parseFloat(meMatch[1]);
    if (num <= 2) {
      return { year: 2025, mark: 'I' };
    } else if (num <= 10) {
      return { year: 2026, mark: 'J' };
    } else {
      return { year: 2027, mark: 'K' };
    }
  }

  // Scarlet & Violet era (SV01..SV12)
  const svMatch = normCode.match(/^SV0?([1-9]\d*(\.\d+)?)$/i);
  if (svMatch) {
    const num = parseFloat(svMatch[1]);
    if (num < 4.5) return { year: 2023, mark: 'G' };
    if (num <= 8.5) return { year: 2024, mark: 'H' };
    if (num <= 12) return { year: 2025, mark: 'I' };
    return { year: 2026, mark: 'J' };
  }

  // Sword & Shield era (SWSH01..SWSH12.5)
  const swshMatch = normCode.match(/^SWSH0?([1-9]\d*(\.\d+)?)$/i);
  if (swshMatch) {
    const num = parseFloat(swshMatch[1]);
    if (num <= 4.5) return { year: 2020, mark: 'D' };
    if (num <= 8) return { year: 2021, mark: 'E' };
    return { year: 2022, mark: 'F' };
  }

  // Sun & Moon era (SM01..SM12)
  const smMatch = normCode.match(/^SM0?([1-9]\d*(\.\d+)?)$/i);
  if (smMatch) {
    const num = parseFloat(smMatch[1]);
    if (num <= 4) return { year: 2017 };
    if (num <= 8) return { year: 2018 };
    return { year: 2019 };
  }

  // XY era (XY01..XY12)
  const xyMatch = normCode.match(/^XY0?([1-9]\d*(\.\d+)?)$/i);
  if (xyMatch) {
    const num = parseFloat(xyMatch[1]);
    if (num <= 4) return { year: 2014 };
    if (num <= 8) return { year: 2015 };
    return { year: 2016 };
  }

  // Black & White era (BW01..BW11)
  const bwMatch = normCode.match(/^BW0?([1-9]\d*(\.\d+)?)$/i);
  if (bwMatch) {
    const num = parseFloat(bwMatch[1]);
    if (num <= 3) return { year: 2011 };
    if (num <= 7) return { year: 2012 };
    return { year: 2013 };
  }

  return null;
}

/**
 * Returns the regulation mark letter (e.g. 'D', 'E', 'F', 'G', 'H', 'I', 'J')
 * for modern sets, or null if the set uses a set symbol/drawing (pre-SWSH).
 * Accepts optional setName for fallback identification.
 */
export function getSetRegulationMark(setCode: string, setName?: string): string | null {
  const raw = (setCode || '').trim().toUpperCase();
  const norm = normalizeSetCode(raw);

  // 1. Direct dictionary match
  if (raw && SET_REGULATION_MARKS[raw]) return SET_REGULATION_MARKS[raw];
  if (norm && SET_REGULATION_MARKS[norm]) return SET_REGULATION_MARKS[norm];

  // 2. Pattern inference from set code
  const codeInferred = inferMetadataFromCodePattern(norm || raw);
  if (codeInferred?.mark) return codeInferred.mark;

  // 3. Heuristic matching by set name
  if (setName) {
    const cleanName = fixMojibake(setName).toLowerCase();
    for (const pattern of KNOWN_SET_NAME_PATTERNS) {
      if (pattern.regex.test(cleanName)) {
        return pattern.mark || null;
      }
    }
  }

  return null;
}

/**
 * Returns the release year for a given set code, or null if unknown.
 * Accepts optional setName for fallback identification.
 */
export function getSetReleaseYear(setCode: string, setName?: string): number | null {
  const raw = (setCode || '').trim().toUpperCase();
  const norm = normalizeSetCode(raw);

  // 1. Direct dictionary match
  if (raw && SET_RELEASE_YEARS[raw]) return SET_RELEASE_YEARS[raw];
  if (norm && SET_RELEASE_YEARS[norm]) return SET_RELEASE_YEARS[norm];

  // 2. Pattern inference from set code
  const codeInferred = inferMetadataFromCodePattern(norm || raw);
  if (codeInferred?.year) return codeInferred.year;

  // 3. Heuristic matching by set name
  if (setName) {
    const cleanName = fixMojibake(setName).toLowerCase();
    for (const pattern of KNOWN_SET_NAME_PATTERNS) {
      if (pattern.regex.test(cleanName)) {
        return pattern.year;
      }
    }
  }

  return null;
}

/**
 * Formats a collection expansion with its release year and regulation mark letter in front:
 * Example with letter: "2026 - J - ME05 - Escuridão Absoluta"
 * Example with letter: "2022 - F - BRS - Astros Cintilantes"
 * Example without letter (drawing / pre-SWSH): "2017 - CRI - Caos Ascendente"
 * If year is unknown: "ME05 - Escuridão Absoluta"
 */
export function formatSetWithYear(setCode: string, setName?: string, customMark?: string): string {
  const rawCode = (setCode || '').trim().toUpperCase();
  const normCode = normalizeSetCode(rawCode);
  
  const year = getSetReleaseYear(rawCode, setName);
  const mark = (customMark || getSetRegulationMark(rawCode, setName) || '').trim().toUpperCase();
  
  // Prefer official Portuguese name with guaranteed proper accents (ç, ã, é, etc.)
  let rawName = SET_OFFICIAL_NAMES_PT[rawCode] || SET_OFFICIAL_NAMES_PT[normCode];

  if (!rawName && setName) {
    const cleanNameLower = fixMojibake(setName).toLowerCase();
    for (const pattern of KNOWN_SET_NAME_PATTERNS) {
      if (pattern.regex.test(cleanNameLower)) {
        rawName = pattern.officialNamePt;
        break;
      }
    }
  }

  if (!rawName) {
    rawName = setName || rawCode;
  }

  const cleanName = fixMojibake(rawName).trim();

  const parts: string[] = [];
  if (year) {
    parts.push(String(year));
  }
  if (mark) {
    parts.push(mark);
  }
  if (rawCode) {
    parts.push(rawCode);
  }
  if (cleanName && cleanName !== rawCode) {
    parts.push(cleanName);
  }

  return parts.join(' - ');
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

