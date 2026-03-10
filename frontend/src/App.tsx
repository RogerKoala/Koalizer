import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { TranscriptionResponse, SavedAppState } from "./types";
import {
 processUploadWithStatus,
 fetchAudioFromServer,
 ProcessingStatus,
} from "./services/transcriptionService";
import FileUpload from "./components/FileUpload";
import ResultsDisplay from "./components/ResultsDisplay";
import Loader from "./components/Loader";
import Settings from "./components/Settings";
import { getTranslator, Language } from "./i18n";
import { useTheme } from "./hooks/useTheme";
import ToastNotification from "./components/ToastNotification";
const ACCEPTED_AUDIO_EXTENSIONS = [
 ".mp3",
 ".wav",
 ".m4a",
 ".flac",
 ".ogg",
 ".opus",
 ".amr",
];
const ACCEPTED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".mkv", ".avi"];
const ACCEPTED_EXTENSIONS = [
 ...ACCEPTED_AUDIO_EXTENSIONS,
 ...ACCEPTED_VIDEO_EXTENSIONS,
];
const ACCEPTED_MIME_TYPES = [
 "audio/mpeg",
 "audio/mp3",
 "audio/wav",
 "audio/x-wav",
 "audio/wave",
 "audio/x-m4a",
 "audio/mp4",
 "audio/flac",
 "audio/ogg",
 "audio/opus",
 "audio/amr",
 "video/mp4",
 "video/quicktime",
 "video/x-matroska",
 "video/x-msvideo",
 "video/avi",
];
const App: React.FC = () => {
 const [selectedFile, setSelectedFile] = useState<File | null>(null);
 const [youtubeUrl, setYoutubeUrl] = useState<string>("");
 const [transcriptionData, setTranscriptionData] =
  useState<TranscriptionResponse | null>(null);
 const [isLoading, setIsLoading] = useState<boolean>(false);
 const [processingStatus, setProcessingStatus] =
  useState<ProcessingStatus | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [importedState, setImportedState] = useState<SavedAppState | null>(null);
 const [showImportSuccessToast, setShowImportSuccessToast] =
  useState<boolean>(false);
 const audioObjectUrlRef = useRef<string | null>(null);
 const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
 const [segmentAudioUrls, setSegmentAudioUrls] = useState<
  Record<number, string>
 >({});
 const [language, setLanguage] = useState<Language>(() => {
  if (typeof window !== "undefined") {
   const savedLang = localStorage.getItem("language");
   if (savedLang === "en" || savedLang === "pt") return savedLang;
  }
  return "en";
 });
 const { theme, setTheme } = useTheme();
 const t = useMemo(() => getTranslator(language), [language]);
 useEffect(() => {
  localStorage.setItem("language", language);
  document.documentElement.lang = language;
 }, [language]);

 useEffect(() => {
  if (audioObjectUrlRef.current) {
   URL.revokeObjectURL(audioObjectUrlRef.current);
   audioObjectUrlRef.current = null;
  }
  setAudioBuffer(null);
  if (selectedFile) {
   const objectUrl = URL.createObjectURL(selectedFile);
   audioObjectUrlRef.current = objectUrl;
   selectedFile.arrayBuffer().then((ab) => {
    const ctx = new AudioContext();
    return ctx.decodeAudioData(ab);
   }).then((buf) => {
    setAudioBuffer(buf);
   }).catch(() => {
    setAudioBuffer(null);
   });
  }
 }, [selectedFile]);
 const revokeSegmentUrls = (urls: Record<number, string>) => {
  Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
 };
 const isValidFile = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ACCEPTED_EXTENSIONS.some((ext) =>
   fileName.endsWith(ext),
  );
  const hasValidMimeType = ACCEPTED_MIME_TYPES.includes(file.type);
  return hasValidExtension || hasValidMimeType;
 };
 const handleFileSelect = (file: File | null) => {
  if (file) {
   if (isValidFile(file)) {
    setSelectedFile(file);
    setError(null);
   } else {
    setError(t.invalidFileType);
    setSelectedFile(null);
   }
  } else {
   setSelectedFile(null);
  }
 };
 const handleProcess = useCallback(
  async (input: File | string) => {
   if (!input) {
    setError(t.selectFileFirst);
    return;
   }
   setIsLoading(true);
   setProcessingStatus(null);
   setError(null);
   setTranscriptionData(null);
   try {
    const data = await processUploadWithStatus(input, (status) =>
     setProcessingStatus(status),
    );

    if (typeof input === "string") {
     try {
      setProcessingStatus({ status: "downloading", message: "Fetching generated audio..." });
      const audioBlob = await fetchAudioFromServer();
      const objectUrl = URL.createObjectURL(audioBlob);
      audioObjectUrlRef.current = objectUrl;

      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioCtx = new AudioContext();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      setAudioBuffer(decodedBuffer);
     } catch (audioErr) {
      console.error("Failed to fetch and decode audio from server", audioErr);
     }
    }

    setTranscriptionData(data);
   } catch (err) {
    console.error(err);
    setError(t.processingFailed);
   } finally {
    setIsLoading(false);
    setProcessingStatus(null);
   }
  },
  [t],
 );
 const handleClear = () => {
  setSelectedFile(null);
  setYoutubeUrl("");
  setTranscriptionData(null);
  setIsLoading(false);
  setProcessingStatus(null);
  setError(null);
  setImportedState(null);
  setAudioBuffer(null);
  if (audioObjectUrlRef.current) {
   URL.revokeObjectURL(audioObjectUrlRef.current);
   audioObjectUrlRef.current = null;
  }
  revokeSegmentUrls(segmentAudioUrls);
  setSegmentAudioUrls({});
 };
 const handleImportZIP = useCallback(
  (state: SavedAppState, newSegmentUrls: Record<number, string>) => {
   revokeSegmentUrls(segmentAudioUrls);
   setSegmentAudioUrls(newSegmentUrls);
   setImportedState(state);
   setTranscriptionData(state.transcriptionData);
   setShowImportSuccessToast(true);
   setTimeout(() => setShowImportSuccessToast(false), 3000);
  },
  []
 );
 return (
  <div
   className={`min-h-screen text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative transition-colors duration-300 ${
    theme === "light" ? "light-theme-bg" : "dark-theme-bg"
   }`}
  >
   <div className="fixed top-4 right-4 flex items-center space-x-2 z-10">
    <Settings
     language={language}
     setLanguage={setLanguage}
     theme={theme}
     setTheme={setTheme}
     t={t}
    />
   </div>
   <div className="w-full max-w-4xl mx-auto">
    <header className="text-center mb-8">
     <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight font-display">
      {t.appTitle}
     </h1>
     <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
      {t.appSubtitle}
     </p>
    </header>
    <main
     className={`rounded-2xl shadow-2xl shadow-slate-200 dark:shadow-black/20 p-6 sm:p-8 transition-colors duration-300 ${
      theme === "light" ? "light-theme-card" : "dark-theme-card"
     }`}
    >
     {error && (
      <div
       className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-600 text-red-700 dark:text-red-300 p-4 mb-6 rounded-r-lg"
       role="alert"
      >
       <p className="font-bold">{t.errorTitle}</p>
       <p>{error}</p>
      </div>
     )}
     {isLoading ? (
      <Loader t={t} status={processingStatus?.status} />
     ) : transcriptionData ? (
      <ResultsDisplay
       data={transcriptionData}
       onClear={handleClear}
       fileName={
        importedState?.fileName ||
        selectedFile?.name ||
        (youtubeUrl ? "youtube_video" : "audio.wav")
       }
       t={t}
       importedState={importedState}
       audioUrl={audioObjectUrlRef.current ?? undefined}
       audioBuffer={audioBuffer ?? undefined}
       segmentAudioUrls={segmentAudioUrls}
      />
     ) : (
      <FileUpload
       selectedFile={selectedFile}
       onFileSelect={handleFileSelect}
       onProcess={handleProcess}
       disabled={isLoading}
       t={t}
       youtubeUrl={youtubeUrl}
       onYoutubeUrlChange={setYoutubeUrl}
       onImportZIP={handleImportZIP}
      />
     )}
    </main>
   </div>
   <ToastNotification
    message={t.projectLoadedSuccess}
    show={showImportSuccessToast}
    onClose={() => setShowImportSuccessToast(false)}
    t={t}
   />
  </div>
 );
};
export default App;