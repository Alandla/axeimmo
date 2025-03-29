import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";
import sequenceSchema from "./Sequence";

// VIDEO SCHEMA
const videoSchema = new mongoose.Schema({
    spaceId: {
      type: mongoose.Schema.Types.ObjectId, // Référence à un espace
      ref: 'Space',
    },
    archived: {
      type: Boolean,
      default: false,
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
      thumbnail: String,
      transitions: [{
        indexSequenceBefore: Number,
        durationInFrames: Number,
        video: String,
        thumbnail: String,
        sound: String,
        volume: Number,
        fullAt: Number,
        soundPeakAt: Number,
        category: String,
        mode: {
          type: String,
          enum: ['hard-light', 'lighten'],
          default: 'hard-light'
        }
      }],
      audio: {
        voices: [{
          url: String,
          index: Number,
          start: Number,
          end: Number,
          durationInFrames: Number,
          voiceId: String,
          startOffset: {
            type: Number,
            default: 0
          }
        }],
        volume: Number,
        music: {
          name: String,
          url: String,
          volume: Number,
          genre: String,
        }
      },
      subtitle: {
        name: String,
        style: Object
      },
      metadata: {
        audio_duration: Number,
        number_of_distinct_channels: Number,
        billing_time: Number,
        transcription_time: Number,
      },
      sequences: [sequenceSchema],
      avatar: {
        id: String,
        name: String,
        thumbnail: String,
        previewUrl: String,
        videoUrl: String,
        format: {
          type: String,
          enum: ['vertical', 'horizontal']
        },
        settings: {
          heygenType: { type: String, enum: ['avatar', 'talking_photo'] },
          position: Number,
          verticalPosition: Number,
        }
      }
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