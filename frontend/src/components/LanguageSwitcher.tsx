import React from "react";
import { Language } from "../i18n";

interface LanguageSwitcherProps {
 language: Language;
 setLanguage: (language: Language) => void;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
 language,
 setLanguage,
}) => {
 return (
  <div className="flex items-center space-x-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-full">
   <button
    onClick={() => setLanguage("pt")}
    className={`px-3 py-1 text-sm font-bold rounded-full transition-colors ${
     language === "pt"
      ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400"
      : "text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600"
    }`}
   >
    PT-BR
   </button>
   <button
    onClick={() => setLanguage("en")}
    className={`px-3 py-1 text-sm font-bold rounded-full transition-colors ${
     language === "en"
      ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400"
      : "text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600"
    }`}
   >
    EN
   </button>
  </div>
 );
};

export default LanguageSwitcher;
