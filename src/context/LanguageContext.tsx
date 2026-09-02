import React, { createContext, useContext, useState, useEffect } from "react";
import { en, TranslationKeys } from "../i18n/locales/en";
import { pt } from "../i18n/locales/pt";
import { soundEffects } from "../services/audio";

export type SupportedLanguage = "pt" | "en";

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  getCardName: (card: { name_pt?: string; name_en?: string }) => string;
  getCardSetName: (card: { set_pt?: string; set_en?: string }) => string;
  localizePlaybookTitle: (title: string) => string;
  localizePlaybookStep: (step: string) => string;
  localizePrizeTradeTip: (tip: string) => string;
  localizeDeckText: (text: string) => string;
  localizeFormat: (format: string) => string;
}

const STORAGE_KEY = "pokedex_language";

const PLAYBOOK_STEP_TRANSLATIONS: Record<string, string> = {
  // Mewtwo & Mew-GX Turbo
  "Immediate Objective: Set Mewtwo & Mew-GX or Eevee active, benching Sneasel immediately.":
    "Objetivo Imediato: Coloque Mewtwo & Mew-GX ou Eevee ativo, descendo Sneasel no banco imediatamente.",
  "Viridian Forest Value: Use Viridian Forest on Turn 1 to discard heavy GX cards (like Charizard-GX or Darkrai-GX) and fetch required energy.":
    "Valor de Floresta de Viridian: Use Floresta de Viridian no Turno 1 para descartar cartas GX pesadas (como Charizard-GX ou Darkrai-GX) e buscar energia necessária.",
  "Perfection Engine: Mewtwo & Mew-GX Perfection ability copies attacks of GX Pokémon in your discard pile.":
    "Motor de Perfeição: A habilidade Perfeição do Mewtwo & Mew-GX copia ataques de Pokémon GX na sua pilha de descarte.",
  "Weavile Punishment: Evolve Sneasel into Weavile. Rule of Evil / Mind Jack deals scaled damage based on enemy abilities.":
    "Punição com Weavile: Evolua Sneasel para Weavile. Rule of Evil / Mind Jack causa dano escalonado com base nas habilidades do oponente.",
  "Low-Cost OHKO: Against popular engines (Gardevoir/Bibarel/Dedenne), Weavile knocks out heavy attackers for just 1 Darkness Energy.":
    "Nocaute de Baixo Custo: Contra motores populares (Gardevoir/Bibarel/Dedenne), Weavile nocauteia atacantes pesados por apenas 1 Energia de Escuridão.",
  "Black Market Prism Shield: While Black Market ◇ is active, when your Darkness Pokémon with energy is knocked out, opponent takes 1 less Prize.":
    "Escudo Black Market Prism: Enquanto Black Market ◇ estiver ativo, quando seu Pokémon de Escuridão com energia for nocauteado, o oponente pega 1 Prêmio a menos.",
  "Against high-HP threats (250+ HP), copy Crimson Wings or Charizard-GX attacks via Mewtwo & Mew-GX for 300 devastating damage to close the game.":
    "Contra ameaças de alto HP (250+ HP), copie Crimson Wings ou ataques de Charizard-GX via Mewtwo & Mew-GX para 300 de dano devastador e fechar o jogo.",
  "Maintain prize advantage to win the 6-prize race.":
    "Mantenha a vantagem na troca de prêmios para vencer a corrida dos 6 prêmios.",

  // Necrozma
  "Start with Inkay on Bench and either Audino or Jirachi active to dig through deck with Mysterious Treasure.":
    "Comece com Inkay no banco e Audino ou Jirachi ativos para cavar o deck com Tesouro Misterioso.",
  "Discard Psychic Energies early using Viridian Forest or Ultra Ball to seed the discard pile for Malamar.":
    "Descarte Energias Psíquicas cedo usando Floresta de Viridian ou Ultra Bola para alimentar a pilha de descarte para o Malamar.",
  "Attach Special Energy (Recycle Energy) to Necrozma as soon as possible.":
    "Ligue Energia Especial (Energia de Reciclagem) ao Necrozma o mais rápido possível.",
  "Evolve multiple Inkay into Malamar (Psychic Recharge) to attach extra Psychic Energies from discard every turn.":
    "Evolua múltiplos Inkay em Malamar (Recarga Psíquica) para ligar Energias Psíquicas extras do descarte todo turno.",
  "Attack with Necrozma's Special Laser for 160 damage consistently each turn using Recycle Energy.":
    "Ataque com o Laser Especial do Necrozma causando 160 de dano consistente a cada turno usando Energia de Reciclagem.",
  "Deploy Giratina (Shadow Impact) to hit for 130 damage while recycling itself from the discard pile.":
    "Coloque Giratina (Impacto das Sombras) para bater 130 de dano enquanto se recicla da pilha de descarte.",
  "Use Necrozma or Giratina to clean up remaining Prize Cards.":
    "Use Necrozma ou Giratina para nocautear e coletar as últimas cartas de prêmio.",
  "If facing heavy GX/V Pokémon, use Spell Tag residue damage to fix math for 1-hit knockouts.":
    "Se enfrentar Pokémon GX/V pesados, use o dano residual da Tag de Feitiço para calibrar o dano de nocaute em 1 golpe.",

  // Charizard ex
  "Bench Charmander and Pidgey on Turn 1 with Buddy-Buddy Poffin.":
    "Desça Charmander e Pidgey no banco no Turno 1 com Poffin de Companheirismo.",
  "Prepare Rare Candy and Arven to evolve Turn 2.":
    "Prepare Doce Raro e Arven para evoluir no Turno 2.",
  "Evolve Pidgeot ex (Quick Search) and Charizard ex (Infernal Reign).":
    "Evolua Pidgeot ex (Busca Rápida) e Charizard ex (Reinado Infernal).",
  "Accelerate Fire Energies from deck to power up Charizard and Radiant Charizard.":
    "Acelere Energias de Fogo do deck para carregar Charizard e Charizard Radiante.",
  "Charizard ex attack scales with enemy prizes taken (Burning Darkness).":
    "O ataque de Charizard ex escala com prêmios pegos pelo adversário (Escuridão Ardente).",
  "Deliver massive 300+ damage strikes to finish the game.":
    "Desfira golpes massivos de 300+ de dano para encerrar a partida.",

  // Gardevoir ex
  "Bench Ralts and Kirlia Turn 1 and 2.":
    "Desça Ralts e Kirlia no banco nos turnos 1 e 2.",
  "Discard Psychic Energies with Refinement (Kirlia) and Ultra Ball.":
    "Descarte Energias Psíquicas com Refinamento (Kirlia) e Ultra Bola.",
  "Evolve Gardevoir ex (Psychic Embrace) to attach infinite energies from discard.":
    "Evolua Gardevoir ex (Abraço Psíquico) para ligar energias infinitas do descarte.",
  "Attack with Drifloon or Scream Tail using Bravery Charm for 300+ damage.":
    "Ataque com Drifloon ou Scream Tail usando Pingente da Bravura para 300+ de dano.",
  "Snipe bench threats or OHKO active Pokémon.":
    "Elimine ameaças no banco ou nocauteie o Pokémon ativo com 1 golpe.",

  // Lugia VSTAR
  "Bench Lugia V and search Double Turbo Energy.":
    "Desça Lugia V no banco e busque Energia Turbo Dupla.",
  "Discard 2 Archeops using Ultra Ball or Professor's Research.":
    "Descarte 2 Archeops usando Ultra Bola ou Pesquisa de Professores.",
  "Use Lugia VSTAR VSTAR Power (Summoning Star) to bench 2 Archeops directly from discard.":
    "Use o Poder VSTAR de Lugia VSTAR (Estrela Invocadora) para colocar 2 Archeops no banco direto do descarte.",
  "Archeops Primal Turbo attaches Special Energies to attackers each turn.":
    "O Turbo Primitivo dos Archeops liga Energias Especiais aos atacantes a cada turno.",
  "Attack with Cinccino, Lugia VSTAR, or Iron Hands ex.":
    "Ataque com Cinccino, Lugia VSTAR ou Iron Hands ex.",

  // Generic & Fallbacks
  "Setup your Basic Pokémon and bench engine.":
    "Prepare seu Pokémon Básico e o motor do banco.",
  "Power up attackers and trade prizes efficiently.":
    "Energize atacantes e troque cartas de prêmio com eficiência.",
  "Close out remaining Prize Cards.":
    "Finalize as cartas de prêmio restantes.",
  "Start with active Basic Pokémon and establish bench.":
    "Comece com o Pokémon Básico ativo e estabeleça seu banco.",
  "Evolve attackers and attach energy each turn.":
    "Evolua os atacantes e ligue energia a cada turno.",
  "Execute finishing attacks to claim all Prize cards.":
    "Execute ataques finalizadores para pegar todas as cartas de prêmio.",
  "Add cards to the deck.":
    "Adicione cartas ao deck."
};

