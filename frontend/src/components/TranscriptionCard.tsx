import React, { ChangeEvent, useRef, useEffect, useState } from "react";
import { TranscriptionSegment } from "../types";
import { Translations } from "../i18n";
import {
 ClockIcon,
 TrashIcon,
 PencilIcon,
 CheckIcon,
 XMarkIcon,
 PlayIcon,
 StopIcon,
} from "@heroicons/react/24/outline";

interface TranscriptionCardProps {
 segment: TranscriptionSegment;
 index: number;
 speakerDisplayName: string;
 color: { bg: string; bgUser: string; text: string; border: string };
 onSegmentChange: (
  index: number,
  updatedSegment: Partial<TranscriptionSegment>,
 ) => void;
 onDelete: (index: number) => void;
 onUndo: (index: number) => void;
 onPermanentDelete?: (index: number) => void;
 t: Translations;
 audioUrl?: string;
 isPreCut?: boolean;
}

const formatTime = (seconds: number): string => {
 const totalSeconds = Math.floor(seconds);
 const hours = Math.floor(totalSeconds / 3600);
 const minutes = Math.floor((totalSeconds % 3600) / 60);
 const remainingSeconds = totalSeconds % 60;

 const paddedHours = hours.toString().padStart(2, "0");
 const paddedMinutes = minutes.toString().padStart(2, "0");
 const paddedSeconds = remainingSeconds.toString().padStart(2, "0");

 return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
};

const parseTimeToSeconds = (timeString: string): number => {
 const parts = timeString.split(":").map((p) => parseInt(p, 10));
 if (parts.length === 3) {
  const [hours, minutes, seconds] = parts;
  return hours * 3600 + minutes * 60 + seconds;
 }
 return 0;
};

