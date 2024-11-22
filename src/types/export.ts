export interface IExport {
  id?: string;
  videoId: string;
  userId: string;
  spaceId: string;
  renderId?: string;
  bucketName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  creditCost: number;
  errorMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}