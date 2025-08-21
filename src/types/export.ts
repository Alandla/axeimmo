export interface IExport {
  id?: string;
  videoId: string;
  userId?: string;
  spaceId: string;
  renderId?: string;
  runId?: string;
  bucketName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  creditCost: number;
  renderCost?: number;
  errorMessage?: string;
  webhookUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}