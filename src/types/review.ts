export interface IReview {
  id?: string;
  userId: string;
  videoId: string;
  stars: number;
  review?: string;
  createdAt?: Date;
  updatedAt?: Date;
} 