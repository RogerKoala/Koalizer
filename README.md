# Koalizer v0.1.1

🇺🇸 English | 🇧🇷 Português

<a name="english"></a>

## 🇺🇸 English

Koalizer is a powerful desktop application built with Tauri and Python designed for offline audio transcription, alignment, and speaker diarization. It leverages the power of WhisperX for accurate speech-to-text and Pyannote for speaker identification.

### ✨ Features

*   **Transcription:** High-accuracy transcription using OpenAI's Whisper (via WhisperX).
*   **Forced Alignment:** Aligns transcription timestamps to the audio word-by-word.
*   **Diarization:** Identifies and labels different speakers using Pyannote.audio.
*   **YouTube Downloader:** Built-in support to download and process audio directly from YouTube links using `yt-dlp`.
*   **Offline First:** Runs locally on your machine (requires downloading models once).
*   **Sidecar Architecture:** Uses a robust Python backend bundled as a sidecar executable.

### 🛠️ Tech Stack

*   **Frontend:** React, TypeScript, Tailwind CSS.
*   **Core:** Tauri v2 (Rust).
*   **Backend:** Python 3.10, Flask (API), PyTorch.
*   **AI Models:** WhisperX, Pyannote.
*   **Packaging:** PyInstaller (Backend), Tauri Bundler (App).

### ⚙️ Prerequisites

Before running or building, ensure you have:

*   Node.js & npm installed.
*   Rust installed (via `rustup`).
*   Python 3.10 or higher.
*   C++ Build Tools (Visual Studio) if on Windows (required for some Python libs).

### 📂 Project Structure

*   **frontend/:** Contains the React UI and Tauri configuration (`src-tauri`).
*   **backend/:** Contains the Flask server, AI logic, and build scripts.
*   **bin/:** Must contain `ffmpeg.exe` and `yt-dlp.exe` for the build process.
*   **models/:** Must contain Pyannote `config.yaml` and model files.

### 🚀 Development Setup

To run the application in development mode (Hot Reloading), you need two terminals.

#### 1. Backend Terminal

Navigate to the `Backend` folder and run the Flask server:

```bash
cd Backend
pip install -r requirements.txt
python app.py
```

The server will start at `http://127.0.0.1:5000`.

#### 2. Frontend Terminal

Navigate to the `Frontend` folder and start Tauri:

```bash
cd Frontend
npm install
npm run tauri dev
```

**Note:** In development mode (`npm run tauri dev`), the application does not automatically start the Python backend. You must run `python app.py` manually. The automatic sidecar execution is only enabled in the final build.

### 📦 Building for Production

We have an automated script that handles the complexity of compiling the Python environment, freezing dependencies, handling `_MEIPASS` paths, and bundling everything with Tauri.

1.  Ensure you have the `backend/bin` folder with `ffmpeg.exe` and `yt-dlp.exe`.
2.  Ensure you have the `backend/models` folder with Pyannote models.
3.  Run the automated build script from the `Backend` folder:

```bash
cd Backend
python build.py
```

What this script does:

*   Uses PyInstaller to compile `app.py` into a standalone executable.
*   Includes all complex dependencies (Torch, WhisperX, Pyannote, Certifi).
*   Moves and renames the executable to `frontend/src-tauri/binaries/`.
*   Automatically triggers `npm run tauri build` in the `Frontend` folder.

The final installer will be located in `frontend/src-tauri/target/release/bundle/`.

<a name="português"></a>

## 🇧🇷 Português

Koalizer é uma aplicação desktop desenvolvida com Tauri e Python, projetada para transcrição de áudio, alinhamento e diarização de locutores de forma offline. Utiliza o poder do WhisperX para transcrição precisa e Pyannote para identificação de quem está falando.

### ✨ Funcionalidades

*   **Transcrição:** Alta precisão usando OpenAI Whisper (via WhisperX).
*   **Alinhamento Forçado:** Alinha os timestamps da transcrição com o áudio palavra por palavra.
*   **Diarização:** Identifica e separa diferentes locutores usando Pyannote.audio.
*   **YouTube Downloader:** Suporte nativo para baixar e processar áudio diretamente de links do YouTube usando `yt-dlp`.
*   **Offline First:** Roda localmente na sua máquina (necessário baixar os modelos uma vez).
*   **Arquitetura Sidecar:** Utiliza um backend Python robusto empacotado como um executável auxiliar ("sidecar").

### 🛠️ Tecnologias

*   **Frontend:** React, TypeScript, Tailwind CSS.
*   **Core:** Tauri v2 (Rust).
*   **Backend:** Python 3.10, Flask (API), PyTorch.
*   **Modelos AI:** WhisperX, Pyannote.
*   **Empacotamento:** PyInstaller (Backend), Tauri Bundler (App).

### ⚙️ Pré-requisitos

Antes de rodar ou compilar, certifique-se de ter:

*   Node.js & npm instalados.
*   Rust instalado (via `rustup`).
*   Python 3.10 ou superior.
*   C++ Build Tools (Visual Studio) se estiver no Windows (necessário para algumas libs Python).

### 📂 Estrutura do Projeto

*   **frontend/:** Contém a UI em React e as configurações do Tauri (`src-tauri`).
*   **backend/:** Contém o servidor Flask, lógica de IA e scripts de build.
*   **bin/:** Deve conter `ffmpeg.exe` e `yt-dlp.exe` para o processo de build.
*   **models/:** Deve conter o `config.yaml` do Pyannote e arquivos de modelo.

### 🚀 Configuração de Desenvolvimento

Para rodar a aplicação em modo de desenvolvimento (Hot Reloading), você precisa de dois terminais.

#### 1. Terminal do Backend

Navegue até a pasta `Backend` e inicie o servidor Flask:

```bash
cd Backend
pip install -r requirements.txt
python app.py
```

O servidor iniciará em `http://127.0.0.1:5000`.

#### 2. Terminal do Frontend

Navegue até a pasta `Frontend` e inicie o Tauri:

```bash
cd Frontend
npm install
npm run tauri dev
```

**Nota:** No modo de desenvolvimento (`npm run tauri dev`), a aplicação não inicia automaticamente o backend Python. Você deve rodar `python app.py` manualmente. A execução automática do sidecar só acontece na build final.

### 📦 Compilando para Produção

Possuímos um script automatizado que lida com a complexidade de compilar o ambiente Python, congelar dependências, lidar com caminhos `_MEIPASS` e empacotar tudo com o Tauri.

1.  Certifique-se de que a pasta `backend/bin` contém `ffmpeg.exe` e `yt-dlp.exe`.
2.  Certifique-se de que a pasta `backend/models` contém os modelos do Pyannote.
3.  Execute o script de build automatizado a partir da pasta `Backend`:

```bash
cd Backend
python build.py
```

O que este script faz:

*   Usa PyInstaller para compilar `app.py` em um executável autônomo.
*   Inclui todas as dependências complexas (Torch, WhisperX, Pyannote, Certifi).
*   Move e renomeia o executável para `frontend/src-tauri/binaries/`.
*   Dispara automaticamente o `npm run tauri build` na pasta do Frontend.

O instalador final estará localizado em `frontend/src-tauri/target/release/bundle/`.
