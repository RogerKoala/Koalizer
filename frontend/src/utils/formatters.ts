export const countWords = (text: string): number => {
 if (!text) return 0;
 return text.trim().split(/\s+/).filter(Boolean).length;
};

export const formatSecondsToHMS = (seconds: number): string => {
 const totalSeconds = Math.floor(seconds);
 const hours = Math.floor(totalSeconds / 3600);
 const minutes = Math.floor((totalSeconds % 3600) / 60);
 const remainingSeconds = totalSeconds % 60;

 const paddedHours = hours.toString().padStart(2, "0");
 const paddedMinutes = minutes.toString().padStart(2, "0");
 const paddedSeconds = remainingSeconds.toString().padStart(2, "0");

 return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
};

export const formatTime = (seconds: number): string => {
 const totalSeconds = Math.floor(seconds);
 const hours = Math.floor(totalSeconds / 3600);
 const minutes = Math.floor((totalSeconds % 3600) / 60);
 const remainingSeconds = totalSeconds % 60;

 const paddedHours = hours.toString().padStart(2, "0");
 const paddedMinutes = minutes.toString().padStart(2, "0");
 const paddedSeconds = remainingSeconds.toString().padStart(2, "0");

 return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
};

export const parseTimeToSeconds = (timeString: string): number => {
 const parts = timeString.split(":").map((p) => parseInt(p, 10));
 if (parts.length === 3) {
  const [hours, minutes, seconds] = parts;
  return hours * 3600 + minutes * 60 + seconds;
 }
 return 0;
};
