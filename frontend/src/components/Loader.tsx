import React from "react";
import { Translations } from "../i18n";

interface LoaderWithStatusProps {
 t: Translations;
 status?:
  | "idle"
  | "queued"
  | "uploading"
  | "downloading"
  | "identifying_language"
  | "processing"
  | "transcribing"
  | "aligning"
  | "diarizing"
  | "ready"
  | "error";
}

const Loader: React.FC<LoaderWithStatusProps> = ({ t, status }) => {
 const getStatusText = () => {
  switch (status) {
   case "uploading":
    return t.uploadingFile;
   case "downloading":
    return t.downloadingVideo;
   case "identifying_language":
    return t.identifyingLanguage;
   case "transcribing":
    return t.transcribing;
   case "aligning":
    return t.aligning;
   case "diarizing":
    return t.diarizing;
   case "processing":
    return t.processing;
   default:
    return t.processing;
  }
 };

 const getStatusDescription = () => {
  switch (status) {
   case "uploading":
    return t.uploadingDescription;
   case "downloading":
    return t.downloadingDescription;
   case "identifying_language":
    return t.identifyingLanguageDescription;
   case "transcribing":
    return t.transcribingDescription;
   case "aligning":
    return t.aligningDescription;
   case "diarizing":
    return t.diarizingDescription;
   case "processing":
    return t.takeAMoment;
   default:
    return t.takeAMoment;
  }
 };

 return (
  <div className="flex flex-col items-center justify-center py-20">
   <div className="relative w-16 h-16 mb-4">
    <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-t-4 border-transparent border-t-sky-600 rounded-full animate-spin"></div>
   </div>

   <p className="mt-2 text-lg text-slate-600 dark:text-slate-300 font-medium text-center">
    {getStatusText()}
   </p>
   <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">
    {getStatusDescription()}
   </p>
  </div>
 );
};

export default Loader;