const PRIZE_TIPS_TRANSLATIONS: Record<string, string> = {
  "Prioritize trading 1-Prize Weaviles into 2-Prize Pokémon-GX/V. Never bench Dedenne-GX unless emergency draw is required.":
    "Priorize trocar Weaviles de 1 Prêmio contra Pokémon-GX/V de 2 Prêmios. Evite descer Dedenne-GX a menos que precise comprar cartas com urgência.",
  "Necrozma gives up only 1 Prize Card. Trade 2 hits against opponent GX/V while they take only 1 prize per knockout.":
    "Necrozma concede apenas 1 Carta de Prêmio. Troque 2 golpes contra GX/V do oponente enquanto eles pegam apenas 1 prêmio por nocaute.",
  "Charizard gets stronger as your opponent takes Prize Cards. Don't fear falling behind early.":
    "Charizard fica mais forte conforme o oponente pega cartas de prêmio. Não tenha medo de ficar atrás no início.",
  "Drifloon and Scream Tail are 1-Prize attackers capable of one-shotting 2-Prize and 3-Prize ex/V Pokémon.":
    "Drifloon e Scream Tail são atacantes de 1 Prêmio capazes de nocautear Pokémon ex/V de 2 ou 3 Prêmios com um só golpe.",
  "Archeops allows infinite flexibility with Special Energy. Plan attachments carefully.":
    "Archeops permite flexibilidade total com Energias Especiais. Planeje as ligações com cuidado.",
  "Prioritize maintaining the prize trade advantage.":
    "Priorize manter a vantagem na troca de cartas de prêmio."
};

