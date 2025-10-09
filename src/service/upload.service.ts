import { basicApiCall } from "@/src/lib/api";
import { toast } from "@/src/hooks/use-toast";
import frMessages from "../../messages/fr.json";
import enMessages from "../../messages/en.json";
import { FileToUpload } from "../types/files";
import { Input, ALL_FORMATS, UrlSource } from 'mediabunny';

// Simple translation resolver without React context
function translate(key: string): string {
    const lang = typeof window !== 'undefined' ? (localStorage.getItem('lang') || navigator.language || 'en') : 'en';
    const locale = lang.toLowerCase().startsWith('fr') ? 'fr' : 'en';
    const messages: any = locale === 'fr' ? (frMessages as any) : (enMessages as any);
    return key.split('.').reduce((acc: any, k: string) => (acc && acc[k] !== undefined ? acc[k] : undefined), messages) || key;
}

export const uploadFiles = async (
    files: FileToUpload[], 
    updateStepProgress?: (stepName: string, progress: number) => void
) => {
    try {
        // Skip AVIF files, upload the rest
        const avifFiles: FileToUpload[] = []
        const filesToProcess = files.filter((f) => {
            const name = f.file?.name || "";
            const mime = (f.file as any)?.type || "";
            const isAvif = f.type === "image" && (mime === "image/avif" || /\.avif$/i.test(name));
            if (isAvif) avifFiles.push(f)
            return !isAvif;
        });

        if (filesToProcess.length === 0) {
            try { toast({ title: translate('errors.upload.avif-not-supported') }) } catch {}
            throw new Error('errors.upload.avif-not-supported');
        }

        // Notify user that some files were skipped
        if (avifFiles.length > 0) {
            try { toast({ title: translate('errors.upload.avif-partially-skipped') }) } catch {}
        }

        let completedFiles = 0
        const totalFiles = filesToProcess.length

        // Utiliser Promise.all avec map pour collecter les résultats
        const results = await Promise.all(filesToProcess.map(async (fileToUpload) => {
            const url = await getMediaUrlFromFileByPresignedUrl(fileToUpload.file)
            
            completedFiles++
            if (updateStepProgress) {
                const totalProgress = Math.round((completedFiles / totalFiles) * 100)
                updateStepProgress("MEDIA_UPLOAD", totalProgress)
            }

            let image, video, audio
            
            if (fileToUpload.type === "video") {

                const dimensions = await getVideoDimensions(url?.mediaUrl)

                video = {
                    id: url?.mediaId,
                    file_type: fileToUpload.file.type,
                    size: fileToUpload.file.size,
                    link: url?.mediaUrl,
                    ...(dimensions && { width: dimensions.width, height: dimensions.height })
                }
                
            } else if (fileToUpload.type === "image") {

                const dimensions = await getImageDimensions(url?.mediaUrl)

                image = {
                    id: url?.mediaId,
                    ...(dimensions && { width: dimensions.width, height: dimensions.height }),
                    link: url?.mediaUrl,
                    size: fileToUpload.file.size
                }
            } else if (fileToUpload.type === "audio") {
                audio = {
                    id: url?.mediaId,
                    link: url?.mediaUrl,
                    size: fileToUpload.file.size
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

export const getMediaUrlFromFileByPresignedUrl = async (
    file: File
) => {
    // Block AVIF at helper level as well (defense-in-depth)
    const fileName = file?.name || ""
    const fileMime = (file as any)?.type || ""
    if (fileMime === 'image/avif' || /\.avif$/i.test(fileName)) {
        try { toast({ title: translate('errors.upload.avif-not-supported') }) } catch {}
        throw new Error('errors.upload.avif-not-supported')
    }

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

export const getVideoDimensions = async (url: string): Promise<{width: number, height: number} | null> => {
    try {
        const input = new Input({
            source: new UrlSource(url),
            formats: ALL_FORMATS,
        });
        
        const tracks = await input.getTracks();
        const videoTrack = tracks.find(track => track.isVideoTrack());
        
        if (videoTrack && videoTrack.isVideoTrack()) {
            return {
                width: videoTrack.codedWidth,
                height: videoTrack.codedHeight
            };
        }
        
        return null;
    } catch (error) {
        console.error('Erreur lors de la récupération des dimensions avec MediaBunny:', error);
        return null;
    }
};

/**
 * Upload file using presigned URL
 */
export async function uploadFileWithPresignedUrl(
  file: File,
  presignedUrl: string
): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
}