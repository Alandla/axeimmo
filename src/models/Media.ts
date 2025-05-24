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
    description: {
      type: [{
        start: Number,
        duration: {
          type: Number,
          required: false,
        },
        text: {
          type: String,
          default: ''
        }
      }],
      default: [{ start: 0, text: '' }]
    },
    position: {
      x: Number,
      y: Number,
    },
    video: {
      id: String,
      quality: String,
      file_type: String,
      size: Number,
      width: Number,
      height: Number,
      fps: Number,
      link: String,
      frames: {
        type: [String],
        default: []
      },
      durationInSeconds: Number,
    },
    image: {
      id: String,
      link: String,
      width: Number,
      height: Number,
      size: Number,
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