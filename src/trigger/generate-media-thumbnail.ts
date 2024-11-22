import { task } from "@trigger.dev/sdk/v3";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { uploadToS3Image } from '../lib/r2';
import { FileToUpload } from "../types/files";
import { v4 as uuidv4 } from 'uuid';

export const generateMediaThumbnail = task({
  id: "generate-media-thumbnail",
  run: async (payload: { media: FileToUpload, url: string }) => {
    const { url } = payload;
    const tempDirectory = os.tmpdir();
    const outputPath = path.join(tempDirectory, `thumbnail_${Date.now()}.jpg`);

    // Extraire la 5ème frame et redimensionner
    await new Promise((resolve, reject) => {
      ffmpeg(url)
        .screenshots({
          timestamps: ['0.5'],  // Prendre une frame à 0.5 seconde
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '720x?'  // Redimensionner à 480px de large, hauteur proportionnelle
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Lire l'image générée
    const thumbnailBuffer = await fs.readFile(outputPath);

    const imageId = uuidv4();
    
    // Upload vers S3
    const { url: thumbnailUrl } = await uploadToS3Image(thumbnailBuffer, 'medias-users', imageId);
    
    // Nettoyer le fichier temporaire
    await fs.unlink(outputPath);

    return {
      thumbnailUrl,
      imageId
    };
  },
});
