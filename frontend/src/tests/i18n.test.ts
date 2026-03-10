import { describe, it, expect } from "vitest";
import { translations, getTranslator } from "../i18n";
import type { Language } from "../i18n";

describe("i18n", () => {
 const languages = Object.keys(translations) as Language[];

 describe("getTranslator", () => {
  it("returns an object for 'en'", () => {
   const t = getTranslator("en");
   expect(t).toBeDefined();
   expect(typeof t).toBe("object");
  });

  it("returns an object for 'pt'", () => {
   const t = getTranslator("pt");
   expect(t).toBeDefined();
   expect(typeof t).toBe("object");
  });
 });

 describe("translation completeness", () => {
  const enKeys = Object.keys(translations.en).sort();
  const ptKeys = Object.keys(translations.pt).sort();

  it("en and pt have the same number of keys", () => {
   expect(enKeys.length).toBe(ptKeys.length);
  });

  it("pt contains all keys from en", () => {
   const missing = enKeys.filter((k) => !ptKeys.includes(k));
   expect(missing).toEqual([]);
  });

  it("en contains all keys from pt", () => {
   const extra = ptKeys.filter((k) => !enKeys.includes(k));
   expect(extra).toEqual([]);
  });
 });

 describe("no empty string values", () => {
  languages.forEach((lang) => {
   it(`no empty values in '${lang}'`, () => {
    const t = translations[lang];
    const emptyKeys = Object.entries(t)
     .filter(([, v]) => typeof v === "string" && v.trim() === "")
     .map(([k]) => k);
    expect(emptyKeys).toEqual([]);
   });
  });
 });

 describe("all values are strings", () => {
  languages.forEach((lang) => {
   it(`all values in '${lang}' are strings`, () => {
    const t = translations[lang];
    Object.entries(t).forEach(([, value]) => {
     expect(typeof value).toBe("string");
    });
   });
  });
 });
});
