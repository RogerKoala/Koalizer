import React, { useState, useRef, useEffect } from "react";
import { Language } from "../i18n";
import { APP_VERSION } from "../constants";
import { open } from "@tauri-apps/plugin-shell";

import githubLogo from "../assets/github.png";
import tauriLogo from "../assets/tauri.png";
import hfLogo from "../assets/hugging-face.png";
import ffmpegLogo from "../assets/ffmpeg.png";
import linkedinLogo from "../assets/linkedin.png";
import kaggleLogo from "../assets/kaggle.png";
import { Cog8ToothIcon } from "@heroicons/react/24/outline";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";
import { InformationCircleIcon } from "@heroicons/react/20/solid";

interface SettingsProps {
 language: Language;
 setLanguage: (language: Language) => void;
 theme: "light" | "dark";
 setTheme: (theme: "light" | "dark") => void;
 t: any;
}

const Settings: React.FC<SettingsProps> = ({
 language,
 setLanguage,
 theme,
 setTheme,
 t,
}) => {
 const [isOpen, setIsOpen] = useState(false);
 const [showCredits, setShowCredits] = useState(false);
 const dropdownRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
   if (
    dropdownRef.current &&
    !dropdownRef.current.contains(event.target as Node)
   ) {
    setIsOpen(false);
   }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
   document.removeEventListener("mousedown", handleClickOutside);
  };
 }, []);

 const toggleSettings = () => {
  setIsOpen(!isOpen);
  setShowCredits(false);
 };

 const handleLanguageChange = (newLanguage: Language) => {
  setLanguage(newLanguage);
 };

 const handleThemeChange = (newTheme: "light" | "dark") => {
  setTheme(newTheme);
 };

 const showCreditsModal = () => {
  setShowCredits(true);
  setIsOpen(false);
  document.body.style.overflow = "hidden";
 };

 const closeCreditsModal = () => {
  setShowCredits(false);
  document.body.style.overflow = "auto";
 };

 const handleLinkClick = async (
  e: React.MouseEvent<HTMLAnchorElement>,
  url: string,
 ) => {
  e.preventDefault();
  try {
   await open(url);
  } catch (err) {
   console.error(err);
  }
 };

 return (
  <div className="relative" ref={dropdownRef}>
   <button
    onClick={toggleSettings}
    className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all duration-200 hover:scale-105 theme-button cursor-pointer"
   >
    <Cog8ToothIcon className="size-5 transition-transform duration-300 settings-icon stroke-2" />
   </button>

   {isOpen && (
    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 settings-dropdown">
     <div className="p-4">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
       {t.settings}
      </h3>

      {/* Language and Theme Sections (MANTIDOS IGUAIS) */}
      <div className="mb-4">
       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        {t.language}
       </label>
       <div className="flex space-x-2">
        <button
         onClick={() => handleLanguageChange("pt")}
         className={`px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
          language === "pt"
           ? "bg-blue-500 text-white"
           : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
         }`}
        >
         {t.ptBr}
        </button>
        <button
         onClick={() => handleLanguageChange("en")}
         className={`px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
          language === "en"
           ? "bg-blue-500 text-white"
           : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
         }`}
        >
         {t.eng}
        </button>
       </div>
      </div>

      <div className="mb-4">
       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        {t.theme}
       </label>
       <div className="flex space-x-2">
        <button
         onClick={() => handleThemeChange("light")}
         className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-2 cursor-pointer ${
          theme === "light"
           ? "bg-blue-500 text-white"
           : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
         }`}
        >
         <SunIcon className="size-5 transition-transform duration-300" />
         <span>{t.lightTheme}</span>
        </button>
        <button
         onClick={() => handleThemeChange("dark")}
         className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-2 cursor-pointer ${
          theme === "dark"
           ? "bg-blue-500 text-white"
           : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
         }`}
        >
         <MoonIcon className="size-4 transition-transform duration-300" />
         <span>{t.darkTheme}</span>
        </button>
       </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
       <button
        onClick={showCreditsModal}
        className="w-full px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors flex items-center justify-center space-x-2 cursor-pointer"
       >
        <InformationCircleIcon className="size-5 fill transition-transform duration-300" />
        <span>{t.credits}</span>
       </button>
      </div>
     </div>
    </div>
   )}

   {/* Modal de Créditos */}
   <div
    className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-all duration-300 ease-out ${
     showCredits
      ? "opacity-100 visible"
      : "opacity-0 invisible pointer-events-none"
    }`}
    onClick={closeCreditsModal}
   >
    <div
     className={`bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md mx-4 shadow-xl w-full max-h-[80vh] overflow-y-auto transform transition-all duration-300 ease-out ${
      showCredits ? "scale-100 opacity-100" : "scale-95 opacity-0"
     }`}
     onClick={(e) => e.stopPropagation()}
    >
     <div className="text-center mb-6">
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
       {t.credits}
      </h3>
      <div className="mb-6 text-left">
       <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
        {t.libs}
       </h4>
       <ul className="mt-5 space-y-2 text-lg text-slate-600 dark:text-slate-100">
        <li className="flex">
         <p className="mr-3 text-sky-500">Tauri</p>
         <a
          href="https://github.com/tauri-apps/tauri"
          onClick={(e) =>
           handleLinkClick(e, "https://github.com/tauri-apps/tauri")
          }
          className="mt-1 cursor-pointer"
         >
          <img className="h-6 w-6 dark:invert" src={githubLogo} alt="GitHub" />
         </a>
         <a
          href="https://tauri.app"
          onClick={(e) => handleLinkClick(e, "https://tauri.app")}
          className="mt-1 cursor-pointer"
         >
          <img className="ml-2 h-6 w-6" src={tauriLogo} alt="Tauri" />
         </a>
        </li>
        <li className="flex">
         <p className="mr-3 text-sky-500">Pyannote</p>
         <a
          href="https://github.com/pyannote/pyannote-audio"
          onClick={(e) =>
           handleLinkClick(e, "https://github.com/pyannote/pyannote-audio")
          }
          className="mt-1 cursor-pointer"
         >
          <img className="h-6 w-6 dark:invert" src={githubLogo} alt="GitHub" />
         </a>
         <a
          href="https://huggingface.co/pyannote"
          onClick={(e) => handleLinkClick(e, "https://huggingface.co/pyannote")}
          className="mt-1 cursor-pointer"
         >
          <img className="ml-2 h-7 w-7" src={hfLogo} alt="Hugging Face" />
         </a>
        </li>
        <li className="flex">
         <p className="mr-3 text-sky-500">Whisper-Openai</p>
         <a
          href="https://github.com/openai/whisper"
          onClick={(e) =>
           handleLinkClick(e, "https://github.com/openai/whisper")
          }
          className="mt-1 cursor-pointer"
         >
          <img className="h-6 w-6 dark:invert" src={githubLogo} alt="GitHub" />
         </a>
        </li>
        <li className="flex">
         <p className="mr-3 text-sky-500">WhisperX</p>
         <a
          href="https://github.com/m-bain/whisperX"
          onClick={(e) =>
           handleLinkClick(e, "https://github.com/m-bain/whisperX")
          }
          className="mt-1 cursor-pointer"
         >
          <img className="h-6 w-6 dark:invert" src={githubLogo} alt="GitHub" />
         </a>
        </li>
        <li className="flex">
         <p className="mr-3 text-sky-500">FFmpeg</p>
         <a
          href="https://github.com/FFmpeg/FFmpeg"
          onClick={(e) =>
           handleLinkClick(e, "https://github.com/FFmpeg/FFmpeg")
          }
          className="mt-1 cursor-pointer"
         >
          <img className="h-6 w-6 dark:invert" src={githubLogo} alt="GitHub" />
         </a>
         <a
          href="https://ffmpeg.org"
          onClick={(e) => handleLinkClick(e, "https://ffmpeg.org")}
          className="mt-1 cursor-pointer"
         >
          <img className="ml-2 h-7 w-7" src={ffmpegLogo} alt="FFmpeg" />
         </a>
        </li>
       </ul>
       <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 mt-4">
        {t.libsAll}
       </p>
      </div>

      <div className="pt-4 pb-4 border-t border-b border-slate-200 dark:border-slate-700">
       <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
        {t.author}
       </p>
       <div className="flex mt-5 justify-center">
        <p className="font-medium text-slate-800 dark:text-slate-200 mr-3">
         Heitor Reyes Sanches
        </p>
        <a
         href="https://github.com/RogerKoala"
         onClick={(e) => handleLinkClick(e, "https://github.com/RogerKoala")}
         className="cursor-pointer"
        >
         <img className="h-6 w-6 dark:invert" src={githubLogo} alt="GitHub" />
        </a>
        <a
         href="https://huggingface.co/RogerKoala"
         onClick={(e) =>
          handleLinkClick(e, "https://huggingface.co/RogerKoala")
         }
         className="cursor-pointer"
        >
         <img className="ml-2 h-7 w-7" src={hfLogo} alt="Hugging Face" />
        </a>
        <a
         href="https://www.kaggle.com/rogerkoala"
         onClick={(e) =>
          handleLinkClick(e, "https://www.kaggle.com/rogerkoala")
         }
         className="cursor-pointer"
        >
         <img className="ml-2 h-6 w-6" src={kaggleLogo} alt="Kaggle" />
        </a>
        <a
         href="https://www.linkedin.com/in/heitorrs"
         onClick={(e) =>
          handleLinkClick(e, "https://www.linkedin.com/in/heitorrs")
         }
         className="cursor-pointer"
        >
         <img className="ml-2 h-7 w-7" src={linkedinLogo} alt="LinkedIn" />
        </a>
       </div>
      </div>
     </div>

     <div className="text-center">
      <button
       onClick={closeCreditsModal}
       className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm cursor-pointer"
      >
       {t.close}
      </button>
     </div>
     <div className="text-center">
      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 mt-4">
       v{APP_VERSION}
      </p>
     </div>
    </div>
   </div>
  </div>
 );
};

export default Settings;
