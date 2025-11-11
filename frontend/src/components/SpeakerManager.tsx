import React from "react";
import { Translations } from "../i18n";
import {
 TrashIcon,
 ArrowUturnLeftIcon,
 PlusIcon,
} from "@heroicons/react/24/outline";

interface SpeakerManagerProps {
 speakerMap: { [key: string]: string };
 deletedSpeakers: Set<string>;
 onNameChange: (originalSpeaker: string, newName: string) => void;
 onSpeakerDelete: (speaker: string) => void;
 onSpeakerRestore: (speaker: string) => void;
 onAddSpeaker: () => void;
 t: Translations;
}

const SpeakerManager: React.FC<SpeakerManagerProps> = ({
 speakerMap,
 deletedSpeakers,
 onNameChange,
 onSpeakerDelete,
 onSpeakerRestore,
 onAddSpeaker,
 t,
}) => {
 const getSpeakerLabel = (speakerId: string) => {
  const match = speakerId.match(/(\d+)$/);
  if (match) {
   const speakerNum = parseInt(match[1], 10);
   return `${t.person} ${String(speakerNum + 1).padStart(2, "0")}`;
  }
  return speakerId;
 };

 return (
  <div>
   <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 border-b dark:border-slate-600 pb-2">
    {t.manageSpeakers}
   </h3>

   <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
    {Object.keys(speakerMap)
     .sort()
     .map((originalSpeaker) => {
      const isDeleted = deletedSpeakers.has(originalSpeaker);

      return (
       <div key={originalSpeaker} className="flex flex-col">
        <div className="flex items-center justify-between mb-1">
         <label
          htmlFor={`speaker-${originalSpeaker}`}
          className="text-sm font-medium text-slate-600 dark:text-slate-300"
         >
          {getSpeakerLabel(originalSpeaker)}
         </label>

         <div className="flex items-center gap-2">
          {isDeleted ? (
           <button
            onClick={() => onSpeakerRestore(originalSpeaker)}
            className="group relative flex items-center justify-center h-6 w-6 rounded-full dark: border-emerald-100 text-black dark:text-white shadow-md transition-all duration-200 hover:scale-105 cursor-pointer"
           >
            <ArrowUturnLeftIcon className="h-5 w-5" />
           </button>
          ) : (
           <button
            onClick={() => onSpeakerDelete(originalSpeaker)}
            className="group relative flex items-center justify-center h-6 w-6 rounded-full text-black dark:text-white shadow-md transition-all duration-200 hover:scale-105 cursor-pointer"
           >
            <TrashIcon className="h-5 w-5" />
           </button>
          )}
         </div>
        </div>

        {!isDeleted ? (
         <input
          id={`speaker-${originalSpeaker}`}
          type="text"
          value={speakerMap[originalSpeaker]}
          onChange={(e) => onNameChange(originalSpeaker, e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          placeholder={t.speakerInputPlaceholder}
         />
        ) : (
         <div className="px-3 py-2 border-2 border-red-400 dark:border-red-500 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-semibold text-center">
          {t.speakerDeletedLabel}
         </div>
        )}
       </div>
      );
     })}

    <div className="flex flex-col justify-center items-center">
     <button
      onClick={onAddSpeaker}
      className="flex items-center justify-center h-12 w-12 rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-md transition-all duration-200 hover:scale-105 cursor-pointer"
      title={t.addNewSpeaker}
     >
      <PlusIcon className="h-6 w-6" />
     </button>
     <span className="text-xs text-slate-600 dark:text-slate-400 mt-2">
      {t.addNewSpeaker}
     </span>
    </div>
   </div>
  </div>
 );
};

export default SpeakerManager;