const DECK_TEXT_TRANSLATIONS: Record<string, string> = {
  "Theme Deck / Expanded hybrid revolving around Necrozma's Special Laser powered by Malamar's Psychic Recharge energy acceleration.":
    "Deck Temático / Híbrido Expandido focado no Laser Especial do Necrozma carregado pela aceleração de energia da Recarga Psíquica do Malamar.",
  "Fast Dark-Psychic GX deck using Mewtwo & Mew-GX Perfection to copy attacks of discarded GX Pokémon, backed by Weavile GX.":
    "Deck rápido de GX Psíquico/Escuridão usando Perfeição do Mewtwo & Mew-GX para copiar ataques de Pokémon GX descartados, com suporte de Weavile GX.",
  "Dominant Standard archetype using Infernal Reign to rapidly accelerate Fire Energy and Pidgeot ex for turn-by-turn search.":
    "Arquétipo dominante do formato Padrão usando Reinado Infernal para acelerar rapidamente Energia de Fogo e Pidgeot ex para busca a cada turno.",
  "High-skill psychic control deck attaching discard energy infinitely with Psychic Embrace to deliver single-prize OHKOs.":
    "Deck psíquico de alto controle ligando energias do descarte infinitamente com Abraço Psíquico para nocautes devastadores com atacantes de 1 prêmio.",
  "Legendary powerhouse using Lugia VSTAR's Summoning Star to summon Archeops and attach Special Energies freely.":
    "Poder lendário usando a Estrela Invocadora de Lugia VSTAR para invocar Archeops e ligar Energias Especiais livremente.",
  "Take 6 Prize Cards by cycling Energy with Malamar to power up Necrozma Special Laser attack.":
    "Pegar 6 Cartas de Prêmio ciclando Energia com Malamar para energizar o ataque Laser Especial do Necrozma.",
  "Rapidly discard heavy GX Pokémon, attach Dark Energies via Weavile, and deliver high burst damage with Mewtwo & Mew-GX.":
    "Descartar rapidamente Pokémon GX pesados, ligar Energias de Escuridão via Weavile e desferir alto dano explosivo com Mewtwo & Mew-GX.",
  "Take 6 Prize Cards by evolving Charizard ex and scaling damage with Burning Darkness as opponent takes prizes.":
    "Pegar 6 Cartas de Prêmio evoluindo Charizard ex e escalonando o dano com Escuridão Ardente conforme o adversário pega prêmios.",
  "Accelerate Psychic Energy to 1-Prize attackers (Drifloon / Scream Tail) and trade prizes favorably.":
    "Acelerar Energia Psíquica para atacantes de 1 Prêmio (Drifloon / Scream Tail) e realizar trocas de prêmios vantajosas.",
  "Use Primal Turbo to attach Double Turbo / Legacy Energy to Cinccino and Lugia VSTAR to claim 6 Prize Cards fast.":
    "Usar Turbo Primitivo para ligar Energia Turbo Dupla / Legado ao Cinccino e Lugia VSTAR para pegar 6 Cartas de Prêmio rapidamente."
};

