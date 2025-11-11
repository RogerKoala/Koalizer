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

 try {
  const uploadResponse = await fetch(`${BASE_URL}/upload`, {
   method: "POST",
   body: formData,
  });

  if (!uploadResponse.ok) {
   const errorText = await uploadResponse.text();
   console.error(
    `Falha no upload com status ${uploadResponse.status}: ${errorText}`
   );
   throw new Error(
    isFile
     ? "Falha ao enviar o arquivo para o servidor. Verifique se o backend está em execução."
     : "Falha ao enviar o link do YouTube para o servidor. Verifique se o backend está em execução."
   );
  }
 } catch (err) {
  console.error("Erro de rede durante o upload:", err);
  throw new Error(
   isFile
    ? "Não foi possível conectar ao servidor para enviar o arquivo. Verifique sua conexão e se o backend está ativo."
    : "Não foi possível conectar ao servidor para enviar o link. Verifique sua conexão e se o backend está ativo."
  );
 }

 onStatusUpdate({ status: "queued" });
 await sleep(3000);

 while (true) {
  try {
   const checkResponse = await fetch(`${BASE_URL}/check_file`);
   if (!checkResponse.ok) {
    console.warn(
     `Resposta não OK ao verificar status: ${checkResponse.status}`
    );
    await sleep(5000);
    continue;
   }

   const result = await checkResponse.json();

   if (result.state === "ready") {
    break;
   } else if (result.state === "error") {
    throw new Error(`Erro no processamento: ${result.err}`);
   }

   onStatusUpdate({
    status: result.state,
   });

   await sleep(5000);
  } catch (err) {
   console.error("Erro de rede durante a verificação de status:", err);
   await sleep(5000);
  }
 }

 try {
  const resultResponse = await fetch(`${BASE_URL}/get_json`);
  if (!resultResponse.ok) {
   const errorText = await resultResponse.text();
   console.error(
    `Falha ao buscar o resultado com status ${resultResponse.status}: ${errorText}`
   );
   throw new Error("Falha ao buscar o arquivo de resultado da transcrição.");
  }

  const data: TranscriptionResponse = await resultResponse.json();
  return data;
 } catch (err) {
  console.error("Erro de rede ao buscar o resultado final:", err);
  throw new Error(
   "Não foi possível conectar ao servidor para obter o resultado final."
  );
 }
};
