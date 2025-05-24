export interface ExtractedFrame {
  base64: string;
  timestamp: number;
  mimeType: string;
}

import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import os from "os";
import path from "path";

/**
 * Extrait des frames d'une vidéo à intervalle régulier (1 frame par seconde)
 * Les frames sont retournées en base64 pour être utilisées directement avec un LLM
 * @param videoUrl URL de la vidéo à analyser
 * @returns Un tableau d'objets contenant les frames en base64 et leurs timestamps
 */
export async function extractFramesFromVideo(videoUrl: string): Promise<ExtractedFrame[]> {
  // Créer un identifiant unique basé sur l'URL de la vidéo et un timestamp
  const videoHash = Buffer.from(videoUrl).toString('base64').replace(/[/+=]/g, '_').substring(0, 15);
  const uniqueId = `${videoHash}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const tempDirectory = os.tmpdir();
  const outputDirectory = path.join(tempDirectory, `frames_${uniqueId}`);
  
  // Créer le dossier temporaire
  await fs.mkdir(outputDirectory, { recursive: true });
  
  try {
    
    // Extraire les frames
    await new Promise((resolve, reject) => {
      ffmpeg(videoUrl)
        .fps(1) // 1 frame par seconde
        .size('320x?') // Redimensionner à 320px de large, hauteur proportionnelle
        .outputOptions([
          '-frame_pts', '1', // Ajouter le timestamp dans le nom du fichier
          '-q:v', '2' // Qualité d'image (2 est un bon compromis entre qualité et taille)
        ])
        .output(path.join(outputDirectory, 'frame-%d.jpg'))
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
    
    // Lister tous les fichiers générés
    const files = await fs.readdir(outputDirectory);
    const frameFiles = files
      .filter(file => file.startsWith('frame-') && file.endsWith('.jpg'))
      // Ignorer la première frame qui est dupliquée
      .sort((a, b) => {
        const numA = parseInt(a.replace('frame-', '').replace('.jpg', ''));
        const numB = parseInt(b.replace('frame-', '').replace('.jpg', ''));
        return numA - numB;
      })
      .slice(1);
    
    // Convertir chaque frame en base64
    const framePromises = frameFiles.map(async (file) => {
      const filePath = path.join(outputDirectory, file);
      const frameBuffer = await fs.readFile(filePath);
      
      // Extraire le timestamp du nom du fichier (frame-X.jpg)
      const timestamp = parseInt(file.replace('frame-', '').replace('.jpg', ''));
      
      // Convertir en base64
      const base64 = frameBuffer.toString('base64');
      
      // Supprimer le fichier temporaire
      await fs.unlink(filePath);
      
      return {
        base64,
        timestamp,
        mimeType: 'image/jpeg'
      };
    });
    
    const frames = await Promise.all(framePromises);
    
    // Trier les frames par timestamp
    frames.sort((a, b) => a.timestamp - b.timestamp);
    
    return frames;
  } finally {
    // Nettoyer le dossier temporaire
    await fs.rm(outputDirectory, { recursive: true, force: true });
  }
}