const TranscriptionCard: React.FC<TranscriptionCardProps> = ({
 segment,
 index,
 speakerDisplayName,
 color,
 onSegmentChange,
 onDelete,
 onUndo,
 onPermanentDelete,
 t,
 audioUrl,
 isPreCut = false,
}) => {
 const textRef = useRef<HTMLTextAreaElement>(null);
 const audioRef = useRef<HTMLAudioElement | null>(null);
 const checkIntervalRef = useRef<number | null>(null);
 const [isEditingTime, setIsEditingTime] = useState(false);
 const [startTimeInput, setStartTimeInput] = useState(
  formatTime(segment.start),
 );
 const [endTimeInput, setEndTimeInput] = useState(formatTime(segment.end));
 const [isPlaying, setIsPlaying] = useState(false);
 const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
 const [currentTime, setCurrentTime] = useState(0);
 const [duration, setDuration] = useState(0);
 const progressIntervalRef = useRef<number | null>(null);
 const wasUserPausedRef = useRef(false);

 const segDuration = isPreCut ? duration : segment.end - segment.start;

 const getRelativeTime = () => {
  if (!audioRef.current) return 0;
  return isPreCut
   ? audioRef.current.currentTime
   : Math.max(0, audioRef.current.currentTime - segment.start);
 };

 const startProgressTracking = () => {
  if (progressIntervalRef.current !== null) return;
  progressIntervalRef.current = window.setInterval(() => {
   setCurrentTime(getRelativeTime());
  }, 100);
 };

 const stopProgressTracking = () => {
  if (progressIntervalRef.current !== null) {
   clearInterval(progressIntervalRef.current);
   progressIntervalRef.current = null;
  }
 };

 const stopPlayback = () => {
  if (checkIntervalRef.current !== null) {
   clearInterval(checkIntervalRef.current);
   checkIntervalRef.current = null;
  }
  stopProgressTracking();
  if (audioRef.current) {
   audioRef.current.pause();
  }
  setIsPlaying(false);
 };

 const handlePlayClick = () => {
  if (!audioUrl) return;

  if (!audioRef.current) {
   audioRef.current = new Audio(audioUrl);
  } else if (audioRef.current.src !== audioUrl) {
   audioRef.current.src = audioUrl;
  }

  const audio = audioRef.current;
  setIsPlayerExpanded(true);

  if (isPlaying) {
   stopProgressTracking();
   audio.pause();
   setIsPlaying(false);
   wasUserPausedRef.current = true;
   return;
  }

  if (isPreCut) {
   if (!wasUserPausedRef.current) audio.currentTime = 0;
   wasUserPausedRef.current = false;
   audio.onended = () => {
    setIsPlaying(false);
    stopProgressTracking();
    setCurrentTime(0);
    wasUserPausedRef.current = false;
   };
   audio
    .play()
    .then(() => {
     setIsPlaying(true);
     setDuration(audio.duration || 0);
     startProgressTracking();
    })
    .catch(() => setIsPlaying(false));
  } else {
   if (!wasUserPausedRef.current) audio.currentTime = segment.start;
   wasUserPausedRef.current = false;
   audio.onended = () => {
    stopPlayback();
    setCurrentTime(0);
    wasUserPausedRef.current = false;
   };
   audio
    .play()
    .then(() => {
     setIsPlaying(true);
     startProgressTracking();
     checkIntervalRef.current = window.setInterval(() => {
      if (audio.currentTime >= segment.end) {
       stopPlayback();
       setCurrentTime(0);
       wasUserPausedRef.current = false;
      }
     }, 100);
    })
    .catch(() => setIsPlaying(false));
  }
 };

 useEffect(() => {
  return () => {
   stopPlayback();
   stopProgressTracking();
   if (audioRef.current) {
    audioRef.current.src = "";
    audioRef.current = null;
   }
  };
 }, []);

 useEffect(() => {
  if (isPlaying) {
   stopPlayback();
  }
  setIsPlayerExpanded(false);
  setCurrentTime(0);
  if (audioRef.current) {
   audioRef.current.src = audioUrl ?? "";
  }
 }, [audioUrl]);

 const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = parseFloat(e.target.value);
  if (!audioRef.current) return;
  const target = isPreCut ? value : segment.start + value;
  audioRef.current.currentTime = target;
  setCurrentTime(value);
 };

 const handleSkip = (seconds: number) => {
  if (!audioRef.current) return;
  const newRel = Math.max(
   0,
   Math.min(segDuration, getRelativeTime() + seconds),
  );
  audioRef.current.currentTime = isPreCut ? newRel : segment.start + newRel;
  setCurrentTime(newRel);
 };

 const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
  const newText = e.target.value;
  onSegmentChange(index, { text: newText });
 };

 const handleDeleteClick = () => {
  stopPlayback();
  if (segment.text.trim() === "" && onPermanentDelete) {
   onPermanentDelete(index);
  } else {
   onDelete(index);
  }
 };

 const handleUndoClick = () => onUndo(index);
 const handleSpeakerChange = (e: ChangeEvent<HTMLInputElement>) =>
  onSegmentChange(index, { speaker: e.target.value });

 useEffect(() => {
  if (textRef.current) {
   textRef.current.style.height = "inherit";
   textRef.current.style.height = `${textRef.current.scrollHeight}px`;
  }
 }, [segment.text]);

 useEffect(() => {
  setStartTimeInput(formatTime(segment.start));
  setEndTimeInput(formatTime(segment.end));
 }, [segment.start, segment.end]);

 const handleEditTimeClick = () => {
  setIsEditingTime(true);
  setStartTimeInput(formatTime(segment.start));
  setEndTimeInput(formatTime(segment.end));
 };

 const handleSaveTime = () => {
  const newStart = parseTimeToSeconds(startTimeInput);
  const newEnd = parseTimeToSeconds(endTimeInput);

  if (newEnd <= newStart) {
   alert(t.invalidTimeRange);
   return;
  }

  onSegmentChange(index, { start: newStart, end: newEnd });
  setIsEditingTime(false);
 };

 const handleCancelTimeEdit = () => {
  setIsEditingTime(false);
  setStartTimeInput(formatTime(segment.start));
  setEndTimeInput(formatTime(segment.end));
 };

 if (segment.isDeleted) {
  return (
   <div
    className="relative p-6 rounded-lg shadow-sm transition-shadow hover:shadow-md border-2 border-dashed border-slate-300 dark:border-slate-600 flex justify-between items-center"
    style={{ backgroundColor: color?.bg || "#f0f0f0" }}
   >
    <p className="text-slate-600 dark:text-slate-400 italic">
     {t.segmentDeletedMessage}
    </p>
    <button
     onClick={handleUndoClick}
     className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded transition-colors cursor-pointer"
    >
     {t.undoButtonLabel}
    </button>
   </div>
  );
 }

 return (
  <div
   className="relative border-l-4 p-6 rounded-lg shadow-sm transition-shadow hover:shadow-md"
   style={{
    backgroundColor: color?.bg || "#f0f0f0ff",
    borderLeftColor: color?.border || "#ccc",
   }}
  >
   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-y-3 gap-x-4 mb-4">
    <div className="flex items-center w-full sm:w-auto px-3 py-1 rounded-full border dark:border-slate-600 has-[:focus]:ring-2 has-[:focus]:ring-sky-400 transition-shadow">
     <svg
      width="40px"
      height="40px"
      viewBox="0 0 24 24"
      fill={color?.bgUser || "#ccc"}
      xmlns="http://www.w3.org/2000/svg"
      className="mr-2"
     >
      <path
       d="M12.12 12.78C12.05 12.77 11.96 12.77 11.88 12.78C10.12 12.72 8.71997 11.28 8.71997 9.50998C8.71997 7.69998 10.18 6.22998 12 6.22998C13.81 6.22998 15.28 7.69998 15.28 9.50998C15.27 11.28 13.88 12.72 12.12 12.78Z"
       stroke="#292D32"
       strokeWidth="1.5"
       strokeLinecap="round"
       strokeLinejoin="round"
      />
      <path
       d="M18.74 19.3801C16.96 21.0101 14.6 22.0001 12 22.0001C9.40001 22.0001 7.04001 21.0101 5.26001 19.3801C5.36001 18.4401 5.96001 17.5201 7.03001 16.8001C9.77001 14.9801 14.25 14.9801 16.97 16.8001C18.04 17.5201 18.64 18.4401 18.74 19.3801Z"
       stroke="#292D32"
       strokeWidth="1.5"
       strokeLinecap="round"
       strokeLinejoin="round"
      />
      <path
       d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
       stroke="#292D32"
       strokeWidth="1"
       strokeLinecap="round"
       strokeLinejoin="round"
      />
     </svg>
     <input
      type="text"
      value={speakerDisplayName ?? ""}
      onChange={handleSpeakerChange}
      className="bg-transparent font-bold text-sm focus:outline-none w-full text-slate-700"
      aria-label={t.speakerNameLabel}
     />
    </div>
    <div className="flex items-center gap-x-2">
     {isEditingTime ? (
      <div className="flex items-center gap-2">
       <input
        type="text"
        value={startTimeInput}
        onChange={(e) => setStartTimeInput(e.target.value)}
        placeholder="HH:MM:SS"
        className="w-24 px-2 py-1 text-xs font-mono font-bold border border-slate-300 dark:border-slate-500 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
       />
       <span className="text-slate-600 dark:text-slate-400">&rarr;</span>
       <input
        type="text"
        value={endTimeInput}
        onChange={(e) => setEndTimeInput(e.target.value)}
        placeholder="HH:MM:SS"
        className="w-24 px-2 py-1 text-xs font-mono font-bold border border-slate-300 dark:border-slate-500 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
       />
       <button
        onClick={handleSaveTime}
        className="p-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition-colors cursor-pointer"
        title={t.save}
       >
        <CheckIcon className="size-4" />
       </button>
       <button
        onClick={handleCancelTimeEdit}
        className="p-1 rounded-full bg-slate-400 hover:bg-slate-500 text-white transition-colors cursor-pointer"
        title={t.close}
       >
        <XMarkIcon className="size-4" />
       </button>
      </div>
     ) : (
      <div className="flex items-center gap-2">
       <div className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center shrink-0">
        <ClockIcon className="size-4 stroke-black" />
        <span className="font-mono ml-1 font-bold text-slate-800">
         {formatTime(segment.start)} &rarr; {formatTime(segment.end)}
        </span>
       </div>
       <button
        onClick={handleEditTimeClick}
        className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-300 transition-colors cursor-pointer"
        title={t.editTime}
       >
        <PencilIcon className="size-4 stroke-black" />
       </button>
      </div>
     )}

     {audioUrl && (
      <>
       <button
        onClick={handlePlayClick}
        aria-label={isPlaying ? t.stopSegmentAudio : t.playSegmentAudio}
        title={isPlaying ? t.stopSegmentAudio : t.playSegmentAudio}
        className={`p-1 rounded-full transition-colors cursor-pointer ${
         isPlaying
          ? "bg-emerald-500 hover:bg-emerald-600 text-white"
          : "hover:bg-slate-200 dark:hover:bg-slate-300 text-slate-700"
        }`}
       >
        {isPlaying ? (
         <StopIcon className="size-4" />
        ) : (
         <PlayIcon className="size-4 stroke-black" />
        )}
       </button>
       <button
        onClick={() => setIsPlayerExpanded((v) => !v)}
        className={`p-1 rounded-full transition-colors cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-300 text-slate-700 ${
         isPlayerExpanded ? "bg-slate-200 dark:bg-slate-300" : ""
        }`}
        title={isPlayerExpanded ? "Ocultar controles" : "Mostrar controles"}
       >
        <svg
         xmlns="http://www.w3.org/2000/svg"
         className="size-4 stroke-black"
         fill="none"
         viewBox="0 0 24 24"
         strokeWidth={1.5}
         stroke="currentColor"
        >
         <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
         />
        </svg>
       </button>
      </>
     )}

     <button
      onClick={handleDeleteClick}
      aria-label={t.deleteSegmentLabel}
      className="text-slate-400 focus:outline-none transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-300 cursor-pointer"
     >
      <TrashIcon className="size-4 stroke-black" />
     </button>
    </div>
   </div>

   {audioUrl && isPlayerExpanded && (
    <div className="mb-3 rounded-lg bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-slate-600 overflow-hidden">
     <div className="flex items-center gap-2 px-2 py-1.5">
      <button
       onClick={() => handleSkip(-5)}
       title="-5s"
       className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer flex-shrink-0"
      >
       <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-4 stroke-black"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
       >
        <path
         strokeLinecap="round"
         strokeLinejoin="round"
         d="M21 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 0 1 0-1.954l7.108-4.061A1.125 1.125 0 0 1 21 8.689v8.122ZM11.25 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 0 1 0-1.954l7.108-4.061a1.125 1.125 0 0 1 1.683.977v8.122Z"
        />
       </svg>
      </button>
      <span className="text-xs font-mono text-slate-700 w-10 text-right flex-shrink-0">
       {Math.floor(currentTime / 60)}:
       {String(Math.floor(currentTime % 60)).padStart(2, "0")}
      </span>
      <input
       type="range"
       min={0}
       max={segDuration || 1}
       step={0.1}
       value={currentTime}
       onChange={handleSeek}
       className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-emerald-500"
       style={{
        background: `linear-gradient(to right, #10b981 ${segDuration > 0 ? (currentTime / segDuration) * 100 : 0}%, #cbd5e1 ${segDuration > 0 ? (currentTime / segDuration) * 100 : 0}%)`,
       }}
      />
      <span className="text-xs font-mono text-slate-700 w-10 flex-shrink-0">
       {Math.floor(segDuration / 60)}:
       {String(Math.floor(segDuration % 60)).padStart(2, "0")}
      </span>
      <button
       onClick={() => handleSkip(5)}
       title="+5s"
       className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer flex-shrink-0"
      >
       <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-4 stroke-black"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
       >
        <path
         strokeLinecap="round"
         strokeLinejoin="round"
         d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z"
        />
       </svg>
      </button>
     </div>
    </div>
   )}

   <textarea
    ref={textRef}
    value={segment.text}
    onChange={handleTextChange}
    className="w-full bg-white/40 text-slate-800 leading-relaxed text-base p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none overflow-hidden transition-colors"
    aria-label={t.transcriptionTextLabel}
    rows={1}
   />
  </div>
 );
};

export default TranscriptionCard;
