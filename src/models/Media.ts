import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const mediaSchema = new mongoose.Schema({
    type: {
      type: String,
      validate(value: string) {
        return ["image", "video", "audio"].includes(value);
      },
    },
    usage: {
      type: String,
      validate(value: string) {
        return ["voice", "avatar", "media"].includes(value);
      },
    },
    show: {
      type: String,
      required: false,
      default: "full",
      validate(value: string) {
        return ["full", "half", "hide"].includes(value);
      },
    },
    startAt: {
      type: Number,
      required: false,
      default: 0,
    },
    name: String,
    description: [
      {
        start: Number,
        duration: {
          type: Number,
          required: false,
        },
        text: String
      }
    ],
    video: {
      id: String,
      quality: String,
      file_type: String,
      size: Number,
      width: Number,
      height: Number,
      fps: Number,
      link: String,
    },
    image: {
      id: String,
      link: String,
      width: Number,
      height: Number,
    },
    audio: {
      id: String,
      link: String,
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
  
);

mediaSchema.plugin(toJSON);

export default mediaSchema