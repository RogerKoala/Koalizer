import React, { useRef, useState } from "react";
import { Translations } from "../i18n";
import {
 ArrowUpTrayIcon,
 DocumentArrowDownIcon,
} from "@heroicons/react/24/solid";
import { SavedAppState } from "../types";

interface FileUploadProps {
 selectedFile: File | null;
 onFileSelect: (file: File | null) => void;
 onProcess: (input: File | string) => void;
 disabled: boolean;
 t: Translations;
 youtubeUrl: string;
 onYoutubeUrlChange: (url: string) => void;
 onImportJSON?: (state: SavedAppState) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
 selectedFile,
 onFileSelect,
 onProcess,
 disabled,
 t,
 youtubeUrl,
 onYoutubeUrlChange,
 onImportJSON,
}) => {
 const fileInputRef = useRef<HTMLInputElement>(null);
 const jsonFileInputRef = useRef<HTMLInputElement>(null);
 const [inputMode, setInputMode] = useState<"file" | "youtube" | "json">(
  "file"
 );
 const [isDragging, setIsDragging] = useState(false);
 const [selectedJsonFile, setSelectedJsonFile] = useState<File | null>(null);
 const [jsonData, setJsonData] = useState<SavedAppState | null>(null);
 const [fileError, setFileError] = useState<string>("");
 const [jsonError, setJsonError] = useState<string>("");

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

 const handleJsonButtonClick = () => {
  jsonFileInputRef.current?.click();
 };

 const handleYoutubeUrlChange = (
  event: React.ChangeEvent<HTMLInputElement>
 ) => {
  onYoutubeUrlChange(event.target.value);
 };

 const handleModeChange = (mode: "file" | "youtube" | "json") => {
  setInputMode(mode);
  setFileError("");
  setJsonError("");
  if (mode === "file") {
   onYoutubeUrlChange("");
   setSelectedJsonFile(null);
   setJsonData(null);
  } else if (mode === "youtube") {
   onFileSelect(null);
   setSelectedJsonFile(null);
   setJsonData(null);
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
   : inputMode === "json"
   ? !!selectedJsonFile && !!jsonData
   : false;

 const handleProcessClick = () => {
  if (!canProcess || disabled) return;
  if (inputMode === "file" && selectedFile) {
   onProcess(selectedFile);
  } else if (inputMode === "youtube") {
   onProcess(youtubeUrl.trim());
  } else if (inputMode === "json" && jsonData && onImportJSON) {
   onImportJSON(jsonData);
  }
 };

 const handleJsonFileChange = async (
  event: React.ChangeEvent<HTMLInputElement>
 ) => {
  const file = event.target.files?.[0] || null;

  if (!file) {
   setSelectedJsonFile(null);
   setJsonData(null);
   return;
  }

  if (!file.name.endsWith(".json")) {
   setJsonError(t.invalidJsonFileType);
   setSelectedJsonFile(null);
   setJsonData(null);
   return;
  }

  try {
   const jsonContent = await file.text();
   const parsedState = JSON.parse(jsonContent) as SavedAppState;

   if (
    !parsedState.version ||
    !parsedState.transcriptionData ||
    !parsedState.speakerNameMap ||
    !parsedState.speakerColorMap
   ) {
    setJsonError(t.invalidJsonFormat);
    setSelectedJsonFile(null);
    setJsonData(null);
    return;
   }

   setSelectedJsonFile(file);
   setJsonData(parsedState);
   setJsonError("");
  } catch (err: any) {
   console.error("Failed to import JSON:", err);
   setJsonError(t.importJsonError);
   setSelectedJsonFile(null);
   setJsonData(null);
  }
 };

 const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
  event.preventDefault();
  event.stopPropagation();
  if (!disabled) {
   setIsDragging(true);
  }
 };

 const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
  event.preventDefault();
  event.stopPropagation();
  if (!disabled) {
   setIsDragging(true);
  }
 };

 const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
  event.preventDefault();
  event.stopPropagation();
  if (!disabled) {
   setIsDragging(false);
  }
 };

 const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
  event.preventDefault();
  event.stopPropagation();
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

   if (validExtensions.includes(fileExtension)) {
    onFileSelect(file);
    setFileError("");
   } else {
    setFileError(t.invalidFileType);
    onFileSelect(null);
   }
  }
 };

 const handleJsonDrop = async (event: React.DragEvent<HTMLDivElement>) => {
  event.preventDefault();
  event.stopPropagation();
  setIsDragging(false);

  if (disabled || !onImportJSON) return;

  const files = event.dataTransfer.files;
  if (files && files.length > 0) {
   const file = files[0];
   if (file.name.endsWith(".json")) {
    try {
     const jsonContent = await file.text();
     const parsedState = JSON.parse(jsonContent) as SavedAppState;

     if (
      !parsedState.version ||
      !parsedState.transcriptionData ||
      !parsedState.speakerNameMap ||
      !parsedState.speakerColorMap
     ) {
      setJsonError(t.invalidJsonFormat);
      return;
     }

     setSelectedJsonFile(file);
     setJsonData(parsedState);
     setJsonError("");
    } catch (err: any) {
     console.error("Failed to import JSON:", err);
     setJsonError(t.importJsonError);
    }
   } else {
    setJsonError(t.invalidJsonFileType);
   }
  }
 };

 return (
  <div className="flex flex-col items-center justify-center space-y-6">
   <div className="w-full flex justify-center">
    <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-lg flex">
     <button
      type="button"
      onClick={() => handleModeChange("file")}
      className={`px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer ${
       inputMode === "file"
        ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm"
        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      }`}
     >
      {t.uploadFile}
     </button>
     <button
      type="button"
      onClick={() => handleModeChange("youtube")}
      className={`px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer ${
       inputMode === "youtube"
        ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm"
        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      }`}
     >
      {t.youtubeLink}
     </button>
     {onImportJSON && (
      <button
       type="button"
       onClick={() => handleModeChange("json")}
       className={`px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer ${
        inputMode === "json"
         ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm"
         : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
       }`}
      >
       {t.importJSON}
      </button>
     )}
    </div>
   </div>

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
       accept=".mp3,.wav,.m4a,.flac,.ogg,.opus,.amr,.mp4,.mov,.mkv,.avi"
       className="hidden"
       disabled={disabled}
      />
      <ArrowUpTrayIcon className="size-30 mb-5" />
      <p className="text-slate-600 dark:text-slate-500 font-medium">
       {t.uploadClick}
      </p>
      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
       {t.uploadDrag}
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
       {t.acceptedAudioFormats}
      </p>
     </div>

     {fileError && (
      <div className="w-full text-center bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 p-3 rounded-lg">
       <p className="text-red-700 dark:text-red-400 font-medium">{fileError}</p>
      </div>
     )}

     {selectedFile && !fileError && (
      <div className="w-full text-center bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
       <p className="text-slate-700 dark:text-slate-200 font-medium">
        {t.selectedFile}:{" "}
        <span className="text-sky-600 dark:text-sky-400">
         {selectedFile.name}
        </span>
       </p>
      </div>
     )}
    </>
   ) : inputMode === "youtube" ? (
    <>
     <div className="w-full">
      <label className="block text-slate-700 dark:text-slate-200 font-medium mb-2">
       {t.youtubeUrlLabel}
      </label>
      <input
       type="url"
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
        : jsonError
        ? "border-red-500 bg-red-50 dark:bg-red-900/20"
        : "border-slate-300 dark:border-slate-600 hover:border-sky-500 hover:bg-slate-50 dark:hover:bg-slate-700/20"
      }`}
      onClick={handleJsonButtonClick}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleJsonDrop}
     >
      <input
       type="file"
       ref={jsonFileInputRef}
       onChange={handleJsonFileChange}
       accept=".json"
       className="hidden"
       disabled={disabled}
      />
      <DocumentArrowDownIcon className="size-30 mb-5" />
      <p className="text-slate-600 dark:text-slate-500 font-medium">
       {t.importJsonDescription}
      </p>
      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
       {t.uploadDrag}
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
       {t.acceptedJsonFormats}
      </p>
     </div>

     {jsonError && (
      <div className="w-full text-center bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 p-3 rounded-lg">
       <p className="text-red-700 dark:text-red-400 font-medium">{jsonError}</p>
      </div>
     )}

     {selectedJsonFile && !jsonError && (
      <div className="w-full text-center bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
       <p className="text-slate-700 dark:text-slate-200 font-medium">
        {t.selectedFile}:{" "}
        <span className="text-sky-600 dark:text-sky-400">
         {selectedJsonFile.name}
        </span>
       </p>
      </div>
     )}
    </>
   )}

   {(inputMode === "file" ||
    inputMode === "youtube" ||
    inputMode === "json") && (
    <button
     onClick={handleProcessClick}
     disabled={!canProcess || disabled}
     className="w-full sm:w-auto px-8 py-3 bg-sky-600 text-white font-bold rounded-lg shadow-md hover:bg-sky-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all cursor-pointer"
    >
     {inputMode === "file"
      ? t.processAudio
      : inputMode === "youtube"
      ? t.processYoutube
      : t.loadProject}
    </button>
   )}
  </div>
 );
};

export default FileUpload;
