"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getEnglishSource,
  translate,
  translateText,
  type Language,
} from "@/lib/i18n/translations";

const LANGUAGE_STORAGE_KEY = "budgetwatch-language";
const LANGUAGE_EVENT = "budgetwatch-language-change";
const textSources = new WeakMap<Text, string>();
const attributeSources = new WeakMap<Element, Map<string, string>>();

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getLanguageSnapshot(): Language {
  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return savedLanguage === "hi" ? "hi" : "en";
}

function subscribeToLanguage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(LANGUAGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LANGUAGE_EVENT, callback);
  };
}

function localizeDomNode(node: Node, language: Language) {
  if (node.nodeType === Node.TEXT_NODE) {
    const textNode = node as Text;
    if (textNode.parentElement?.closest("[data-i18n-skip]")) return;
    const currentText = textNode.data;
    const source =
      textSources.get(textNode) ??
      (language === "hi" ? getEnglishSource(currentText) : currentText);
    textSources.set(textNode, source);
    const translated = translateText(language, source);
    if (textNode.data !== translated) textNode.data = translated;
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const element = node as Element;
  if (element.hasAttribute("data-i18n-skip")) return;
  let sources = attributeSources.get(element);
  if (!sources) {
    sources = new Map();
    attributeSources.set(element, sources);
  }

  for (const attribute of [
    "aria-label",
    "placeholder",
    "title",
    "alt",
    "data-label",
  ]) {
    const value = element.getAttribute(attribute);
    if (value === null) continue;
    const source =
      sources.get(attribute) ??
      (language === "hi" ? getEnglishSource(value) : value);
    sources.set(attribute, source);
    const translated = translateText(language, source);
    if (value !== translated) element.setAttribute(attribute, translated);
  }

  for (const child of element.childNodes) {
    localizeDomNode(child, language);
  }
}

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const language = useSyncExternalStore<Language>(
    subscribeToLanguage,
    getLanguageSnapshot,
    () => "en",
  );

  useEffect(() => {
    document.documentElement.lang = language;

    localizeDomNode(document.body, language);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData") {
          localizeDomNode(record.target, language);
        } else if (record.type === "attributes") {
          localizeDomNode(record.target, language);
        } else {
          for (const addedNode of record.addedNodes) {
            localizeDomNode(addedNode, language);
          }
        }
      }
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: [
        "aria-label",
        "placeholder",
        "title",
        "alt",
        "data-label",
      ],
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [language]);

  function setLanguage(nextLanguage: Language) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    window.dispatchEvent(new Event(LANGUAGE_EVENT));
  }

  const value: LanguageContextValue = {
    language,
    setLanguage,
    t: (key) => translate(language, key),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider.");
  }
  return context;
}
