export type FileToUpload = {
  file: File,
  type: "image" | "video" | "audio"
  usage: "voice" | "avatar" | "media" | "element"
}

export type UploadedFile = {
  id: string
  url: string
  name: string
  type: "image" | "video" | "audio"
  usage: "voice" | "avatar" | "media" | "element"
}
