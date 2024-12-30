import { logger, task } from "@trigger.dev/sdk/v3";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import fetch from "node-fetch";
import { Readable } from "node:stream";
import os from "os";
import path from "path";
import { uploadToS3Audio } from '../lib/r2';

interface AudioVoice {
    url?: string;
    voiceId?: string;
    index: number;
    startOffset?: number;
    start: number;
    end: number;
    durationInFrames: number;
  }

export const combineAudioVoices = task({
    id: "combine-audio-voices",
    run: async (payload: { voices: AudioVoice[] }) => {
      const { voices } = payload;
      const tempDirectory = os.tmpdir();
      const outputPath = path.join(tempDirectory, `combined_${Date.now()}.wav`);
      const inputFiles: string[] = [];
  
      logger.log("Début du traitement des voix", { voiceCount: voices.length });
  
      try {
        // Télécharger et préparer chaque fichier audio
        for (let i = 0; i < voices.length; i++) {
          const voice = voices[i];
          const duration = voice.durationInFrames / 60;
          const tempFilePath = path.join(tempDirectory, `voice_${i}_${Date.now()}.wav`);
          
          if (voice.url) {
            logger.log(`Téléchargement de l'audio ${i}`, { url: voice.url });
            const response = await fetch(voice.url);
            if (!response.body) {
              throw new Error(`Échec du téléchargement de l'audio ${i}`);
            }
            
            const stream = Readable.from(response.body as any);
            
            // Traitement de l'audio avec FFmpeg
            await new Promise((resolve, reject) => {
              let command = ffmpeg(stream)
                .duration(duration);
  
              if (voice.startOffset) {
                const startTime = voice.startOffset / 60;
                command = command.setStartTime(startTime);
              }
  
              command.output(tempFilePath)
                .on('start', (cmd) => logger.log(`Commande FFmpeg pour l'audio ${i}:`, { cmd }))
                .on('end', resolve)
                .on('error', reject)
                .run();
            });
          } else {
            // Créer un fichier de silence en utilisant le fichier pré-généré
            logger.log(`Création d'un silence pour l'audio ${i}`, { duration });
            const response = await fetch("https://media.hoox.video/silence.mp3");
            if (!response.body) {
              throw new Error(`Échec du chargement du fichier de silence`);
            }
            
            const stream = Readable.from(response.body as any);
            
            await new Promise((resolve, reject) => {
              ffmpeg(stream)
                .inputOptions(['-stream_loop', '-1'])
                .duration(duration)
                .output(tempFilePath)
                .on('start', (cmd) => logger.log(`Commande FFmpeg pour le silence ${i}:`, { cmd }))
                .on('end', resolve)
                .on('error', reject)
                .run();
            });
          }
          
          inputFiles.push(tempFilePath);
        }
  
        // Combiner tous les fichiers audio
        logger.log("Combinaison des fichiers audio");
        await new Promise( async (resolve, reject) => {
          // Créer un fichier de liste pour FFmpeg
          const listPath = path.join(tempDirectory, `list_${Date.now()}.txt`);
          const fileList = inputFiles.map(file => `file '${file}'`).join('\n');
          
          await fs.writeFile(listPath, fileList);

          ffmpeg()
            .input(listPath)
            .inputOptions(['-f', 'concat', '-safe', '0'])
            .outputOptions([
              '-acodec', 'pcm_s16le',
              '-ar', '44100',
              '-ac', '2'
            ])
            .toFormat('wav')
            .on('start', (cmd) => {
              logger.log('Commande FFmpeg:', { cmd });
            })
            .on('error', (err) => {
              logger.error('Erreur FFmpeg:', { error: err.message });
              reject(err);
            })
            .on('end', async () => {
              await fs.unlink(listPath); // Nettoyer le fichier de liste
              resolve(outputPath);
            })
            .save(outputPath);
        });
  
        // Upload vers R2
        const finalAudio = await fs.readFile(outputPath);
        logger.log("Upload du fichier audio combiné");
        const url = await uploadToS3Audio(finalAudio, 'medias-users');
  
        // Nettoyage
        await Promise.all([
          ...inputFiles.map(file => fs.unlink(file)),
          fs.unlink(outputPath)
        ]);
  
        return { url };
      } catch (error) {
        logger.error("Erreur lors de la combinaison des audios", { error });
        throw error;
      }
    }
  });