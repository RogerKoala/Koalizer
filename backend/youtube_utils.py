import subprocess
import requests
import logging
from shared import YTDLP_PATH

logger = logging.getLogger(__name__)


def get_ytdlp_current_version() -> str | None:
  """
  Get the currently installed yt-dlp version.

  Returns:
      str: Current version or None if it cannot be determined.
  """
  try:
    result = subprocess.run(
        [str(YTDLP_PATH), "--version"],
        capture_output=True,
        text=True,
        check=True,
        timeout=30
    )
    version = result.stdout.strip()
    return version
  except Exception as e:
    logger.error(f"Error getting yt-dlp version: {str(e)}")
    return None


def get_ytdlp_latest_version() -> str | None:
  """
  Get the latest yt-dlp version available on GitHub.

  Returns:
      str: Latest version (without leading 'v') or None if the check fails.
  """
  try:
    response = requests.get(
        "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest",
        timeout=30
    )
    response.raise_for_status()
    data = response.json()
    version = data["tag_name"].lstrip("v")
    return version
  except Exception as e:
    logger.error(f"Error getting latest yt-dlp version from GitHub: {str(e)}")
    return None


def update_ytdlp() -> bool:
  """
  Update yt-dlp to the latest version by invoking the binary with -U.

  Returns:
      bool: True if update succeeded, False otherwise.
  """
  try:
    logger.info("Updating yt-dlp...")
    result = subprocess.run(
        [str(YTDLP_PATH), "-U"],
        capture_output=True,
        text=True,
        timeout=60
    )

    if result.returncode == 0:
      logger.info(f"yt-dlp updated successfully: {result.stdout}")
      return True
    else:
      logger.warning(f"yt-dlp update failed: {result.stderr}")
      return False
  except Exception as e:
    logger.error(f"Error updating yt-dlp: {str(e)}")
    return False


def check_ytdlp_version(auto_update: bool = False) -> dict:
  """
  Check the installed yt-dlp version and compare it to the latest release.

  Args:
      auto_update (bool): If True, perform automatic update when a new version is available.

  Returns:
      dict: Information about the version check:
            {
                "current_version": str | None,
                "latest_version": str | None,
                "is_up_to_date": bool,
                "update_available": bool,
                "updated": bool
            }
  """
  logger.info("Checking yt-dlp version...")

  current_version = get_ytdlp_current_version()
  latest_version = get_ytdlp_latest_version()

  result = {
      "current_version": current_version,
      "latest_version": latest_version,
      "is_up_to_date": False,
      "update_available": False,
      "updated": False
  }

  if not current_version:
    logger.error("Could not determine current yt-dlp version")
    return result

  if not latest_version:
    logger.warning("Could not determine latest yt-dlp version from GitHub")
    # Assume up to date if latest cannot be determined
    result["is_up_to_date"] = True
    return result

  logger.info(f"Current yt-dlp version: {current_version}")
  logger.info(f"Latest yt-dlp version: {latest_version}")

  if current_version == latest_version:
    result["is_up_to_date"] = True
    logger.info("yt-dlp is up to date")
  else:
    result["update_available"] = True
    logger.warning(
      f"yt-dlp update available: {current_version} -> {latest_version}")

    if auto_update:
      logger.info("Auto-update enabled. Updating yt-dlp...")
      if update_ytdlp():
        result["updated"] = True
        result["is_up_to_date"] = True
        logger.info("yt-dlp updated successfully")
      else:
        logger.error("Failed to update yt-dlp")

  return result


def startup_check():
  """
  Function to be called during server startup.
  Checks yt-dlp version and optionally updates it.
  """
  logger.info("=== Starting yt-dlp version check ===")

  result = check_ytdlp_version(auto_update=True)

  if result["updated"]:
    logger.info("yt-dlp was updated to the latest version")
  elif result["is_up_to_date"]:
    logger.info("yt-dlp is already up to date")
  elif result["update_available"]:
    logger.warning(
        f"yt-dlp update available: {result['current_version']} -> {result['latest_version']}"
    )
    logger.warning("Run with auto_update=True to update automatically")

  logger.info("=== yt-dlp version check completed ===\n")

  return result
