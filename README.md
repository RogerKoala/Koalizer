<div align="center">
<img src="https://raw.githubusercontent.com/RogerKoala/Koalizer/main/frontend/src-tauri/icons/icon.png" width="150" alt="Koalizer Logo">

🇺🇸 English | 🇧🇷 Português

<b>Offline Speaker Diarization & Transcription Powerhouse</b>

<i>Built with Tauri, WhisperX, and Pyannote.audio</i>

[![Download](https://img.shields.io/badge/Download-Koalizer-blue?style=for-the-badge&logo=github)](https://github.com/RogerKoala/Koalizer/releases)

</div>

---

## 📖 Overview

**Koalizer** is a high-performance desktop application designed for researchers, journalists, and developers who need to process audio with maximum privacy. Unlike cloud-based solutions, Koalizer runs **entirely offline**, performing state-of-the-art transcription and speaker identification on your local hardware.

### 🚀 Key Capabilities

- **Transcription (WhisperX):** Sub-segmental precision using OpenAI's Whisper models.
- **Speaker Diarization (Pyannote):** Distinguish "Who spoke when" with high accuracy.
- **Word-level Alignment:** Forced alignment for perfectly synced timestamps.
- **YouTube Integration:** Seamlessly fetch and process content via `yt-dlp`.
- **Hardware Acceleration:** Full support for NVIDIA GPUs (CUDA) to speed up inference.

---

## 🛠️ Tech Stack

The project utilizes a **Sidecar Architecture**, separating the lightweight UI from the heavy-duty AI processing.

| Component         | Technology                                     |
| ----------------- | ---------------------------------------------- |
| **Frontend**      | React, TypeScript, Tailwind CSS                |
| **App Shell**     | Tauri v2 (Rust)                                |
| **AI Engine**     | Python 3.10, PyTorch, WhisperX, Pyannote.audio |
| **Inter-Process** | Flask-based Local API                          |

---

## 📂 Architecture & Directory Structure

```text
Koalizer/
├── frontend/             # Tauri + React Application
│   └── src-tauri/        # Rust backend & Sidecar config
├── backend/              # Python Intelligence
│   ├── app.py            # Flask Entry point
│   ├── models/           # Pyannote/Whisper local weights
│   └── bin/              # External binaries (FFmpeg, yt-dlp)
└── build.py              # Unified build automation script

```

---

## ⚡ Quick Start (Development)

### Prerequisites

- **C++ Build Tools:** Required for `pyannote.audio` and `whisperX` dependencies.
- **NVIDIA Drivers:** (Recommended) For CUDA acceleration.

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Win
pip install -r requirements.txt
python app.py

```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run tauri dev

```

---

## 📦 Production Build

Koalizer features a **"One-Click Build"** system that bundles the entire Python environment into a standalone binary using PyInstaller before wrapping it into the Tauri installer.

```bash
cd backend
python build.py

```

_This will generate a production-ready installer in `frontend/src-tauri/target/release/bundle/`._

---

## 📜 Acknowledgments & Citations

Koalizer is standing on the shoulders of giants. If you use this tool in academic research, please consider citing the underlying models:

- **Pyannote.audio:** Bredin et al. (2020) "pyannote.audio: neural building blocks for speaker diarization".
- **WhisperX:** Bain et al. (2022) "WhisperX: Time-Accurate Speech Transcription of Long Audio".

---

## 📄 License

This project is licensed under the MIT License. Note that the AI models (Pyannote/Whisper) are subject to their own respective licenses (MIT and Apache 2.0).

---

## 🎓 Academic Context

This project was developed as part of my undergraduate thesis (TCC).
The full thesis document is available in Portuguese only.
