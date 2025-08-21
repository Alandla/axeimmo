export interface ExtractedFrame {
  base64: string;
  timestamp: number;
  mimeType: string;
}

import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import os from "os";
import path from "path";
import axios from "axios";
import { logger } from "@trigger.dev/sdk";

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

/**
 * Redimensionne une image à 1080p pour réduire sa taille
 * @param imageUrl URL de l'image à redimensionner
 * @param maxWidth Largeur maximale (défaut: 1920px pour 1080p)
 * @param maxHeight Hauteur maximale (défaut: 1080px pour 1080p)
 * @returns Buffer de l'image redimensionnée
 */
export async function resizeImageTo1080p(
  imageUrl: string,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): Promise<Buffer> {
  const tempDirectory = os.tmpdir();
  const uniqueId = `resize_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const inputPath = path.join(tempDirectory, `input_${uniqueId}`);
  const outputPath = path.join(tempDirectory, `output_${uniqueId}.webp`);
  
  try {
    // Télécharger l'image
    console.log("Downloading image for resizing...");
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    await fs.writeFile(inputPath, Buffer.from(response.data));
    
    const stats = await fs.stat(inputPath);
    console.log(`Original image size: ${stats.size} bytes (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    
    // Redimensionner l'image avec ffmpeg
    console.log(`Resizing image to max ${maxWidth}x${maxHeight}...`);
    
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-vf', `scale='min(${maxWidth},iw)':'min(${maxHeight},ih)':force_original_aspect_ratio=decrease`, // Garde les proportions
          '-q:v', '100', // Qualité élevée pour préserver la qualité
          '-f', 'webp', // Format WebP pour une meilleure compression
        ])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
    
    // Vérifier la taille du fichier redimensionné
    const resizedStats = await fs.stat(outputPath);
    const resizedBuffer = await fs.readFile(outputPath);
    
    console.log(`Resized image size: ${resizedStats.size} bytes (${(resizedStats.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`Size reduction: ${((stats.size - resizedStats.size) / stats.size * 100).toFixed(1)}%`);
    
    return resizedBuffer;
    
  } finally {
    // Nettoyer les fichiers temporaires
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
  }
}

/**
 * Obtient la taille d'une image à partir de son URL sans la télécharger entièrement
 * @param imageUrl URL de l'image
 * @returns Taille du fichier en bytes
 */
export async function getImageFileSize(imageUrl: string): Promise<number> {
  try {
    const response = await axios.head(imageUrl);
    const contentLength = response.headers['content-length'];
    return contentLength ? parseInt(contentLength, 10) : 0;
  } catch (error) {
    console.error("Error getting image file size:", error);
    return 0;
  }
}

