import mongoose from "mongoose";
import mediaSchema from "./Media";
import wordSchema from "./Word";

const sequenceSchema = new mongoose.Schema({
  words: [wordSchema],
  text: String,
  start: Number,
  end: Number,
  durationInFrames: Number,
  audioIndex: Number,
  media: mediaSchema,
});

export default sequenceSchema