export interface TranscriptionSegment {
 start: number;
 end: number;
 text: string;
 speaker: string;
 isDeleted?: boolean;
 deletedBySpeaker?: boolean;
 audioSegmentFile?: string;
 manuallyAdded?: boolean;
}

export interface Durations {
 total_seconds: number;
 total_time: string;
 transcription_seconds: number;
 alignment_seconds: number;
 diarization_seconds: number;
 total_words: number;
}

export interface TranscriptionResponse {
 aligned_transcription: TranscriptionSegment[];
 durations: Durations;
}

export interface SavedAppState {
 version: string;
 fileName: string;
 savedAt: string;
 transcriptionData: TranscriptionResponse;
 speakerNameMap: { [key: string]: string };
 speakerColorMap: {
  [key: string]: { bg: string; bgUser: string; text: string; border: string };
 };
 editableDurations: Durations;
 deletedSpeakers: string[];
}
