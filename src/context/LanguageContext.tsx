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
}

const STORAGE_KEY = "pokedex_language";

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

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        getCardName,
        getCardSetName,
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
