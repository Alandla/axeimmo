import { basicApiCall } from "@/src/lib/api";
import { FileToUpload, UploadedFile } from "../types/files";

export const uploadFiles = async (files: FileToUpload[], updateStepProgress: (stepId: number, progress: number) => void) => {
    let uploadedFiles: UploadedFile[] = []
    try {
        let completedFiles = 0
        const totalFiles = files.length

        // Upload tous les fichiers en parallèle avec suivi de progression
        const uploadPromises = files.map(async (fileToUpload) => 
            getMediaUrlFromFileByPresignedUrl(fileToUpload.file)
            .then(url => {
                completedFiles++
                const totalProgress = Math.round((completedFiles / totalFiles) * 100)
                updateStepProgress(0, totalProgress)

                const type = fileToUpload.file.type.startsWith('image/') ? "image" : fileToUpload.file.type.startsWith('video/') ? "video" : "audio"

                uploadedFiles.push({
                    url: url?.mediaUrl,
                    id: url?.mediaId,
                    name: fileToUpload.file.name,
                    usage: fileToUpload.type,
                    type: type,
                    label: fileToUpload.label
                })
            })
        )

        // Attendre que tous les uploads soient terminés
        await Promise.all(uploadPromises)

    } catch (error) {
        console.error('Erreur lors de l\'upload:', error)
        updateStepProgress(0, 0)
    }

    return uploadedFiles
}

export const getMediaUrlFromFileByPresignedUrl = async (file: File) => {

    let responsePresignedUrl
    console.log('start upload of file: ', file.name)

    try {
        responsePresignedUrl = await basicApiCall("/media/getPresignedUrl", { filename: file.name, bucket: 'medias-users' })
        console.log('Response:', responsePresignedUrl)
    } catch (error) {
        console.error('Erreur:', error)
        throw error
    }

    const { url, key } = responsePresignedUrl as { url: string, key: string }

    const upload = await fetch(url, {
        method: 'PUT',
        body: file,
    })

    if (!upload.ok) {
        throw new Error("Error during upload")
    }

    const mediaUrl = `${url}${key}`
    const mediaId = key.split('.')[0]

    return { mediaUrl, mediaId }
}