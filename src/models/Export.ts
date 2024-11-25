import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const exportSchema = new mongoose.Schema(
  {
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'video',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    spaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Space',
      required: true,
    },
    renderId: {
      type: String,
      required: false,
    },
    runId: {
      type: String,
      required: false,
    },
    bucketName: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    downloadUrl: {
      type: String,
      required: false,
    },
    creditCost: {
      type: Number,
      required: true,
    },
    renderCost: {
      type: Number,
      required: false,
    },
    errorMessage: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// add plugin that converts mongoose to json
exportSchema.plugin(toJSON);

const Export = mongoose.models.Export || mongoose.model("Export", exportSchema);

export default Export;
