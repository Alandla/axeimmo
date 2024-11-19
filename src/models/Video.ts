import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";
import sequenceSchema from "./Sequence";

// VIDEO SCHEMA
const videoSchema = new mongoose.Schema({
    spaceId: {
      type: mongoose.Schema.Types.ObjectId, // Référence à un espace
      ref: 'Space',
    },
    state: {
      type: {
        type: String,
        enum: ['pending', 'generating', 'done', 'exporting', 'error'],
        default: 'pending',
      },
      message: String,
    },
    title: String,
    style: {
      type: String,
      enum: ['Informative', 'Entertaining', 'Inspirational', 'Dramatic', 'Humorous', 'Educational', 'Mysterious', 'Relaxing'],
    },
    isNews: Boolean,
    runId: String,
    costToGenerate: Number,
    history: [{
      step: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      date: Date
    }],
    video: {
      audioUrl: String,
      thumbnail: String,
      metadata: {
        audio_duration: Number,
        number_of_distinct_channels: Number,
        billing_time: Number,
        transcription_time: Number,
      },
      sequences: [sequenceSchema]
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// add plugin that converts mongoose to json
videoSchema.plugin(toJSON);

export default mongoose.models.Video || mongoose.model("Video", videoSchema);