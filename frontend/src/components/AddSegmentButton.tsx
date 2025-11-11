import React, { useState, useEffect, useRef } from "react";
import { PlusCircleIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { Translations } from "../i18n";

interface AddSegmentButtonProps {
 onAddSegment: (selectedSpeaker: string) => void;
 availableSpeakers?: { id: string; name: string }[];
 t: Translations;
}

const AddSegmentButton: React.FC<AddSegmentButtonProps> = ({
 onAddSegment,
 availableSpeakers,
 t,
}) => {
 const [showSelect, setShowSelect] = useState(false);
 const wrapperRef = useRef<HTMLDivElement>(null);
 const buttonRef = useRef<HTMLButtonElement>(null);

 useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
   if (
    wrapperRef.current &&
    !wrapperRef.current.contains(event.target as Node)
   ) {
    setShowSelect(false);
   }
  }

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
   document.removeEventListener("mousedown", handleClickOutside);
  };
 }, [wrapperRef]);

 const handleClick = () => {
  if (availableSpeakers && availableSpeakers.length > 0) {
   setShowSelect(!showSelect);
  }
 };

 const hasAvailableSpeakers = availableSpeakers && availableSpeakers.length > 0;

 const handleSpeakerSelect = (speakerId: string) => {
  onAddSegment(speakerId);
  setShowSelect(false);
 };

 return (
  <div
   className="relative flex justify-center items-center my-2 z-50"
   ref={wrapperRef}
  >
   <button
    ref={buttonRef}
    onClick={handleClick}
    disabled={!hasAvailableSpeakers}
    className={`group w-auto px-4 py-2 font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center space-x-2 border cursor-pointer ${
     hasAvailableSpeakers
      ? "bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 hover:shadow-md hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-500 border-slate-300 dark:border-slate-600"
      : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-slate-300 dark:border-slate-600 cursor-not-allowed opacity-50"
    }`}
    title={hasAvailableSpeakers ? t.addSegment : t.noSpeakersAvailable}
   >
    <PlusCircleIcon
     className={`size-5 transition-transform duration-200 ${
      hasAvailableSpeakers ? "group-hover:rotate-90" : ""
     }`}
    />
    <span>{t.addSegment}</span>
    {hasAvailableSpeakers && (
     <ChevronDownIcon
      className={`size-4 transition-transform duration-200 ${
       showSelect ? "rotate-180" : ""
      }`}
     />
    )}
   </button>

   {showSelect && availableSpeakers && availableSpeakers.length > 0 && (
    <div className="absolute z-50 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fadeIn">
     <div className="p-3 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 border-b border-slate-200 dark:border-slate-600">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
       {t.selectSpeaker}
      </p>
     </div>

     <div className="max-h-64 overflow-y-auto custom-scrollbar">
      {availableSpeakers.map((speaker) => (
       <button
        key={speaker.id}
        onClick={() => handleSpeakerSelect(speaker.id)}
        className="w-full px-4 py-3 text-left hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors duration-150 flex items-center space-x-3 group cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-b-0"
       >
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 dark:from-sky-500 dark:to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
         {speaker.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
         <p className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
          {speaker.name}
         </p>
        </div>
        <PlusCircleIcon className="size-5 text-slate-400 group-hover:text-sky-500 dark:group-hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-all duration-200" />
       </button>
      ))}
     </div>
    </div>
   )}
  </div>
 );
};

export default AddSegmentButton;
