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
  costAvatar?: number;
  costTotal?: number;
  errorMessage?: string;
  webhookUrl?: string;
  avatarModel?: 'heygen' | 'heygen-iv' | 'omnihuman' | 'veo-3' | 'veo-3-fast';
  createdAt?: Date;
  updatedAt?: Date;
}