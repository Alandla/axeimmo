export enum Steps {
  MEDIA_UPLOAD = "MEDIA_UPLOAD",
  VOICE_GENERATION = "VOICE_GENERATION",
  TRANSCRIPTION = "TRANSCRIPTION",
  AVATAR_GENERATION = "AVATAR_GENERATION",
  SEARCH_MEDIA = "SEARCH_MEDIA",
}

export enum StepState {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export interface Step {
  id: number;
  name: Steps;
  state: StepState;
  progress: number;
}