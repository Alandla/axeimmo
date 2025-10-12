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
  avatarModel?: 'heygen' | 'heygen-iv' | 'omnihuman';
  createdAt?: Date;
  updatedAt?: Date;
}