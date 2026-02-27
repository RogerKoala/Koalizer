import React, { useRef, useState } from "react";
import { Translations } from "../i18n";
import {
 ArrowUpTrayIcon,
 DocumentArrowDownIcon,
} from "@heroicons/react/24/solid";
import { SavedAppState } from "../types";
import JSZip from "jszip";

interface FileUploadProps {
 selectedFile: File | null;
 onFileSelect: (file: File | null) => void;
 onProcess: (input: File | string) => void;
 disabled: boolean;
 t: Translations;
 youtubeUrl: string;
 onYoutubeUrlChange: (url: string) => void;
 onImportZIP?: (
  state: SavedAppState,
  segmentAudioUrls: Record<number, string>
 ) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
 selectedFile,
 onFileSelect,
 onProcess,
 disabled,
 t,
 youtubeUrl,
 onYoutubeUrlChange,
 onImportZIP,
}) => {
 const fileInputRef = useRef<HTMLInputElement>(null);
 const projectFileInputRef = useRef<HTMLInputElement>(null);
 const [inputMode, setInputMode] = useState<"file" | "youtube" | "project">(
  "file"
 );
 const [isDragging, setIsDragging] = useState(false);
 const [selectedProjectFile, setSelectedProjectFile] = useState<File | null>(
  null
 );
 const [projectData, setProjectData] = useState<{
  state: SavedAppState;
  segmentUrls: Record<number, string>;
 } | null>(null);
 const [fileError, setFileError] = useState<string>("");
 const [projectFileError, setProjectFileError] = useState<string>("");

 const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0] || null;
  if (file) {
   const validExtensions = [
    ".mp3",
    ".wav",
    ".m4a",
    ".flac",
    ".ogg",
    ".opus",
    ".amr",
    ".mp4",
    ".mov",
    ".mkv",
    ".avi",
   ];
   const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

   if (!validExtensions.includes(fileExtension)) {
    setFileError(t.invalidFileType);
    onFileSelect(null);
    return;
   }
   setFileError("");
  }
  onFileSelect(file);
 };

 const handleButtonClick = () => {
  fileInputRef.current?.click();
 };

 const handleProjectButtonClick = () => {
  projectFileInputRef.current?.click();
 };

 const handleYoutubeUrlChange = (
  event: React.ChangeEvent<HTMLInputElement>
 ) => {
  onYoutubeUrlChange(event.target.value);
 };

 const handleModeChange = (mode: "file" | "youtube" | "project") => {
  setInputMode(mode);
  setFileError("");
  setProjectFileError("");
  if (mode === "file") {
   onYoutubeUrlChange("");
   setSelectedProjectFile(null);
   setProjectData(null);
  } else if (mode === "youtube") {
   onFileSelect(null);
   setSelectedProjectFile(null);
   setProjectData(null);
  } else {
   onFileSelect(null);
   onYoutubeUrlChange("");
  }
 };

 const isYoutubeUrlValid = (url: string) => {
  const youtubeRegex =
   /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/;
  return youtubeRegex.test(url);
 };

 const canProcess =
  inputMode === "file"
   ? !!selectedFile
   : inputMode === "youtube"
   ? !!youtubeUrl && isYoutubeUrlValid(youtubeUrl)
   : inputMode === "project"
   ? !!selectedProjectFile && !!projectData
   : false;

 const handleProcessClick = () => {
  if (!canProcess || disabled) return;
  if (inputMode === "file" && selectedFile) {
   onProcess(selectedFile);
  } else if (inputMode === "youtube") {
   onProcess(youtubeUrl.trim());
  } else if (inputMode === "project" && projectData && onImportZIP) {
   onImportZIP(projectData.state, projectData.segmentUrls);
  }
 };

 const parseProjectFile = async (file: File): Promise<void> => {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext !== "koala") {
   setProjectFileError(t.invalidProjectFileType);
   setSelectedProjectFile(null);
   setProjectData(null);
   return;
  }

  try {
   const arrayBuffer = await file.arrayBuffer();
   const zip = await JSZip.loadAsync(arrayBuffer);

   const jsonFile = zip.file("project.json");
   if (!jsonFile) {
    setProjectFileError(t.invalidProjectFormat);
    setSelectedProjectFile(null);
    setProjectData(null);
    return;
   }

   const jsonText = await jsonFile.async("text");
   const parsedState = JSON.parse(jsonText) as SavedAppState;

   if (
    !parsedState.version ||
    !parsedState.transcriptionData ||
    !parsedState.speakerNameMap ||
    !parsedState.speakerColorMap
   ) {
    setProjectFileError(t.invalidProjectFormat);
    setSelectedProjectFile(null);
    setProjectData(null);
    return;
   }

   const segmentUrls: Record<number, string> = {};
   const segments = parsedState.transcriptionData.aligned_transcription;

   for (let idx = 0; idx < segments.length; idx++) {
    const seg = segments[idx];
    if (seg.audioSegmentFile) {
     const segFile = zip.file(seg.audioSegmentFile);
     if (segFile) {
      const blob = await segFile.async("blob");
      segmentUrls[idx] = URL.createObjectURL(
       new Blob([blob], { type: "audio/wav" })
      );
     }
    }
   }

   setSelectedProjectFile(file);
   setProjectData({ state: parsedState, segmentUrls });
   setProjectFileError("");
  } catch (err: any) {
   console.error("Failed to import .koala:", err);
   setProjectFileError(t.importProjectError);
   setSelectedProjectFile(null);
   setProjectData(null);
  }
 };

 const handleProjectFileChange = async (
  event: React.ChangeEvent<HTMLInputElement>
 ) => {
  const file = event.target.files?.[0] || null;
  if (!file) {
   setSelectedProjectFile(null);
   setProjectData(null);
   return;
  }
  await parseProjectFile(file);
 };

 const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
  event.preventDefault();
  if (!disabled) setIsDragging(true);
 };

 const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
  event.preventDefault();
  if (!disabled) setIsDragging(true);
 };

 const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
  event.preventDefault();
  setIsDragging(false);
 };

 const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
  event.preventDefault();
  setIsDragging(false);
  if (disabled) return;

  const files = event.dataTransfer.files;
  if (files && files.length > 0) {
   const file = files[0];
   const validExtensions = [
    ".mp3",
    ".wav",
    ".m4a",
    ".flac",
    ".ogg",
    ".opus",
    ".amr",
    ".mp4",
    ".mov",
    ".mkv",
    ".avi",
   ];
   const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

   if (!validExtensions.includes(fileExtension)) {
    setFileError(t.invalidFileType);
    onFileSelect(null);
    return;
   }

   setFileError("");
   onFileSelect(file);
   if (fileInputRef.current) {

   }
  }
 };

 const handleProjectDrop = async (event: React.DragEvent<HTMLDivElement>) => {
  event.preventDefault();
  setIsDragging(false);
  if (disabled) return;

  const files = event.dataTransfer.files;
  if (files && files.length > 0) {
   const file = files[0];
   await parseProjectFile(file);
  }
 };

 return (
  <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-200 dark:border-slate-700 w-full max-w-4xl mx-auto backdrop-blur-sm backdrop-filter">
   <div className="w-full flex items-center justify-center mb-8 px-4 py-2 bg-slate-200/50 dark:bg-slate-900/50 rounded-full border border-slate-300 dark:border-slate-700">
    <div className="w-full max-w-sm flex bg-slate-200 dark:bg-slate-900 p-1 rounded-full relative">
     <div
      className="absolute top-1 bottom-1 w-1/3 bg-white dark:bg-slate-700 rounded-full shadow-sm transition-transform duration-300 ease-in-out"
      style={{
       transform: `translateX(${
        inputMode === "file"
         ? "0%"
         : inputMode === "youtube"
         ? "100%"
         : "200%"
       })`,
      }}
     />
     <button
      type="button"
      onClick={() => handleModeChange("file")}
      disabled={disabled}
      className={`flex-1 flex justify-center py-2.5 px-4 rounded-full text-sm font-semibold transition-colors duration-300 z-10 ${
       inputMode === "file"
        ? "text-sky-600 dark:text-sky-400"
        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
      }`}
     >
      {t.uploadFile}
     </button>
     <button
      type="button"
      onClick={() => handleModeChange("youtube")}
      disabled={disabled}
      className={`flex-1 flex justify-center py-2.5 px-4 rounded-full text-sm font-semibold transition-colors duration-300 z-10 ${
       inputMode === "youtube"
        ? "text-sky-600 dark:text-sky-400"
        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
      }`}
     >
      {t.youtubeLink}
     </button>
     {onImportZIP && (
      <button
       type="button"
       onClick={() => handleModeChange("project")}
       disabled={disabled}
       className={`flex-1 flex justify-center py-2.5 px-4 rounded-full text-sm font-semibold transition-colors duration-300 z-10 ${
        inputMode === "project"
         ? "text-sky-600 dark:text-sky-400"
         : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
       }`}
      >
       {t.importProject}
      </button>
     )}
    </div>
   </div>

   <div className="w-full">
    {inputMode === "file" ? (
     <>
      <div
       className={`w-full flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
        isDragging
         ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20"
         : fileError
         ? "border-red-500 bg-red-50 dark:bg-red-900/20"
         : "border-slate-300 dark:border-slate-600 hover:border-sky-500 hover:bg-slate-50 dark:hover:bg-slate-700/20"
       }`}
       onClick={handleButtonClick}
       onDragOver={handleDragOver}
       onDragEnter={handleDragEnter}
       onDragLeave={handleDragLeave}
       onDrop={handleDrop}
      >
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*,video/*,.mp3,.wav,.m4a,.flac,.ogg,.opus,.amr,.mp4,.mov,.mkv,.avi"
        className="hidden"
        disabled={disabled}
       />
       <ArrowUpTrayIcon className="size-10 mb-2 text-slate-400" />
       <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-200">
         {t.uploadClick}
        </span>{" "}
        {t.uploadDrag}
       </p>
       <p className="text-xs text-slate-500 dark:text-slate-400">
        {t.acceptedAudioFormats}
       </p>
      </div>
      {fileError && (
       <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 text-center">
        {fileError}
       </div>
      )}
      {selectedFile && !fileError && (
       <div className="mt-4 p-4 bg-white dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
         <ArrowUpTrayIcon className="size-5 mr-3 text-sky-500 flex-shrink-0" />
         <div className="flex flex-col min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
           {selectedFile.name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
           {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
          </p>
         </div>
        </div>
       </div>
      )}
     </>
    ) : inputMode === "youtube" ? (
     <>
      <div className="w-full flex-col align-center p-3 sm:px-10 mt-10 mb-7">
       <input
        type="text"
        value={youtubeUrl}
        onChange={handleYoutubeUrlChange}
        placeholder={t.youtubeUrlPlaceholder}
        disabled={disabled}
        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
       />
       {youtubeUrl && !isYoutubeUrlValid(youtubeUrl) && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
         {t.invalidYoutubeUrl}
        </p>
       )}
      </div>
     </>
    ) : (
     <>
      <div
       className={`w-full flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
        isDragging
         ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20"
         : projectFileError
         ? "border-red-500 bg-red-50 dark:bg-red-900/20"
         : "border-slate-300 dark:border-slate-600 hover:border-sky-500 hover:bg-slate-50 dark:hover:bg-slate-700/20"
       }`}
       onClick={handleProjectButtonClick}
       onDragOver={handleDragOver}
       onDragEnter={handleDragEnter}
       onDragLeave={handleDragLeave}
       onDrop={handleProjectDrop}
      >
       <input
        type="file"
        ref={projectFileInputRef}
        onChange={handleProjectFileChange}
        accept=".koala"
        className="hidden"
        disabled={disabled}
       />
       <DocumentArrowDownIcon className="size-30 mb-5 text-slate-400" />
       <p className="mb-2 text-sm text-slate-500">
        <span className="font-semibold text-slate-700 dark:text-slate-200">
         {t.loadProject}
        </span>{" "}
        {t.uploadDrag}
       </p>
       <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
        {t.importProjectDescription}
       </p>
       <p className="text-xs text-slate-500 font-bold dark:text-slate-400">
        {t.acceptedProjectFormats}
       </p>
      </div>

      {projectFileError && (
       <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
        <p className="text-red-700 dark:text-red-400 font-medium">
         {projectFileError}
        </p>
       </div>
      )}

      {selectedProjectFile && !projectFileError && (
       <div className="mt-4 p-4 bg-white dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
         <DocumentArrowDownIcon className="size-6 mr-3 text-emerald-500" />
         <div className="flex flex-col min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate dark:text-white">
           {selectedProjectFile.name}
          </p>
          {projectData && (
           <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {projectData.state.transcriptionData.aligned_transcription.length}{" "}
            {t.transcriptionSegments} •{" "}
            {Object.keys(projectData.segmentUrls).length}{" "}
            {t.audioSegmentsLoaded}
           </p>
          )}
         </div>
        </div>
       </div>
      )}
     </>
    )}
   </div>

   <button
    onClick={handleProcessClick}
    className={`mt-8 w-full py-3.5 px-4 rounded-xl text-white font-medium shadow-md transition-all duration-300 transform ${
     canProcess && !disabled
      ? "bg-slate-900 hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-lg focus:ring-4 focus:ring-slate-900/30 flex items-center justify-center dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
      : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-white/70 shadow-none"
    }`}
    disabled={!canProcess || disabled}
   >
    {inputMode === "youtube" ? t.processYoutube : t.processAudio}
   </button>
  </div>
 );
};

export default FileUpload;
