import { logger, task } from "@trigger.dev/sdk/v3";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import fetch from "node-fetch";
import { Readable } from "node:stream";
import os from "os";
import path from "path";
import { uploadToS3Audio } from '../lib/r2';
import { ISequence } from "../types/video";

export const ffmpegExtractAudioSegments = task({
  id: "ffmpeg-extract-audio-segments",
  run: async (payload: { audioUrl: string, sequences: ISequence[] }) => {
    const { audioUrl, sequences } = payload;
    const tempDirectory = os.tmpdir();
    const results: ISequence[] = [];

    for (let i = 0; i < sequences.length; i++) {
      const response = await fetch(audioUrl);
      if (!response.body) {
        throw new Error("Failed to fetch audio");
      }

      const stream = Readable.from(response.body as any);

      const sequence = sequences[i];
      const outputPath = path.join(tempDirectory, `segment_${i}_${Date.now()}.wav`);

      // Extract segment
      await new Promise((resolve, reject) => {
        ffmpeg(stream)
          .setStartTime(sequence.start)
          .setDuration(sequence.end - sequence.start)
          .output(outputPath)
          .on('start', (commandLine) => {
            logger.log(`FFmpeg command: ${commandLine}`);
          })
          .on("end", resolve)
          .on("error", reject)
          .run();
      });

      // Read the extracted audio
      const audioBuffer = await fs.readFile(outputPath);
      logger.log(`Extracted segment ${i + 1}/${sequences.length}`, { 
        start: sequence.start,
        end: sequence.end,
        size: audioBuffer.length 
      });

      // Upload to R2
      const url = await uploadToS3Audio(audioBuffer, 'medias-users');
      
      // Add to results
      results.push({
        ...sequence,
        audioUrl: url
      });

      // Cleanup temp file
      await fs.unlink(outputPath);
    }

    return results;
  },
});
