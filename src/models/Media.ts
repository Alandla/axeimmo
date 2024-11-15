import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const mediaSchema = new mongoose.Schema({
    type: {
      type: String,
      validate(value: string) {
        return ["image", "video"].includes(value);
      },
    },
    show: {
      type: String,
      validate(value: string) {
        return ["full", "middle","hide"].includes(value);
      },
    },
    name: String,
    height: Number,
    width: Number,
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
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
  
);

mediaSchema.plugin(toJSON);

export default mediaSchema