const dictionaries: Record<SupportedLanguage, any> = {
  en,
  pt,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "pt" || stored === "en") {
        return stored;
      }
      if (typeof navigator !== "undefined" && navigator.language) {
        if (navigator.language.toLowerCase().startsWith("pt")) {
          return "pt";
        }
      }
    } catch {
      // ignore
    }
    return "en";
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
      document.documentElement.lang = language === "pt" ? "pt-BR" : "en";
    } catch {
      // ignore
    }
  }, [language]);

  const setLanguage = (lang: SupportedLanguage) => {
    soundEffects.playClick();
    setLanguageState(lang);
  };

  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split(".");
    let current: any = dictionaries[language];
    let fallback: any = dictionaries.en;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        current = undefined;
        break;
      }
    }

    if (current === undefined || typeof current !== "string") {
      // Fallback to English
      for (const key of keys) {
        if (fallback && typeof fallback === "object" && key in fallback) {
          fallback = fallback[key];
        } else {
          fallback = undefined;
          break;
        }
      }
      current = typeof fallback === "string" ? fallback : path;
    }

    if (typeof current !== "string") {
      return path;
    }

    if (params) {
      return current.replace(/\{([a-zA-Z0-9_-]+)\}/g, (_, key) => {
        return params[key] !== undefined ? String(params[key]) : `{${key}}`;
      });
    }

    return current;
  };

  const getCardName = (card: { name_pt?: string; name_en?: string }): string => {
    if (language === "pt") {
      return card.name_pt || card.name_en || "";
    }
    return card.name_en || card.name_pt || "";
  };

  const getCardSetName = (card: { set_pt?: string; set_en?: string }): string => {
    if (language === "pt") {
      return card.set_pt || card.set_en || "";
    }
    return card.set_en || card.set_pt || "";
  };

  const localizePlaybookTitle = (title: string): string => {
    if (!title) return '';
    if (language === 'pt') {
      if (/1\.\s*Opening/i.test(title)) {
        return title.includes('Turns') || title.includes('Turnos')
          ? '1. Plano de Abertura (Turnos 1 e 2)'
          : '1. Plano de Abertura';
      }
      if (/2\.\s*Midgame/i.test(title)) {
        return title.includes('Turns') || title.includes('Turnos')
          ? '2. Meio de Jogo (Turnos 3 a 5)'
          : '2. Estratégia de Meio de Jogo';
      }
      if (/3\.\s*Endgame/i.test(title)) {
        return title.includes('Closing') || title.includes('Execution')
          ? '3. Finalização / Fim de Jogo'
          : '3. Fim de Jogo';
      }
    } else {
      if (/1\.\s*Plano de Abertura/i.test(title)) {
        return title.includes('Turnos')
          ? '1. Opening Plan (Turns 1 & 2)'
          : '1. Opening Plan';
      }
      if (/2\.\s*Meio de Jogo/i.test(title) || /2\.\s*Estratégia de Meio de Jogo/i.test(title)) {
        return title.includes('Turnos')
          ? '2. Midgame Development (Turns 3 to 5)'
          : '2. Midgame Strategy';
      }
      if (/3\.\s*Finalização/i.test(title) || /3\.\s*Fim de Jogo/i.test(title)) {
        return '3. Endgame Execution';
      }
    }
    return title;
  };

  const localizePlaybookStep = (step: string): string => {
    if (!step) return '';
    if (language === 'pt') {
      if (PLAYBOOK_STEP_TRANSLATIONS[step]) {
        return PLAYBOOK_STEP_TRANSLATIONS[step];
      }
    } else {
      for (const [enStep, ptStep] of Object.entries(PLAYBOOK_STEP_TRANSLATIONS)) {
        if (ptStep === step) return enStep;
      }
    }
    return step;
  };

  const localizePrizeTradeTip = (tip: string): string => {
    if (!tip) return '';
    if (language === 'pt') {
      if (PRIZE_TIPS_TRANSLATIONS[tip]) {
        return PRIZE_TIPS_TRANSLATIONS[tip];
      }
    } else {
      for (const [enTip, ptTip] of Object.entries(PRIZE_TIPS_TRANSLATIONS)) {
        if (ptTip === tip) return enTip;
      }
    }
    return tip;
  };

  const localizeDeckText = (text: string): string => {
    if (!text) return '';
    if (language === 'pt') {
      if (DECK_TEXT_TRANSLATIONS[text]) {
        return DECK_TEXT_TRANSLATIONS[text];
      }
    } else {
      for (const [enText, ptText] of Object.entries(DECK_TEXT_TRANSLATIONS)) {
        if (ptText === text) return enText;
      }
    }
    return text;
  };

  const localizeFormat = (format: string): string => {
    if (!format) return '';
    if (language === 'pt') {
      if (format === 'Standard') return 'Padrão (Standard)';
      if (format === 'Expanded') return 'Expandido (Expanded)';
      return format;
    } else {
      if (format === 'Padrão (Standard)') return 'Standard';
      if (format === 'Expandido (Expanded)') return 'Expanded';
      return format;
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        getCardName,
        getCardSetName,
        localizePlaybookTitle,
        localizePlaybookStep,
        localizePrizeTradeTip,
        localizeDeckText,
        localizeFormat,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
