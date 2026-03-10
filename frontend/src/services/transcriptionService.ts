import { TranscriptionResponse } from "../types";

const BASE_URL = "http://127.0.0.1:5000";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ProcessingStatus {
 status:
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
 progress?: number;
 message?: string;
 downloading_progress?: number;
}

export const processUploadWithStatus = async (
 input: File | string,
 onStatusUpdate: (status: ProcessingStatus) => void
): Promise<TranscriptionResponse> => {
 const formData = new FormData();
 const isFile = input instanceof File;

 if (isFile) {
  formData.append("file", input as File);
 } else {
  formData.append("url", (input as string).trim());
 }

 onStatusUpdate({ status: "uploading" });

 const MAX_TIMEOUT = 120000;
 const startTime = Date.now();

 while (Date.now() - startTime < MAX_TIMEOUT) {
  try {
   const uploadResponse = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
   });

   if (uploadResponse.ok) {
    break;
   }

   if (uploadResponse.status >= 400 && uploadResponse.status < 500) {
    const errorText = await uploadResponse.text();
    throw new Error(
     `Upload failed with status ${uploadResponse.status}: ${errorText}`
    );
   }
   throw new Error(`Server error: ${uploadResponse.status}`);
  } catch (err: any) {
   if (err.message && err.message.includes("Upload failed with status 4")) {
    throw err;
   }

   const elapsed = Date.now() - startTime;

   if (elapsed >= MAX_TIMEOUT) {
    console.error("Network error during upload (Timeout):", err);
    throw new Error(
     isFile
      ? "Could not connect to server to upload file after 120s. Try again!"
      : "Could not connect to server to upload link after 120s. Try again!"
    );
   }

   await sleep(2000);
  }
 }

 onStatusUpdate({ status: "queued" });
 await sleep(3000);

 while (true) {
  try {
   const checkResponse = await fetch(`${BASE_URL}/check_file`);
   if (!checkResponse.ok) {
    console.warn(
     `Non-OK response while checking status: ${checkResponse.status}`
    );
    await sleep(5000);
    continue;
   }

   const result = await checkResponse.json();

   if (result.state === "ready") {
    break;
   } else if (result.state === "error") {
    throw new Error(`Processing error: ${result.err}`);
   }

   onStatusUpdate({
    status: result.state,
   });

   await sleep(5000);
  } catch (err) {
   console.error("Network error while checking status:", err);
   await sleep(5000);
  }
 }

 try {
  const resultResponse = await fetch(`${BASE_URL}/get_json`);
  if (!resultResponse.ok) {
   const errorText = await resultResponse.text();
   console.error(
    `Failed to fetch result with status ${resultResponse.status}: ${errorText}`
   );
   throw new Error("Failed to fetch transcription result file.");
  }

  const data: TranscriptionResponse = await resultResponse.json();
  return data;
 } catch (err) {
  console.error("Network error fetching final result:", err);
  throw new Error("Could not connect to server to retrieve final result.");
 }
};

export const fetchAudioFromServer = async (): Promise<Blob> => {
 const response = await fetch(`${BASE_URL}/get_audio`);
 if (!response.ok) {
  throw new Error("Failed to fetch audio from server.");
 }
 return await response.blob();
};
