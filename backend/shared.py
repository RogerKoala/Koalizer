import threading
from pathlib import Path
import os
import sys


def resource_path(relative_path):
  try:
    base_path = sys._MEIPASS
  except Exception:
    base_path = os.path.abspath(".")
  return os.path.join(base_path, relative_path)


UPLOAD_DIR = Path("upload")
OUTPUT_DIR = Path("output")
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)
OUTPUT_DIR.mkdir(exist_ok=True, parents=True)

ALLOWED_EXT = {".wav", ".mp3", ".m4a",
               ".flac", ".ogg", ".opus", ".amr", ".mp4", ".mov", ".mkv", ".avi"}
INPUT_NAME = "input"
OUTPUT_NAME = "output.json"

YTDLP_PATH = resource_path(os.path.join("bin", "yt-dlp.exe"))
FFMPEG_PATH = resource_path(os.path.join("bin", "ffmpeg.exe"))
PYANNOTE_PATH = resource_path(os.path.join(
  "models", "pyannote_diarization_config.yaml"))

bin_path = resource_path("bin")
models_path = resource_path("models")
os.environ["PATH"] += os.pathsep + bin_path
os.environ["PATH"] += os.pathsep + models_path
lock = threading.Lock()
status = {
    "state": "idle",
    "json": None,
    "err": None,
}


def update_status(state: str):
  with lock:
    status["state"] = state
