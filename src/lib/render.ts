import { getRenderProgress, renderMediaOnLambda, speculateFunctionName } from '@remotion/lambda/client';

export const renderVideo = async (video: any) => {
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

export const getProgress = async (renderId: string, bucketName: string) => {
    const progress = await getRenderProgress({
        renderId: renderId,
        bucketName: bucketName,
        functionName: speculateFunctionName({
            diskSizeInMb: 10240,
            memorySizeInMb: 2048,
            timeoutInSeconds: 600,
        }),
        region: "eu-west-3",
    });

    console.log("errors", progress.errors);

    if (progress.fatalErrorEncountered) {
        return {
            status: "failed",
            message: progress.errors[0].message,
        };
    }

    if (progress.done) {
        return {
            status: "completed",
            videoUrl: progress.outputFile,
            size: progress.outputSizeInBytes,
            costs: progress.costs.accruedSoFar
        }
    }

    return {
        status: "processing",
        progress: Math.round(Math.max(0.03, progress.overallProgress) * 100)
    }

}