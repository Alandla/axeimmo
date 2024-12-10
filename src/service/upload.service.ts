import { basicApiCall } from "@/src/lib/api";
import { FileToUpload, UploadedFile } from "../types/files";
import { IMedia } from "../types/video";

export const uploadFiles = async (
    files: FileToUpload[], 
    updateStepProgress?: (stepName: string, progress: number) => void
) => {
    let uploadedFiles: IMedia[] = []
    try {
        let completedFiles = 0
        const totalFiles = files.length

        // Upload tous les fichiers en parallèle avec suivi de progression
        const uploadPromises = files.map(async (fileToUpload) => 
            getMediaUrlFromFileByPresignedUrl(fileToUpload.file)
            .then(async (url) => {
                completedFiles++
                if (updateStepProgress) {
                    const totalProgress = Math.round((completedFiles / totalFiles) * 100)
                    updateStepProgress("MEDIA_UPLOAD", totalProgress)
                }

                let image
                let video
                
                if (fileToUpload.type === "video") {

                    const thumbnail : any = await basicApiCall("/trigger/generateMediaThumbnail", {
                        url: url?.mediaUrl
                    })

                    const { thumbnailUrl, imageId } = thumbnail.output

                    const dimensionsVideo = await getVideoDimensions(url?.mediaUrl)
                    const dimensionsImage = await getImageDimensions(thumbnailUrl)

                    video = {
                        id: url?.mediaId,
                        file_type: fileToUpload.file.type,
                        size: fileToUpload.file.size,
                        width: dimensionsVideo.width,
                        height: dimensionsVideo.height,
                        link: url?.mediaUrl,
                    }

                    image = {
                        id: imageId,
                        width: dimensionsImage.width,
                        height: dimensionsImage.height,
                        link: thumbnailUrl
                    }
                } else if (fileToUpload.type === "image") {

                    const dimensionsImage = await getImageDimensions(url?.mediaUrl)

                    image = {
                        id: url?.mediaId,
                        width: dimensionsImage.width,
                        height: dimensionsImage.height,
                        link: url?.mediaUrl
                    }
                }

                uploadedFiles.push({
                    type: fileToUpload.type,
                    usage: fileToUpload.usage,
                    name: fileToUpload.file.name,
                    label: fileToUpload.label,
                    ...{image, video}
                })
            })
        )

        // Attendre que tous les uploads soient terminés
        await Promise.all(uploadPromises)

    } catch (error) {
        console.error('Erreur lors de l\'upload:', error)
        if (updateStepProgress) {
            updateStepProgress("MEDIA_UPLOAD", 0)
        }
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

    const mediaUrl = `https://media.hoox.video/${key}`
    const mediaId = key.split('.')[0]

    return { mediaUrl, mediaId }
}

export const getImageDimensions = async (url: string): Promise<{width: number, height: number}> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => resolve({ width: 800, height: 600 }); // Valeurs par défaut en cas d'erreur
        img.src = url;
    });
};

const getVideoDimensions = (url: string): Promise<{width: number, height: number}> => {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
            resolve({
                width: video.videoWidth,
                height: video.videoHeight
            });
            video.remove(); // Nettoie l'élément vidéo
        };
        
        video.onerror = () => {
            resolve({ width: 0, height: 0 }); // Valeurs par défaut en cas d'erreur
            video.remove();
        };

        video.src = url;
    });
};