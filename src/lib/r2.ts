import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const S3 = new S3Client({
  region: "auto",
  endpoint: `${process.env.CLOUDFLARE_URL}`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
  },
});

export async function getPresignedUrl(filename: string, mediaId: string, bucket: string) {
  const extension = filename.split('.').pop();

  try {
    const url = await getSignedUrl(S3, new PutObjectCommand({ Bucket: bucket, Key: `${mediaId}.${extension}` }))
    return { url, key: `${mediaId}.${extension}` }
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    throw error
  }
}