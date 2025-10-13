import mongoose from 'mongoose';
import toJSON from './plugins/toJSON';

const avatarSchema = new mongoose.Schema({
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    looks: [
      {
        id: String,
        name: String,
        place: String,
        tags: [String],
        thumbnail: String,
        previewUrl: String,
        videoUrl: String,
        renders: {
          type: [
            {
              audioIndex: Number,
              startInFrames: Number,
              url: String,
            },
          ],
          default: undefined
        },
        format: { type: String, enum: ['vertical', 'horizontal'] },
        settings: {
          heygenType: { type: String, enum: ['avatar', 'talking_photo'] },
          position: Number,
          verticalPosition: Number,
          scale: Number,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

avatarSchema.plugin(toJSON);

export default avatarSchema