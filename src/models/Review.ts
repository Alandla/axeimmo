import mongoose, { Schema } from 'mongoose';
import { IReview } from '../types/review';
import toJSON from './plugins/toJSON';

const reviewSchema = new Schema<IReview>(
  {
    userId: {
      type: String,
      required: true,
    },
    videoId: {
      type: String,
      required: true,
    },
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    review: {
      type: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// add plugin that converts mongoose to json
reviewSchema.plugin(toJSON);

export default mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);