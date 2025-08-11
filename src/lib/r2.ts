import { DeleteObjectCommand, DeleteObjectCommandInput, PutObjectCommand, PutObjectCommandInput, S3, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

const s3Client = new S3Client({
  region: "auto",
  endpoint: `${process.env.CLOUDFLARE_URL}`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
  },
});

const s3 = new S3({
  region: "auto",
  endpoint: `${process.env.CLOUDFLARE_URL}`,
  credentials: {
      accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!
  },
});

export async function getPresignedUrl(filename: string, mediaId: string, bucket: string) {
  const extension = filename.split('.').pop();

  try {
    const url = await getSignedUrl(s3Client, new PutObjectCommand({ Bucket: bucket, Key: `${mediaId}.${extension}` }))
    return { url, key: `${mediaId}.${extension}` }
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    throw error
  }
}

export async function uploadToS3Audio(audio: any, bucket: string) {

  const videoId = uuidv4();
  let url = ''

  const params : PutObjectCommandInput = {
      Bucket: bucket,
      Key: `${videoId}.mp3`,
      Body: audio,
      ACL: 'public-read'
  };

  try {
      const response = await new Upload({
          client: s3,
          params
      }).done();
      const key = response?.Key || ''
      url = `https://media.hoox.video/${key}`
      return url;
  } catch (error: any) {
      console.error("Error uploading to S3:", error.message);
      throw error;
  }
}

export async function uploadToS3Image(image: any, bucket: string, fileName: string) {
  const params: PutObjectCommandInput = {
    Bucket: bucket,
    Key: `${fileName}.jpg`,
    Body: image,
    ContentType: 'image/jpeg',
    ACL: 'public-read'
  };

  try {
    const response = await new Upload({
      client: s3,
      params
    }).done();
    const key = response?.Key || '';
    const url = `https://media.hoox.video/${key}`;
    return { url };
  } catch (error: any) {
    console.error("Error uploading to S3:", error.message);
    throw error;
  }
}

export async function deleteFromS3(key: string, bucket: string) {
  
  const input: DeleteObjectCommandInput = {
    Bucket: bucket,
    Key: key
  }

  try {
    const response = await s3.send(new DeleteObjectCommand(input));
    return response;
  } catch (error) {
    console.error("Error deleting from S3:", error);
    throw error;
  }
}

export async function getKeyFromUrl(url: string) {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  return pathname.substring(1); // Enlève le / au début
}

export async function uploadImageFromUrlToS3(imageUrl: string, bucket: string, fileName: string) {
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    const { url: s3Url } = await uploadToS3Image(imageBuffer, bucket, fileName);
    return s3Url;
  } catch (error: any) {
    console.error("Error downloading and uploading image:", error.message);
    throw error;
  }
}

export async function uploadVideoFromUrlToS3(videoUrl: string, bucket: string, fileName: string) {
  try {
    const response = await fetch(videoUrl);
    const arrayBuffer = await response.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);

    const params: PutObjectCommandInput = {
      Bucket: bucket,
      Key: `${fileName}.mp4`,
      Body: videoBuffer,
      ContentType: 'video/mp4',
      ACL: 'public-read'
    };

    const uploadResponse = await new Upload({
      client: s3,
      params
    }).done();

    const key = uploadResponse?.Key || '';
    const url = `https://media.hoox.video/${key}`;
    return url;
  } catch (error: any) {
    console.error("Error downloading and uploading video:", error.message);
    throw error;
  }
}