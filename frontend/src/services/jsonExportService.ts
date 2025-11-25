import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { SavedAppState } from "../types";

export const saveProjectToJSON = async (
 fileName: string,
 appState: SavedAppState
): Promise<string | null> => {
 const jsonContent = JSON.stringify(appState, null, 2);
 const suggestedName = fileName.replace(/\.wav$/i, ".json");

 try {
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
   return filePath;
  }
  return null;
 } catch (err: any) {
  if (err.message && err.message.includes("cancelled")) {
   return null;
  }
  throw err;
 }
};
