import JSZip from "jszip";
import { save } from "@tauri-apps/plugin-dialog";
import { open } from "@tauri-apps/plugin-fs";
import { SavedAppState } from "../types";
import { PROJECT_FORMAT_VERSION } from "../constants";

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

export function encodeWAV(
  buffer: AudioBuffer,
  startSec: number,
  endSec: number
): ArrayBuffer {
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const startFrame = Math.floor(startSec * sampleRate);
  const endFrame = Math.min(
    Math.ceil(endSec * sampleRate),
    buffer.length
  );
  const numFrames = Math.max(0, endFrame - startFrame);

  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataBytes = numFrames * blockAlign;
  const headerSize = 44;

  const arrayBuffer = new ArrayBuffer(headerSize + dataBytes);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataBytes, true);

  let offset = headerSize;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = buffer.getChannelData(ch)[startFrame + i];
      const clamped = Math.max(-1, Math.min(1, sample));
      const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return arrayBuffer;
}


export const saveProjectToZip = async (
  fileName: string,
  appState: SavedAppState,
  audioBuffer?: AudioBuffer | null
): Promise<string | null> => {
  const suggestedName = fileName.replace(/\.[^.]+$/, ".koala");

  const zip = new JSZip();

  const segments = appState.transcriptionData.aligned_transcription;
  const annotatedSegments = segments.map((seg, idx) => {
    if (audioBuffer && !seg.isDeleted) {
      return {
        ...seg,
        audioSegmentFile: `segments/seg_${String(idx).padStart(3, "0")}.wav`,
      };
    }
    return seg;
  });

  const annotatedState: SavedAppState = {
    ...appState,
    version: PROJECT_FORMAT_VERSION,
    transcriptionData: {
      ...appState.transcriptionData,
      aligned_transcription: annotatedSegments,
    },
  };

  zip.file("project.json", JSON.stringify(annotatedState, null, 2));

  if (audioBuffer) {
    const segFolder = zip.folder("segments")!;
    for (let idx = 0; idx < segments.length; idx++) {
      const seg = segments[idx];
      if (seg.isDeleted) continue;
      const wavBuffer = encodeWAV(audioBuffer, seg.start, seg.end);
      const padded = String(idx).padStart(3, "0");
      segFolder.file(`seg_${padded}.wav`, wavBuffer);
    }
  }

  const zipBytes = await zip.generateAsync({ type: "uint8array" });

  try {
    const filePath = await save({
      defaultPath: suggestedName,
      filters: [{ name: "Koala Project", extensions: ["koala"] }],
    });

    if (!filePath) return null;

    const fileHandle = await open(filePath, {
      write: true,
      create: true,
      truncate: true,
    });
    await fileHandle.write(zipBytes);
    await fileHandle.close();

    return filePath;
  } catch (err: any) {
    if (
      err.message &&
      (err.message.includes("cancelled") ||
        err.message.toLowerCase().includes("cancel"))
    ) {
      return null;
    }
    throw err;
  }
};
