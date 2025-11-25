import { jsPDF } from "jspdf";
import { TranscriptionResponse, Durations } from "../types";
import { Translations } from "../i18n";
import { formatSecondsToHMS, countWords } from "../utils/formatters";

interface PdfExportParams {
 fileName: string;
 transcriptionData: TranscriptionResponse;
 speakerNameMap: { [key: string]: string };
 durations: Durations;
 t: Translations;
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
  showSaveFilePicker: (options?: any) => Promise<FileSystemFileHandle>;
 }
}

export const generateAndSavePDF = async ({
 fileName,
 transcriptionData,
 speakerNameMap,
 durations,
 t,
}: PdfExportParams): Promise<void> => {
 const doc = new jsPDF({
  orientation: "p",
  unit: "pt",
  format: "a4",
 });

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
    { align: "center" }
   );
  }
 };

 const checkPageBreak = (spaceNeeded: number) => {
  if (cursorY + spaceNeeded > page.height - MARGIN) {
   doc.addPage();
   cursorY = MARGIN;
  }
 };

 // --- Header ---
 doc.setFontSize(FONT_SIZES.title);
 doc.setFont("helvetica", "bold");
 doc.setTextColor(COLORS.heading);
 doc.text(t.pdfTitle, page.width / 2, cursorY + 20, { align: "center" });
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

 // --- Transcription Content ---
 doc.addPage();
 cursorY = MARGIN;
 doc.setFontSize(FONT_SIZES.heading1);
 doc.setFont("helvetica", "bold");
 doc.setTextColor(COLORS.heading);
 doc.text(t.pdfTranscription, MARGIN, cursorY);
 cursorY += FONT_SIZES.heading1 * 2;

 const filteredTranscription = transcriptionData.aligned_transcription.filter(
  (segment) => !segment.isDeleted
 );

 filteredTranscription.forEach((segment) => {
  const speakerName = speakerNameMap[segment.speaker] || segment.speaker;
  const timeInfo = `${formatSecondsToHMS(segment.start)}:`;
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

 // --- Summary Section ---
 doc.addPage();
 cursorY = MARGIN;
 doc.setFontSize(FONT_SIZES.heading1);
 doc.setFont("helvetica", "bold");
 doc.setTextColor(COLORS.heading);
 doc.text(t.pdfSummary, MARGIN, cursorY);
 cursorY += FONT_SIZES.heading1 * 1.5;

 const totalWordsForPDF = filteredTranscription.reduce(
  (total, segment) => total + countWords(segment.text),
  0
 );

 const summaryItems = {
  [t.audioDuration]:
   durations.total_time || formatSecondsToHMS(durations.total_seconds),
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

 // --- Saving Logic ---
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
  } catch (err: any) {
   if (err.name !== "AbortError") {
    console.error("Error with File System Access API, falling back:", err);
    doc.save(suggestedName);
   } else {
    throw new Error("cancelled");
   }
  }
 } else {
  doc.save(suggestedName);
 }
};
