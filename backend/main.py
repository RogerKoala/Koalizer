import subprocess
import re
import tempfile
import time
import json
from pathlib import Path
from pydub import AudioSegment, silence
import whisperx
import torch
import gc
from whisperx.diarize import DiarizationPipeline
import os

from shared import update_status, OUTPUT_DIR

FFMPEG_VOLUME_RE = re.compile(r"mean_volume:\s*(-?\d+(\.\d+)?) dB")


def probe_mean_volume(audio_path: str, offset_s: int, duration_s: int = 5) -> float | None:
  cmd = [
      "ffmpeg", "-hide_banner", "-nostats",
      "-ss", str(offset_s), "-t", str(duration_s),
      "-i", str(audio_path),
      "-af", "volumedetect",
      "-f", "null", "-"
  ]
  proc = subprocess.run(cmd, stderr=subprocess.PIPE,
                        stdout=subprocess.PIPE, text=True)
  stderr = proc.stderr
  m = FFMPEG_VOLUME_RE.search(stderr)
  if not m:
    return None
  return float(m.group(1))


def extract_clip(audio_path: str, offset_s: int, duration_s: int = 30, out_path: str | None = None) -> str:
  if out_path is None:
    tf = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    out_path = tf.name
    tf.close()
  cmd = [
      "ffmpeg", "-hide_banner", "-nostats",
      "-ss", str(offset_s), "-t", str(duration_s),
      "-i", str(audio_path),
      "-ar", "16000", "-ac", "1", "-y", str(out_path)
  ]
  subprocess.run(cmd, stderr=subprocess.DEVNULL,
                 stdout=subprocess.DEVNULL, check=True)
  return out_path


def detect_language_from_audio(audio_file, device, compute_type,
                               sample_duration=30,
                               probe_duration=3,
                               offsets=(30, 60, 120, 300, 600, 900),
                               volume_threshold_db=-45.0):
  """
  Fast language detection: probe small segments at predefined offsets.
  Extract the first segment with mean_volume > threshold for detection.
  """
  print("Detecting language: quick probes with ffmpeg...")
  audio_path = str(audio_file)
  chosen_clip = None

  # 1) try quick probes at offsets
  for off in offsets:
    mean_v = probe_mean_volume(
        audio_path, offset_s=off, duration_s=probe_duration)
    if mean_v is None:
      continue
    if mean_v > volume_threshold_db:
      # extract a larger sample for detection (sample_duration)
      chosen_clip = extract_clip(
          audio_path, offset_s=off, duration_s=sample_duration)
      break

  # 2) if nothing found, try the start as a fallback
  if chosen_clip is None:
    print("No loud segment found in offsets. Extracting from start.")
    chosen_clip = extract_clip(
        audio_path, offset_s=0, duration_s=sample_duration)

  # 3) detect language with a small model (only on the chosen clip)
  lang_model = whisperx.load_model("small", device, compute_type=compute_type)
  audio_data = whisperx.load_audio(str(chosen_clip))
  result = lang_model.transcribe(audio_data, batch_size=16)
  lang_code = result.get("language", None)

  # cleanup temporary clip and model
  try:
    os.remove(chosen_clip)
  except OSError:
    pass
  del lang_model
  gc.collect()
  if device == "cuda":
    torch.cuda.empty_cache()

  print(f"Detected language: {lang_code}")
  return lang_code


def process_audio_with_whisperx(audio_file):
  update_status("identifying_language")
  """
    Process the audio using WhisperX for transcription, alignment and diarization.
    """

  device = "cuda" if torch.cuda.is_available() else "cpu"
  batch_size = 16
  compute_type = "float16" if torch.cuda.is_available() else "int8"

  lang_code = detect_language_from_audio(audio_file, device, compute_type)

  update_status("transcribing")
  model = whisperx.load_model(
      "large-v2", device, compute_type=compute_type, language=lang_code)

  start_trans = time.time()
  audio = whisperx.load_audio(audio_file)

  result_asr = model.transcribe(audio, batch_size=batch_size)
  time_trans = time.time() - start_trans
  update_status(
      "aligning")

  # free ASR model resources
  del model
  gc.collect()
  if device == "cuda":
    torch.cuda.empty_cache()

  model_a, metadata = whisperx.load_align_model(
      language_code=lang_code, device=device)
  start_align = time.time()
  result_aligned = whisperx.align(
      result_asr["segments"], model_a, metadata, audio, device, return_char_alignments=False)
  time_align = time.time() - start_align
  update_status(
      "diarizing")

  # free alignment model resources
  del model_a
  gc.collect()
  if device == "cuda":
    torch.cuda.empty_cache()

  start_dia = time.time()
  diarize_model = DiarizationPipeline(
      model_name="models/pyannote_diarization_config.yaml", device=device)
  result_diarization = diarize_model(
      audio_file, min_speakers=None, max_speakers=None)
  time_dia = time.time() - start_dia
  update_status(
      "processing")

  result_final = whisperx.assign_word_speakers(
      result_diarization, result_aligned)

  print("Total processing completed")

  return result_final, time_trans, time_align, time_dia


def create_json(file_path, output_path):
  """
  Main function that orchestrates processing and JSON creation.
  """
  fp = Path(file_path)
  if not fp.exists():
    raise FileNotFoundError(f"File not found: {fp}")

  result_final, time_trans, time_align, time_dia = process_audio_with_whisperx(
      str(fp))

  transcription = []
  total_words = 0
  current_segment = None

  if 'segments' in result_final:
    for segment in result_final['segments']:
      text = segment.get('text', '').strip()
      if not text:
        continue

      speaker = segment.get('speaker', 'UNKNOWN')

      if current_segment and current_segment['speaker'] == speaker:
        current_segment['text'] += " " + text
        current_segment['end'] = segment['end']

        # Count words if present
        if 'words' in segment:
          total_words += len(segment['words'])
      else:
        if current_segment:
          current_segment['text'] = current_segment['text'][0].upper(
          ) + current_segment['text'][1:]
          transcription.append(current_segment)

        current_segment = {
            "start": segment['start'],
            "end": segment['end'],
            "speaker": speaker,
            "text": text
        }
        if 'words' in segment:
          total_words += len(segment['words'])

    if current_segment:
      current_segment['text'] = current_segment['text'][0].upper(
      ) + current_segment['text'][1:]
      transcription.append(current_segment)

  try:
    audio_data = AudioSegment.from_file(str(fp))
    total_seconds = len(audio_data) / 1000.0
  except Exception:
    total_seconds = transcription[-1]['end'] if transcription else 0
    print("WARNING: Could not load audio with pydub to get total duration. Using final timestamp.")

  hours = int(total_seconds // 3600)
  minutes = int((total_seconds % 3600) // 60)
  seconds = int(total_seconds % 60)
  total_audio_time = f"{hours:02}:{minutes:02}:{seconds:02}"

  if output_path is None:
    out_path = OUTPUT_DIR / f"{fp.stem}.json"
  else:
    out_path = Path(output_path)

  out_path.parent.mkdir(parents=True, exist_ok=True)

  output = {
      "aligned_transcription": [s for s in transcription if s["text"].strip()],
      "durations": {
          "transcription_seconds": time_trans,
          "alignment_seconds": time_align,
          "diarization_seconds": time_dia,
          "total_words": total_words,
          "total_time": total_audio_time,
          "audio_file": fp.name
      },
  }

  with open(out_path, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

  print(f"Output JSON file created at: {out_path}")
  return str(out_path)
