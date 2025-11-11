import React, { useState, useEffect, useMemo } from "react";
import {
 TranscriptionResponse,
 TranscriptionSegment,
 Durations,
 SavedAppState,
} from "../types";
import SummaryStats from "./SummaryStats";
import TranscriptionCard from "./TranscriptionCard";
import AddSegmentButton from "./AddSegmentButton";
import SpeakerManager from "./SpeakerManager";
import ToastNotification from "./ToastNotification";
import { jsPDF } from "jspdf";
import { Translations } from "../i18n";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import {
 MicrophoneIcon,
 Bars4Icon,
 UserGroupIcon,
} from "@heroicons/react/24/outline";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

interface ResultsDisplayProps {
 data: TranscriptionResponse;
 onClear: () => void;
 fileName: string;
 t: Translations;
 importedState?: SavedAppState | null;
}

interface FileSystemFileHandle {
 createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream {
 write(data: ArrayBuffer): Promise<void>;
 close(): Promise<void>;
}

declare global {
 interface Window {
  jspdf: any;
  showSaveFilePicker: (options?: {
   suggestedName?: string;
   types?: {
    description: string;
    accept: { [mimeType: string]: string[] };
   }[];
  }) => Promise<FileSystemFileHandle>;
 }
}

const countWords = (text: string): number => {
 if (!text) return 0;
 return text.trim().split(/\s+/).filter(Boolean).length;
};

const formatSecondsToHMS = (seconds: number): string => {
 const totalSeconds = Math.floor(seconds);
 const hours = Math.floor(totalSeconds / 3600);
 const minutes = Math.floor((totalSeconds % 3600) / 60);
 const remainingSeconds = totalSeconds % 60;

 const paddedHours = hours.toString().padStart(2, "0");
 const paddedMinutes = minutes.toString().padStart(2, "0");
 const paddedSeconds = remainingSeconds.toString().padStart(2, "0");

 return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
};

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
 data,
 onClear,
 fileName,
 t,
 importedState,
}) => {
 const [editableData, setEditableData] = useState<TranscriptionResponse>(data);
 const [speakerNameMap, setSpeakerNameMap] = useState<{
  [key: string]: string;
 }>({});
 const [speakerColorMap, setSpeakerColorMap] = useState<{
  [key: string]: { bg: string; bgUser: string; text: string; border: string };
 }>({});
 const [editableDurations, setEditableDurations] = useState<Durations>(
  data.durations
 );
 const [deletedSpeakers, setDeletedSpeakers] = useState<Set<string>>(new Set());
 const [isSavingPDF, setIsSavingPDF] = useState<boolean>(false);
 const [isSavingJSON, setIsSavingJSON] = useState<boolean>(false);
 const [showSaveSuccessToast, setShowSaveSuccessToast] =
  useState<boolean>(false);
 const [showJsonSuccessToast, setShowJsonSuccessToast] =
  useState<boolean>(false);

 useEffect(() => {
  if (importedState) {
   setSpeakerNameMap(importedState.speakerNameMap);
   setSpeakerColorMap(importedState.speakerColorMap);
   setEditableData(importedState.transcriptionData);
   setEditableDurations(importedState.editableDurations);

   if (importedState.deletedSpeakers) {
    setDeletedSpeakers(new Set(importedState.deletedSpeakers));
   }

   return;
  }

  const uniqueSpeakers = [
   ...new Set(data.aligned_transcription.map((s) => s.speaker)),
  ].sort();

  const initialNameMap = uniqueSpeakers.reduce((acc, speaker: string) => {
   const match = speaker.match(/(\d+)$/);
   if (match) {
    const speakerNum = parseInt(match[1], 10);
    acc[speaker] = `${t.person} ${String(speakerNum + 1).padStart(2, "0")}`;
   } else {
    acc[speaker] = speaker;
   }
   return acc;
  }, {} as { [key: string]: string });

  const initialColorMap = uniqueSpeakers.reduce((acc, speaker: string) => {
   const hue = Math.floor(Math.random() * 360);
   acc[speaker] = {
    bg: `hsl(${hue}, 70%, 95%)`,
    bgUser: `hsl(${hue}, 80%, 25%, 0.4)`,
    text: `hsl(${hue}, 80%, 25%)`,
    border: `hsl(${hue}, 60%, 80%)`,
   };
   return acc;
  }, {} as { [key: string]: { bg: string; bgUser: string; text: string; border: string } });

  setSpeakerNameMap(initialNameMap);
  setSpeakerColorMap(initialColorMap);
  setEditableData(data);
  setEditableDurations(data.durations);
 }, [data, importedState]);

 const handleSpeakerNameChange = (originalSpeaker: string, newName: string) => {
  setSpeakerNameMap((prevMap) => ({
   ...prevMap,
   [originalSpeaker]: newName,
  }));
 };

 const handleSpeakerDelete = (speakerToDelete: string) => {
  // Verificar se o locutor tem ALGUM segmento (ativo ou deletado)
  const hasSomeSegment = editableData.aligned_transcription.some(
   (segment) => segment.speaker === speakerToDelete
  );

  // Se não tem nenhum segmento, excluir definitivamente
  if (!hasSomeSegment) {
   setSpeakerNameMap((prevMap) => {
    const newMap = { ...prevMap };
    delete newMap[speakerToDelete];
    return newMap;
   });

   setSpeakerColorMap((prevMap) => {
    const newMap = { ...prevMap };
    delete newMap[speakerToDelete];
    return newMap;
   });

   setDeletedSpeakers((prev) => {
    const newSet = new Set(prev);
    newSet.delete(speakerToDelete);
    return newSet;
   });

   return;
  }

  // Marcar o locutor como deletado
  setDeletedSpeakers((prev) => new Set(prev).add(speakerToDelete));

  // Marcar como deletado APENAS os segmentos que NÃO estavam deletados antes
  const newTranscription = editableData.aligned_transcription.map((segment) => {
   if (segment.speaker === speakerToDelete && !segment.isDeleted) {
    return { ...segment, isDeleted: true, deletedBySpeaker: true };
   }
   return segment;
  });

  const newTotalWords = newTranscription.reduce(
   (total, segment) =>
    total + (segment.isDeleted ? 0 : countWords(segment.text)),
   0
  );

  setEditableData((prevData) => ({
   ...prevData,
   aligned_transcription: newTranscription,
  }));

  setEditableDurations((prevDurations) => ({
   ...prevDurations,
   total_words: newTotalWords,
  }));
 };

 const handleSpeakerRestore = (speakerToRestore: string) => {
  setDeletedSpeakers((prev) => {
   const newSet = new Set(prev);
   newSet.delete(speakerToRestore);
   return newSet;
  });

  // Restaurar APENAS os segmentos que foram deletados pela exclusão do locutor
  const newTranscription = editableData.aligned_transcription.map((segment) => {
   if (segment.speaker === speakerToRestore && segment.deletedBySpeaker) {
    const { deletedBySpeaker, ...segmentWithoutFlag } = segment;
    return { ...segmentWithoutFlag, isDeleted: false };
   }
   return segment;
  });

  const newTotalWords = newTranscription.reduce(
   (total, segment) =>
    total + (segment.isDeleted ? 0 : countWords(segment.text)),
   0
  );

  setEditableData((prevData) => ({
   ...prevData,
   aligned_transcription: newTranscription,
  }));

  setEditableDurations((prevDurations) => ({
   ...prevDurations,
   total_words: newTotalWords,
  }));
 };

 const handleAddSpeaker = () => {
  const existingSpeakers = Object.keys(speakerNameMap);
  const speakerNumbers = existingSpeakers
   .map((speaker) => {
    const match = speaker.match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : -1;
   })
   .filter((num) => num >= 0);

  const maxSpeakerNum =
   speakerNumbers.length > 0 ? Math.max(...speakerNumbers) : -1;
  const newSpeakerNum = maxSpeakerNum + 1;
  const newSpeakerId = `SPEAKER_${String(newSpeakerNum).padStart(2, "0")}`;

  const hue = Math.floor(Math.random() * 360);
  const newColor = {
   bg: `hsl(${hue}, 70%, 95%)`,
   bgUser: `hsl(${hue}, 80%, 25%, 0.4)`,
   text: `hsl(${hue}, 80%, 25%)`,
   border: `hsl(${hue}, 60%, 80%)`,
  };

  setSpeakerNameMap((prevMap) => ({
   ...prevMap,
   [newSpeakerId]: `${t.person} ${String(newSpeakerNum + 1).padStart(2, "0")}`,
  }));

  setSpeakerColorMap((prevMap) => ({
   ...prevMap,
   [newSpeakerId]: newColor,
  }));
 };

 const handleAddSegment = (
  index: number,
  selectedSpeaker: string,
  startTime: number,
  endTime: number
 ) => {
  const newSegment: TranscriptionSegment = {
   start: startTime,
   end: endTime,
   text: "",
   speaker: selectedSpeaker,
   isDeleted: false,
  };

  const newTranscription = [
   ...editableData.aligned_transcription.slice(0, index),
   newSegment,
   ...editableData.aligned_transcription.slice(index),
  ];

  setEditableData((prevData) => ({
   ...prevData,
   aligned_transcription: newTranscription,
  }));
 };

 const handleAddSegmentAtStart = (selectedSpeaker: string) => {
  const startTime = 0;
  const endTime = editableData.aligned_transcription[0]?.start || 0;
  handleAddSegment(0, selectedSpeaker, startTime, endTime);
 };

 const handleAddSegmentAtEnd = (selectedSpeaker: string) => {
  const index = editableData.aligned_transcription.length;
  const startTime = editableData.aligned_transcription[index - 1]?.end || 0;
  const endTime = isNaN(editableDurations.total_seconds)
   ? startTime
   : editableDurations.total_seconds;
  handleAddSegment(index, selectedSpeaker, startTime, endTime);
 };

 const handleAddSegmentBetween = (index: number, selectedSpeaker: string) => {
  const segmentBefore = editableData.aligned_transcription[index];
  const segmentAfter = editableData.aligned_transcription[index + 1];

  if (!segmentBefore || !segmentAfter) {
   console.error("Intersection segments not found.");
   return;
  }

  const startTime = segmentBefore.end;
  const endTime = segmentAfter.start;

  handleAddSegment(index + 1, selectedSpeaker, startTime, endTime);
 };

 const handleSegmentChange = (
  index: number,
  updatedSegment: Partial<TranscriptionSegment>
 ) => {
  if (updatedSegment.speaker !== undefined) {
   const originalSpeakerId = editableData.aligned_transcription[index].speaker;
   handleSpeakerNameChange(originalSpeakerId, updatedSegment.speaker);
  }

  if (updatedSegment.text !== undefined) {
   const newTranscription = [...editableData.aligned_transcription];

   newTranscription[index] = {
    ...newTranscription[index],
    text: updatedSegment.text,
   };

   const newTotalWords = newTranscription.reduce(
    (total, segment) =>
     total + (segment.isDeleted ? 0 : countWords(segment.text)),
    0
   );

   setEditableData((prevData) => ({
    ...prevData,
    aligned_transcription: newTranscription,
   }));

   setEditableDurations((prevDurations) => ({
    ...prevDurations,
    total_words: newTotalWords,
   }));
  }
 };

 const handleSegmentDelete = (indexToDelete: number) => {
  const newTranscription = editableData.aligned_transcription.map(
   (segment, index) => {
    if (index === indexToDelete) {
     return { ...segment, isDeleted: true };
    }
    return segment;
   }
  );

  const newTotalWords = newTranscription.reduce(
   (total, segment) =>
    total + (segment.isDeleted ? 0 : countWords(segment.text)),
   0
  );

  setEditableData((prevData) => ({
   ...prevData,
   aligned_transcription: newTranscription,
  }));

  setEditableDurations((prevDurations) => ({
   ...prevDurations,
   total_words: newTotalWords,
  }));
 };

 const handleSegmentUndo = (indexToUndo: number) => {
  const segmentToRestore = editableData.aligned_transcription[indexToUndo];
  const speakerOfSegment = segmentToRestore.speaker;

  // Se o locutor foi excluído definitivamente, precisamos recriá-lo
  if (!speakerNameMap[speakerOfSegment]) {
   const match = speakerOfSegment.match(/(\d+)$/);
   let speakerName = speakerOfSegment;

   if (match) {
    const speakerNum = parseInt(match[1], 10);
    speakerName = `${t.person} ${String(speakerNum + 1).padStart(2, "0")}`;
   }

   const hue = Math.floor(Math.random() * 360);
   const newColor = {
    bg: `hsl(${hue}, 70%, 95%)`,
    bgUser: `hsl(${hue}, 80%, 25%, 0.4)`,
    text: `hsl(${hue}, 80%, 25%)`,
    border: `hsl(${hue}, 60%, 80%)`,
   };

   setSpeakerNameMap((prevMap) => ({
    ...prevMap,
    [speakerOfSegment]: speakerName,
   }));

   setSpeakerColorMap((prevMap) => ({
    ...prevMap,
    [speakerOfSegment]: newColor,
   }));
  }

  if (deletedSpeakers.has(speakerOfSegment)) {
   setDeletedSpeakers((prev) => {
    const newSet = new Set(prev);
    newSet.delete(speakerOfSegment);
    return newSet;
   });
  }

  const newTranscription = editableData.aligned_transcription.map(
   (segment, index) => {
    if (index === indexToUndo) {
     // Remove a flag deletedBySpeaker se existir
     const { deletedBySpeaker, ...segmentWithoutFlag } = segment;
     return { ...segmentWithoutFlag, isDeleted: false };
    }
    return segment;
   }
  );

  const newTotalWords = newTranscription.reduce(
   (total, segment) =>
    total + (segment.isDeleted ? 0 : countWords(segment.text)),
   0
  );

  setEditableData((prevData) => ({
   ...prevData,
   aligned_transcription: newTranscription,
  }));

  setEditableDurations((prevDurations) => ({
   ...prevDurations,
   total_words: newTotalWords,
  }));
 };

 const handleSegmentPermanentDelete = (indexToDelete: number) => {
  const newTranscription = editableData.aligned_transcription.filter(
   (_, index) => index !== indexToDelete
  );

  const newTotalWords = newTranscription.reduce(
   (total, segment) =>
    total + (segment.isDeleted ? 0 : countWords(segment.text)),
   0
  );

  setEditableData((prevData) => ({
   ...prevData,
   aligned_transcription: newTranscription,
  }));

  setEditableDurations((prevDurations) => ({
   ...prevDurations,
   total_words: newTotalWords,
  }));
 };

 const showSuccessToast = () => {
  setShowSaveSuccessToast(true);
  setTimeout(() => {
   setShowSaveSuccessToast(false);
  }, 3000);
 };

 const handleExportPDF = async () => {
  if (isSavingPDF) return;

  const hasEmptySpeakerName = Object.values(speakerNameMap).some(
   (name) => name.trim() === ""
  );

  if (hasEmptySpeakerName) {
   alert(t.exportPDFAlert);
   return;
  }

  setIsSavingPDF(true);
  try {
   const doc = new jsPDF({
    orientation: "p",
    unit: "pt",
    format: "a4",
   });

   const formatTime = (seconds: number): string => {
    return formatSecondsToHMS(seconds);
   };

   const FONT_SIZES = {
    title: 24,
    heading1: 18,
    heading2: 14,
    body: 11,
    meta: 9,
   };
   const COLORS = {
    heading: "#1E293B",
    body: "#334155",
    meta: "#64748B",
    primary: "#0284C7",
   };
   const MARGIN = 50;
   const page = {
    width: doc.internal.pageSize.getWidth(),
    height: doc.internal.pageSize.getHeight(),
   };
   const usableWidth = page.width - MARGIN * 2;
   let cursorY = MARGIN;

   const addPageNumbers = () => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(FONT_SIZES.meta);
    doc.setTextColor(COLORS.meta);
    for (let i = 1; i <= pageCount; i++) {
     doc.setPage(i);
     doc.text(
      `${t.pdfPage} ${i} ${t.pdfOf} ${pageCount}`,
      page.width / 2,
      page.height - 20,
      {
       align: "center",
      }
     );
    }
   };

   const checkPageBreak = (spaceNeeded: number) => {
    if (cursorY + spaceNeeded > page.height - MARGIN) {
     doc.addPage();
     cursorY = MARGIN;
    }
   };

   doc.setFontSize(FONT_SIZES.title);
   doc.setFont("helvetica", "bold");
   doc.setTextColor(COLORS.heading);
   doc.text(t.pdfTitle, page.width / 2, cursorY + 20, {
    align: "center",
   });
   cursorY += 80;

   doc.setFontSize(FONT_SIZES.body);
   doc.setFont("helvetica", "normal");
   doc.setTextColor(COLORS.body);
   doc.text(`${t.pdfSourceFile}: ${fileName}`, page.width / 2, cursorY, {
    align: "center",
   });
   cursorY += 20;

   const generationDate = new Date().toLocaleString();
   doc.text(`${t.pdfGeneratedAt}: ${generationDate}`, page.width / 2, cursorY, {
    align: "center",
   });

   doc.addPage();
   cursorY = MARGIN;
   doc.setFontSize(FONT_SIZES.heading1);
   doc.setFont("helvetica", "bold");
   doc.setTextColor(COLORS.heading);
   doc.text(t.pdfTranscription, MARGIN, cursorY);
   cursorY += FONT_SIZES.heading1 * 2;

   const filteredTranscription = editableData.aligned_transcription.filter(
    (segment) => !segment.isDeleted
   );

   filteredTranscription.forEach((segment) => {
    const speakerName = speakerNameMap[segment.speaker] || segment.speaker;
    const timeInfo = `${formatTime(segment.start)}:`;
    const headerHeight = FONT_SIZES.heading2 * 1.5;
    const singleLineHeight = FONT_SIZES.body * 1.2;

    checkPageBreak(headerHeight + singleLineHeight + 25);

    doc.setFontSize(FONT_SIZES.meta);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLORS.meta);
    doc.text(timeInfo, MARGIN, cursorY);

    const timeInfoWidth = doc.getTextWidth(timeInfo);
    const speakerXPosition = MARGIN + timeInfoWidth + 5;

    doc.setFontSize(FONT_SIZES.heading2);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.primary);
    doc.text(speakerName, speakerXPosition, cursorY);

    cursorY += headerHeight;

    doc.setFontSize(FONT_SIZES.body);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLORS.body);
    const textLines = doc.splitTextToSize(segment.text, usableWidth);

    textLines.forEach((line: string) => {
     checkPageBreak(singleLineHeight);
     doc.text(line, MARGIN, cursorY, { align: "left" });
     cursorY += singleLineHeight;
    });

    cursorY += 25;
   });

   doc.addPage();
   cursorY = MARGIN;
   doc.setFontSize(FONT_SIZES.heading1);
   doc.setFont("helvetica", "bold");
   doc.setTextColor(COLORS.heading);
   doc.text(t.pdfSummary, MARGIN, cursorY);
   cursorY += FONT_SIZES.heading1 * 1.5;

   const totalWordsForPDF = editableData.aligned_transcription.reduce(
    (total, segment) =>
     total + (segment.isDeleted ? 0 : countWords(segment.text)),
    0
   );

   const summaryItems = {
    [t.audioDuration]:
     editableDurations.total_time ||
     formatTime(editableDurations.total_seconds),
    [t.totalWords]: totalWordsForPDF.toString(),
   };

   doc.setFontSize(FONT_SIZES.body);
   Object.entries(summaryItems).forEach(([label, value]) => {
    checkPageBreak(30);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.heading);
    doc.text(`${label}:`, MARGIN, cursorY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLORS.body);
    doc.text(value, MARGIN + 140, cursorY);

    cursorY += FONT_SIZES.body * 1.8;
   });

   addPageNumbers();

   const suggestedName = fileName.replace(/\.wav$/i, ".pdf");
   if (window.showSaveFilePicker) {
    try {
     const handle = await window.showSaveFilePicker({
      suggestedName,
      types: [
       {
        description: "PDF Documents",
        accept: { "application/pdf": [".pdf"] },
       },
      ],
     });
     const writable = await handle.createWritable();
     await writable.write(doc.output("arraybuffer"));
     await writable.close();
     showSuccessToast();
    } catch (err: any) {
     if (err.name !== "AbortError") {
      console.error("Error saving file with File System Access API:", err);
      doc.save(suggestedName);
      showSuccessToast();
     } else {
      console.log("User cancelled the save dialog.");
     }
    }
   } else {
    doc.save(suggestedName);
    showSuccessToast();
   }
  } catch (e) {
   console.error("Failed to generate PDF:", e);
   alert("An unexpected error occurred while generating the PDF.");
  } finally {
   setIsSavingPDF(false);
  }
 };

 const handleExportJSON = async () => {
  if (isSavingJSON) return;

  setIsSavingJSON(true);
  try {
   const appState: SavedAppState = {
    version: "1.0.0",
    fileName: fileName,
    savedAt: new Date().toISOString(),
    transcriptionData: editableData,
    speakerNameMap: speakerNameMap,
    speakerColorMap: speakerColorMap,
    editableDurations: editableDurations,
    deletedSpeakers: Array.from(deletedSpeakers),
   };

   const jsonContent = JSON.stringify(appState, null, 2);
   const suggestedName = fileName.replace(/\.wav$/i, ".json");

   const filePath = await save({
    defaultPath: suggestedName,
    filters: [
     {
      name: "JSON",
      extensions: ["json"],
     },
    ],
   });

   if (filePath) {
    await writeTextFile(filePath, jsonContent);
    setShowJsonSuccessToast(true);
    setTimeout(() => {
     setShowJsonSuccessToast(false);
    }, 3000);
   }
  } catch (err: any) {
   if (err.message && err.message.includes("cancelled")) {
    console.log("User cancelled the save dialog.");
   } else {
    console.error("Failed to export JSON:", err);
    alert(t.exportJsonError);
   }
  } finally {
   setIsSavingJSON(false);
  }
 };

 const isExportDisabled = useMemo(() => {
  if (Object.keys(speakerNameMap).length === 0) {
   return true;
  }
  return Object.entries(speakerNameMap).some(
   ([speaker, name]) => !deletedSpeakers.has(speaker) && name.trim() === ""
  );
 }, [speakerNameMap, deletedSpeakers]);

 const availableSpeakers = useMemo(() => {
  return Object.keys(speakerNameMap)
   .filter((speakerId) => !deletedSpeakers.has(speakerId))
   .map((speakerId) => ({
    id: speakerId,
    name: speakerNameMap[speakerId],
   }));
 }, [speakerNameMap, deletedSpeakers]);

 return (
  <div className="space-y-8">
   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2 sm:mb-0">
     {t.analysisOf}
     <span className="text-sky-600 dark:text-sky-400">{fileName}</span>
    </h2>
    <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
     <button
      onClick={handleExportJSON}
      disabled={isSavingJSON}
      className="w-full sm:w-auto px-6 py-2 bg-emerald-600 text-white font-semibold rounded-lg shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
     >
      {isSavingJSON ? (
       <>
        <div className="w-6 h-6 border-4 border-t-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
        {t.saving}
       </>
      ) : (
       t.exportJSON
      )}
     </button>
     <button
      onClick={handleExportPDF}
      disabled={isSavingPDF || isExportDisabled}
      className="w-full sm:w-auto px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
     >
      {isSavingPDF ? (
       <>
        <div className="w-6 h-6 border-4 border-t-4 border-slate-200 border-t-sky-600 rounded-full animate-spin"></div>
        {t.saving}
       </>
      ) : (
       t.exportPDF
      )}
     </button>
     <button
      onClick={onClear}
      className="w-full sm:w-auto px-6 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all cursor-pointer"
     >
      {t.analyzeAnother}
     </button>
    </div>
   </div>

   <SpeakerManager
    speakerMap={speakerNameMap}
    deletedSpeakers={deletedSpeakers}
    onNameChange={handleSpeakerNameChange}
    onSpeakerDelete={handleSpeakerDelete}
    onSpeakerRestore={handleSpeakerRestore}
    onAddSpeaker={handleAddSpeaker}
    t={t}
   />

   {isExportDisabled && (
    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-l-4 border-red-400 dark:border-red-600 rounded-r-lg flex items-center transition-opacity duration-300">
     <ExclamationTriangleIcon className="size-8 fill-[#c73434] mr-3" />
     <p className="text-sm font-medium">{t.exportWarning}</p>
    </div>
   )}

   <div>
    <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 border-b dark:border-slate-600 pb-2">
     {t.transcriptionSegments}
    </h3>
    <div className="max-h-[60vh] overflow-y-auto pr-4">
     {editableData.aligned_transcription.length === 0 && (
      <AddSegmentButton
       onAddSegment={handleAddSegmentAtStart}
       availableSpeakers={availableSpeakers}
       t={t}
      />
     )}

     {editableData.aligned_transcription.map((segment, index) => (
      <React.Fragment key={index}>
       <TranscriptionCard
        segment={segment}
        index={index}
        speakerDisplayName={speakerNameMap[segment.speaker]}
        color={speakerColorMap[segment.speaker]}
        onSegmentChange={handleSegmentChange}
        onDelete={handleSegmentDelete}
        onUndo={handleSegmentUndo}
        onPermanentDelete={handleSegmentPermanentDelete}
        t={t}
       />

       {index < editableData.aligned_transcription.length - 1 && (
        <AddSegmentButton
         onAddSegment={(selectedSpeaker) =>
          handleAddSegmentBetween(index, selectedSpeaker)
         }
         availableSpeakers={availableSpeakers}
         t={t}
        />
       )}
      </React.Fragment>
     ))}

     {editableData.aligned_transcription.length > 0 && (
      <AddSegmentButton
       onAddSegment={handleAddSegmentAtEnd}
       availableSpeakers={availableSpeakers}
       t={t}
      />
     )}
    </div>
   </div>

   <div>
    <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 border-b dark:border-slate-600 pb-2">
     {t.summary}
    </h3>

    <SummaryStats durations={editableDurations} t={t} />

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 mt-8">
     <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
       <MicrophoneIcon className="size-6 mr-2" />
       {t.transcriptionTime}
      </p>
      <p className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight mt-3">
       {formatSecondsToHMS(data.durations.transcription_seconds)}
      </p>
     </div>

     <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
       <Bars4Icon className="size-6 mr-2" />
       {t.aligningTime}
      </p>
      <p className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight mt-3">
       {formatSecondsToHMS(data.durations.alignment_seconds)}
      </p>
     </div>

     <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
       <UserGroupIcon className="size-6 mr-2" />
       {t.diarizationTime}
      </p>
      <p className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight mt-3">
       {formatSecondsToHMS(data.durations.diarization_seconds)}
      </p>
     </div>
    </div>
   </div>

   <ToastNotification
    message={t.fileSavedSuccess}
    show={showSaveSuccessToast}
    onClose={() => setShowSaveSuccessToast(false)}
    t={t}
   />
   <ToastNotification
    message={t.jsonSavedSuccess}
    show={showJsonSuccessToast}
    onClose={() => setShowJsonSuccessToast(false)}
    t={t}
   />
  </div>
 );
};

export default ResultsDisplay;
