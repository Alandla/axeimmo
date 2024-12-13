export type FileToUpload = {
  file: File,
  type: "image" | "video" | "audio"
  usage: "voice" | "avatar" | "media"
}

export type UploadedFile = {
  id: string
  url: string
  name: string
  type: "image" | "video" | "audio"
  usage: "voice" | "avatar" | "media"
}
