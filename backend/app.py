import traceback
import shutil
import json
import time
from pathlib import Path
from threading import Thread
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from flask_cors import CORS
from youtube_utils import startup_check

# Local imports
from main import create_json
from youtube_downloader import download_youtube_audio, validate_youtube_url, get_video_info
from shared import lock, status, update_status, UPLOAD_DIR, OUTPUT_DIR, ALLOWED_EXT, INPUT_NAME, OUTPUT_NAME

app = Flask(__name__)
CORS(app, supports_credentials=True)


def _is_allowed(filename: str) -> bool:
  return Path(filename).suffix.lower() in ALLOWED_EXT


def _clear_directory(d: Path):
  for p in list(d.iterdir()):
    try:
      if p.is_file() or p.is_symlink():
        p.unlink()
      elif p.is_dir():
        shutil.rmtree(p)
    except Exception:
      pass


def worker_process(saved_path: Path, source_type: str = "file"):
  update_status("processing")
  with lock:
    status["err"] = None
    status["json"] = None
    status["source"] = source_type

  try:
    output_path = OUTPUT_DIR / OUTPUT_NAME

    result_path = create_json(str(saved_path), str(output_path))

    time.sleep(1)

    update_status("ready")

    json_exists = False

    if result_path and Path(result_path).exists():
      json_exists = True
      json_path = Path(result_path)
    elif output_path.exists():
      json_exists = True
      json_path = output_path
    else:
      json_files = list(OUTPUT_DIR.glob("*.json"))
      if json_files:
        json_exists = True
        json_path = json_files[0]

    if json_exists:
      try:
        with lock:
          status["state"] = "ready"
          status["json"] = json_path.name
          status["message"] = "Processing completed. JSON generated."
          print(f"JSON successfully generated: {json_path}")

      except json.JSONDecodeError as e:
        with lock:
          status["state"] = "error"
          status["err"] = f"Invalid JSON: {str(e)}"
          status["message"] = "Error: Invalid JSON."
    else:
      with lock:
        status["state"] = "error"
        status["err"] = "JSON file not generated - no file found"
        status["message"] = "Error: JSON not generated."

  except Exception as e:
    with lock:
      status["state"] = "error"
      status["json"] = None
      status["err"] = f"Processing error: {str(e)}"
      status["message"] = "Processing error."
    print("Detailed error:")
    print(traceback.format_exc())


def worker_process_youtube(youtube_url: str):
  update_status("downloading")
  with lock:
    status["err"] = None
    status["json"] = None
    status["source"] = "youtube"

  try:
    # Start YouTube download
    print(f"Starting YouTube download: {youtube_url}")

    # Clear directories before download
    _clear_directory(UPLOAD_DIR)
    _clear_directory(OUTPUT_DIR)

    # Download YouTube audio
    audio_path = download_youtube_audio(youtube_url, UPLOAD_DIR, INPUT_NAME)
    print(f"Audio downloaded at: {audio_path}")

    # Update status to processing
    update_status("processing")

    output_path = OUTPUT_DIR / OUTPUT_NAME
    result_path = create_json(str(audio_path), str(output_path))

    time.sleep(1)

    json_exists = False

    if result_path and Path(result_path).exists():
      json_exists = True
      json_path = Path(result_path)
    elif output_path.exists():
      json_exists = True
      json_path = output_path
    else:
      json_files = list(OUTPUT_DIR.glob("*.json"))
      if json_files:
        json_exists = True
        json_path = json_files[0]

    if json_exists:
      try:
        with lock:
          status["state"] = "ready"
          status["json"] = json_path.name
          status["message"] = "Processing completed. JSON generated."
          print(f"JSON successfully generated: {json_path}")

      except json.JSONDecodeError as e:
        with lock:
          status["state"] = "error"
          status["err"] = f"Invalid JSON: {str(e)}"
    else:
      with lock:
        status["state"] = "error"
        status["err"] = "JSON file not generated - no file found"

  except Exception as e:
    with lock:
      status["state"] = "error"
      status["json"] = None
      status["err"] = f"YouTube processing error: {str(e)}"
    print("Detailed error:")
    print(traceback.format_exc())


@app.route("/upload", methods=["POST", "OPTIONS"])
def upload():
  if request.method == "OPTIONS":
    return ("", 200)

  UPLOAD_DIR.mkdir(exist_ok=True, parents=True)
  OUTPUT_DIR.mkdir(exist_ok=True, parents=True)

  # File upload
  if "file" in request.files:
    f = request.files["file"]
    if not f or f.filename == "":
      return jsonify({"error": "empty file"}), 400

    filename = secure_filename(f.filename)
    if not _is_allowed(filename):
      return jsonify({"error": f"extension not allowed: {Path(filename).suffix}"}), 400

    ext = Path(filename).suffix.lower()
    saved_name = f"{INPUT_NAME}{ext}"
    saved_path = UPLOAD_DIR / saved_name

    with lock:
      _clear_directory(UPLOAD_DIR)
      _clear_directory(OUTPUT_DIR)
      status.update({"state": "queued", "json": None, "err": None})

    f.save(saved_path)

    t = Thread(target=worker_process, args=(saved_path, "file"), daemon=True)
    t.start()

    return jsonify({"ok": True}), 201

  # YouTube link upload
  elif "url" in request.form:
    youtube_url = request.form.get("url", "").strip()
    if not youtube_url:
      return jsonify({"error": "empty URL"}), 400

    if not validate_youtube_url(youtube_url):
      return jsonify({"error": "invalid YouTube URL"}), 400

    try:
      video_info = get_video_info(youtube_url)
      print(f"Processing video")
    except Exception as e:
      return jsonify({"error": f"Error accessing YouTube video: {str(e)}"}), 400

    with lock:
      _clear_directory(UPLOAD_DIR)
      _clear_directory(OUTPUT_DIR)
      status.update({"state": "queued", "json": None, "err": None})

    t = Thread(target=worker_process_youtube, args=(youtube_url,), daemon=True)
    t.start()

    return jsonify({"ok": True, "video_info": video_info}), 201

  else:
    return jsonify({"error": "no valid field found (file/url)"}), 400


@app.route("/check_file", methods=["GET"])
def check_file():
  with lock:
    s = {"state": status["state"],
         "json": status["json"], "err": status["err"]}
  return jsonify(s), 200


@app.route("/get_json", methods=["GET"])
def get_json():
  with lock:
    if status["state"] != "ready" or not status.get("json"):
      return jsonify({"error": "json not available", "status": status["state"]}), 404
    json_filename = status["json"]

  json_path = OUTPUT_DIR / json_filename
  if not json_path.exists():
    return jsonify({"error": "JSON file not found on server"}), 404

  return send_from_directory(str(OUTPUT_DIR.resolve()), json_filename, as_attachment=True)


@app.route("/get_audio", methods=["GET"])
def get_audio():
  with lock:
    if status["state"] != "ready":
      return jsonify({"error": "audio not available yet"}), 404
      
    audio_files = list(UPLOAD_DIR.glob("*.*"))
    if not audio_files:
        return jsonify({"error": "audio file not found"}), 404
        
    audio_path = audio_files[0]

  return send_from_directory(str(UPLOAD_DIR.resolve()), audio_path.name, as_attachment=True)


if __name__ == "__main__":
  startup_check()
  app.run(debug=True, host="0.0.0.0", port=5000)
