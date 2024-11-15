import mongoose from "mongoose";
import mediaSchema from "./Media";
import wordSchema from "./Word";

const sequenceSchema = new mongoose.Schema({
  words: [wordSchema],
  text: String,
  start: Number,
  end: Number,
  durationInFrames: Number,
  keywords: [{
    search: {
      type: String,
      validate(value: string) {
        return ["stock", "web"].includes(value);
      },
    },
    keyword: String,
    precision: {
      type: String,
      validate(value: string) {
        return ["HARD", "NORMAL", "EASY"].includes(value);
      },
    },
  }],
  media: mediaSchema,
});

export default sequenceSchema