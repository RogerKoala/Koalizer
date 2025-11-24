import re
import shutil
import subprocess
import sys
import PyInstaller.__main__
import os
from PyInstaller.utils.hooks import collect_all, copy_metadata

APP_NAME = "Server"
MAIN_SCRIPT = "app.py"
TAURI_BIN_DIR = os.path.join("..", "Frontend", "src-tauri", "binaries")
FRONTEND_DIR = os.path.join("..", "Frontend")

libs_to_collect = [
    'whisperx',
    'pyannote.audio',
    'pyannote.database',
    'pyannote.pipeline',
    'lightning',
    'lightning_fabric',
    'lightning_utilities',
    'speechbrain'
]

datas = []
binaries = []
hiddenimports = []

print("Collecting complex dependencies...")
for lib in libs_to_collect:
  try:
    tmp_ret = collect_all(lib)
    datas += tmp_ret[0]
    binaries += tmp_ret[1]
    hiddenimports += tmp_ret[2]
    print(f" -> {lib} collected.")
  except Exception as e:
    print(f"WARNING: Error collecting {lib}: {e}")

metadata_libs = [
    'tqdm', 'regex', 'requests', 'packaging', 'filelock',
    'numpy', 'huggingface-hub', 'safetensors',
    'lightning', 'lightning_fabric', 'torch', 'torchaudio'
]

for lib in metadata_libs:
  try:
    datas += copy_metadata(lib)
  except Exception:
    pass

hiddenimports += [
    'sklearn.utils._cython_blas',
    'sklearn.neighbors.typedefs',
    'sklearn.neighbors.quad_tree',
    'sklearn.tree._utils',
    'scipy.special.cython_special',
    'scipy.linalg.cython_blas',
    'scipy.linalg.cython_lapack',
    'numpy',
    'torch',
    'torchaudio',
    'soundfile',
    'pandas',
    'engineio.async_drivers.threading',
    'lightning_fabric.plugins.environments.slurm',
    'lightning_fabric.strategies.fsdp',
]

args = [
    MAIN_SCRIPT,
    f'--name={APP_NAME}',
    '--noconfirm',
    '--clean',
    '--onefile',
    '--console',
    '--icon=assets/icon.ico'
]

sep = ';' if os.name == 'nt' else ':'


def get_folder_data(folder_name):
  datas = []
  if os.path.exists(folder_name):
    datas.append(f'--add-data={folder_name}{sep}{folder_name}')
  else:
    print(f"Error: Folder {folder_name} not found!")
  return datas


args += get_folder_data('models')


if os.path.exists('bin'):
  args.append(f'--add-binary=bin/ffmpeg.exe{sep}bin')
  args.append(f'--add-binary=bin/yt-dlp.exe{sep}bin')

for src, dest in datas:
  args.append(f'--add-data={src}{sep}{dest}')

for src, dest in binaries:
  args.append(f'--add-binary={src}{sep}{dest}')

for hidden in hiddenimports:
  args.append(f'--hidden-import={hidden}')


def get_rust_target_triple():
  try:
    result = subprocess.run(
      ['rustc', '-vV'], capture_output=True, text=True, check=True)
    match = re.search(r'host:\s+(\S+)', result.stdout)
    if match:
      return match.group(1)
  except Exception as e:
    print(f"Warning: Failed to detect Rust Triple automatically ({e}).")
    print("Using fallback for Windows x64.")
  return "x86_64-pc-windows-msvc"


if __name__ == '__main__':
  print("--- STARTING BUILD ---")
  PyInstaller.__main__.run(args)
  print("--- PYINSTALLER FINISHED. MOVING TO TAURI ---")

  target_triple = get_rust_target_triple()
  print(f"Detected Target Triple: {target_triple}")

  extension = ".exe" if os.name == 'nt' else ""
  original_filename = f"{APP_NAME}{extension}"
  new_filename = f"{APP_NAME}-{target_triple}{extension}"

  current_dir = os.getcwd()
  dist_path = os.path.join(current_dir, "dist", original_filename)
  dest_dir_abs = os.path.abspath(os.path.join(current_dir, TAURI_BIN_DIR))
  dest_path = os.path.join(dest_dir_abs, new_filename)

  if not os.path.exists(dist_path):
    print(f"ERROR: File not found: {dist_path}")
    sys.exit(1)

  if not os.path.exists(dest_dir_abs):
    print(f"Creating destination directory: {dest_dir_abs}")
    os.makedirs(dest_dir_abs)

  try:
    shutil.move(dist_path, dest_path)
    print("SUCCESS")
    print("File moved and renamed to:")
    print(f" -> {dest_path}")
    print(
      "Configure your tauri.conf.json with: 'externalBin': ['binaries/{APP_NAME}']")
  except Exception as e:
    print(f"ERROR moving file: {e}")

  print("--- BUILD FINISHED ---")

  print("\n--- STARTING TAURI BUILD ---")

  npm_cmd = "npm.cmd" if os.name == 'nt' else "npm"
  frontend_dir_abs = os.path.abspath(os.path.join(current_dir, FRONTEND_DIR))

  try:
    print(f"Running '{npm_cmd} run tauri build' in {frontend_dir_abs}...")

    subprocess.run(
        [npm_cmd, "run", "tauri", "build"],
        cwd=frontend_dir_abs,
        check=True
    )

    print("\n TAURI BUILD FINISHED SUCCESSFULLY!")
  except subprocess.CalledProcessError as e:
    print(f"\n TAURI BUILD FAILED: {e}")
    sys.exit(1)
  except FileNotFoundError:
    print(f"\nERROR: '{npm_cmd}' not found. Is Node.js installed?")
    sys.exit(1)
