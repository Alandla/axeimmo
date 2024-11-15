import mongoose from "mongoose";

const wordSchema = new mongoose.Schema({
  word: String,
  start: Number,
  end: Number,
  confidence: Number,
  durationInFrames: Number,
});

export default wordSchema