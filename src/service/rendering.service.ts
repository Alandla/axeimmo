import { basicApiCall } from "../lib/api";
import { IExport } from "../types/export";
import { IVideo } from "../types/video";

type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

const uploadGoogleImagesToS3 = async (video: IVideo) => {
  if (video.video) {
    for (const sequence of video.video.sequences) {
      if (sequence.media?.type === "image" && !sequence.media?.image?.link.startsWith('https://media.hoox.video/')) {
        try {
          const url : string = await basicApiCall('/create/uploadImage', { url: sequence.media?.image?.link });

          if (sequence.media && sequence.media.image) {
            sequence.media.image.link = url;
          }
        } catch (error) {
          console.log(error)
          console.error('Erreur lors de l\'upload de l\'image sur S3:', error);
        }
      }
    }
  }
  return video;
}

const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const pollExportStatus = async (renderId: string, bucketName: string, video: IVideo, exportData: IExport, setProgress: (progress: number) => void, setStatus: (status: ExportStatus) => void, setDownloadUrl: (url: string) => void) => {
    let attempts = 0; // Compteur de tentatives pour éviter de boucler indéfiniment
    const maxAttempts = 100; // Limite le nombre de tentatives pour éviter de boucler indéfiniment
    const delayBetweenAttempts = 2000; // Délai en millisecondes (2000 ms = 2 secondes)
    let downloadUrl = '';
    let firstAttempt = true
  
    while (attempts < maxAttempts) {
      console.log("Attempt number: ", attempts)
      try {
        const response : { status: ExportStatus, progress: number, videoUrl: string } = await basicApiCall('/export/progress', { renderId, bucketName, spaceId: exportData.spaceId, creditCost: exportData.creditCost });
        console.log("Progress: ", response)

        if (response) {

          setProgress(response.progress)
          setStatus(response.status)

          if (response.status === 'completed') {
            downloadUrl = response.videoUrl
            break;
          }
          if (response.status === 'failed') {
            if (firstAttempt) {
                const newVideo = await uploadGoogleImagesToS3(video);
                const renderResult : { renderId: string, bucketName: string } = await basicApiCall('/export/start', { video: newVideo, exportId: exportData.id });
                
                if (renderResult) {
                  bucketName = renderResult.bucketName
                  renderId = renderId
                }
                firstAttempt = false
                setProgress(0)
            } else {
              break
            }
          }
        }
  
        // Si le statut n'est pas "done", attendre avant de réessayer
        await sleep(delayBetweenAttempts);
        attempts++;
      } catch (error) {
        console.error('Error checking export progress:', error);
        await sleep(delayBetweenAttempts);
        attempts++;
      }
    }
  
    return downloadUrl;
};