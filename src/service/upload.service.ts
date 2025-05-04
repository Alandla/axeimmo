import { basicApiCall } from "@/src/lib/api";
import { FileToUpload, UploadedFile } from "../types/files";
import { IMedia } from "../types/video";
import { parseMedia } from '@remotion/media-parser';

export const uploadFiles = async (
    files: FileToUpload[], 
    updateStepProgress?: (stepName: string, progress: number) => void
) => {
    try {
        let completedFiles = 0
        const totalFiles = files.length

        // Utiliser Promise.all avec map pour collecter les résultats
        const results = await Promise.all(files.map(async (fileToUpload) => {
            const url = await getMediaUrlFromFileByPresignedUrl(fileToUpload.file)
            
            completedFiles++
            if (updateStepProgress) {
                const totalProgress = Math.round((completedFiles / totalFiles) * 100)
                updateStepProgress("MEDIA_UPLOAD", totalProgress)
            }

            let image, video, audio
            
            if (fileToUpload.type === "video") {

                const dimensions = await getMediaDimensions(url?.mediaUrl)

                video = {
                    id: url?.mediaId,
                    file_type: fileToUpload.file.type,
                    size: fileToUpload.file.size,
                    link: url?.mediaUrl,
                    ...(dimensions && { width: dimensions.width, height: dimensions.height })
                }
                
            } else if (fileToUpload.type === "image") {

                const dimensions = await getMediaDimensions(url?.mediaUrl)

                image = {
                    id: url?.mediaId,
                    ...(dimensions && { width: dimensions.width, height: dimensions.height }),
                    link: url?.mediaUrl
                }
            } else if (fileToUpload.type === "audio") {
                audio = {
                    id: url?.mediaId,
                    link: url?.mediaUrl
                }
            }

            return {
                type: fileToUpload.type,
                usage: fileToUpload.usage,
                name: fileToUpload.file.name,
                ...{image, video, audio}
            }
        }))

        return results.filter(Boolean) // Filtrer les résultats null éventuels
    } catch (error) {
        console.error('Erreur lors de l\'upload:', error)
        if (updateStepProgress) {
            updateStepProgress("MEDIA_UPLOAD", 0)
        }
        return []
    }
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

    const mediaUrl = `https://media.hoox.video/${key}`
    const mediaId = key.split('.')[0]

    return { mediaUrl, mediaId }
}

export const getMediaDimensions = async (url: string): Promise<{width: number, height: number} | null> => {
    try {
        const result = await parseMedia({
            src: url,
            fields: {
                dimensions: true,
            },
        });
        
        return result.dimensions || null;
    } catch (error) {
        console.error('Erreur lors de la récupération des dimensions:', error);
        return null;
    }
};