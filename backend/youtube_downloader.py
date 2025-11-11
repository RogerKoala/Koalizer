import yt_dlp
from pathlib import Path
import logging
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def download_youtube_audio(url: str, output_dir: Path, filename: str = "youtube_audio") -> Path:
  """
  Downloads the audio from a YouTube video and saves it as a WAV file.

  Args:
      url (str): YouTube video URL
      output_dir (Path): Directory where the file will be saved
      filename (str): Base name of the output file (without extension)

  Returns:
      Path: Path to the downloaded audio file

  Raises:
      Exception: If there is an error during download or conversion
  """
  try:
    output_dir.mkdir(exist_ok=True, parents=True)
    output_path = output_dir / f"{filename}.wav"

    ydl_opts = {
        'outtmpl': str(output_dir / f"{filename}.%(ext)s"),
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'wav',
            'preferredquality': '0',
        }],
        'noplaylist': True,
        'quiet': False,
        'no_warnings': False,
    }

    logger.info(f"Starting YouTube download: {url}")

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
      info = ydl.extract_info(url, download=False)
      video_title = info.get('title', 'Unknown')
      duration = info.get('duration', 0)

      logger.info(f"Video title: {video_title}")
      logger.info(f"Duration: {duration} seconds")

      ydl.download([url])

    if not output_path.exists():
      possible_files = list(output_dir.glob(f"{filename}.*"))
      if possible_files:
        actual_file = possible_files[0]
        actual_file.rename(output_path)
        logger.info(f"File renamed from {actual_file} to {output_path}")
      else:
        raise Exception("Audio file was not created after download")

    logger.info(f"Download completed: {output_path}")
    return output_path

  except Exception as e:
    logger.error(f"YouTube download error: {str(e)}")
    raise Exception(f"YouTube download failed: {str(e)}")


def validate_youtube_url(url: str) -> bool:
  """
  Validates if the given URL is a valid YouTube link.

  Args:
      url (str): URL to validate

  Returns:
      bool: True if it is a valid YouTube URL
  """
  youtube_patterns = [
      r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})',
      r'(?:https?://)?(?:www\.)?youtu\.be/([a-zA-Z0-9_-]{11})',
      r'(?:https?://)?(?:www\.)?youtube\.com/embed/([a-zA-Z0-9_-]{11})',
      r'(?:https?://)?(?:www\.)?youtube\.com/v/([a-zA-Z0-9_-]{11})',
  ]

  for pattern in youtube_patterns:
    if re.match(pattern, url):
      return True

  return False


def get_video_info(url: str) -> dict:
  """
  Retrieves basic video information without downloading.

  Args:
      url (str): YouTube video URL

  Returns:
      dict: Video information (title, duration, etc.)
  """
  try:
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
      info = ydl.extract_info(url, download=False)

      return {
          'title': info.get('title', 'Unknown'),
          'duration': info.get('duration', 0),
          'uploader': info.get('uploader', 'Unknown'),
          'view_count': info.get('view_count', 0),
          'upload_date': info.get('upload_date', 'Unknown'),
      }

  except Exception as e:
    logger.error(f"Error retrieving video info: {str(e)}")
    raise Exception(f"Unable to retrieve video information: {str(e)}")
