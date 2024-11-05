export type UploadedFile = {
  file: File,
  type: "voice" | "avatar" | "media",
  label: string
}