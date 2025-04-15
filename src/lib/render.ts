import { getRenderProgress, renderMediaOnLambda, speculateFunctionName, renderStillOnLambda } from '@remotion/lambda/client';

export const renderVideo = async (video: any, showWatermark: boolean = true) => {
    console.log("Rendering video, props:")
    console.log(video)
    return await renderMediaOnLambda({
        region: "eu-west-3",
        functionName: speculateFunctionName({
            diskSizeInMb: 10240,
            memorySizeInMb: 2048,
            timeoutInSeconds: 600
        }),
        serveUrl: process.env.REMOTION_SERVE_URL || '',
        composition: "videoGenerate",
        inputProps: {
            data: video,
            showWatermark
        },
        chromiumOptions: {
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
        },
        codec: "h264",
        imageFormat: "jpeg",
        privacy: "public",
        maxRetries: 3,
        deleteAfter: "7-days",
        downloadBehavior: {
            type: "download",
            fileName: video.title + ".mp4",
        }
    });
};

export const renderAudio = async (video: any) => {
    console.log("Rendering audio, props:")
    console.log(video)
    return await renderMediaOnLambda({
        region: "eu-west-3",
        functionName: speculateFunctionName({
            diskSizeInMb: 4096,
            memorySizeInMb: 2048,
            timeoutInSeconds: 300
        }),
        serveUrl: process.env.REMOTION_AUDIO_SERVE_URL || '',
        composition: "videoGenerate",
        inputProps: {
            data: video,
        },
        codec: "mp3",
        privacy: "public",
        maxRetries: 3,
        deleteAfter: "7-days",
        downloadBehavior: {
            type: "download",
            fileName: video.title + ".mp3",
        }
    });
};

export const getProgress = async (renderId: string, bucketName: string, isAudio: boolean = false) => {
    const progress = await getRenderProgress({
        renderId: renderId,
        bucketName: bucketName,
        functionName: speculateFunctionName({
            diskSizeInMb: isAudio ? 4096 : 10240,
            memorySizeInMb: 2048,
            timeoutInSeconds: isAudio ? 300 : 600,
        }),
        region: "eu-west-3",
    });

    if (progress.fatalErrorEncountered) {
        return {
            status: "failed",
            message: progress.errors[0].message,
        };
    }

    if (progress.done) {
        return {
            status: "completed",
            url: progress.outputFile,
            size: progress.outputSizeInBytes,
            costs: progress.costs.accruedSoFar
        }
    }

    return {
        status: "processing",
        progress: Math.round(Math.max(0.03, progress.overallProgress) * 100)
    }
}

export const generateThumbnail = async (video: any) => {
    try {
        const result = await renderStillOnLambda({
            region: "eu-west-3",
            functionName: speculateFunctionName({
                diskSizeInMb: 2048,
                memorySizeInMb: 2048,
                timeoutInSeconds: 60
            }),
            serveUrl: process.env.REMOTION_SERVE_URL || '',
            composition: "videoGenerate",
            scale: 0.5,
            inputProps: {
                data: video,
            },
            imageFormat: "jpeg",
            frame: 10,
            privacy: "public",
        });

        return result;
    } catch (error) {
        console.error("Error generating thumbnail:", error);
        throw error;
    }
};