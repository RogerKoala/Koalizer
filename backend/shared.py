import threading
from pathlib import Path

UPLOAD_DIR = Path("upload")
OUTPUT_DIR = Path("saida")
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)
OUTPUT_DIR.mkdir(exist_ok=True, parents=True)

ALLOWED_EXT = {".wav", ".mp3", ".m4a",
               ".flac", ".ogg", ".opus", ".amr", ".mp4", ".mov", ".mkv", ".avi"}
INPUT_NAME = "input"
OUTPUT_NAME = "saida.json"

lock = threading.Lock()
status = {
    "state": "idle",
    "json": None,
    "err": None,
}


def update_status(state: str):
  """Atualiza o status global do processamento."""
  with lock:
    status["state"] = state
