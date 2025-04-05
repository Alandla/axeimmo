import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// USER SCHEMA
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      private: true,
    },
    image: {
      type: String,
    },
    emailVerified: {
      type: Date,
    },
    options: {
      lang: {
        type: String,
        default: "en",
        validate: {
          validator: (v: string) => ["en", "fr"].includes(v),
          message: "Language must be either 'en' or 'fr'",
        },
      },
    },
    spaces: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Space",
      },
    ],
    checkAffiliate: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      required: false,
    },
    discoveryChannel: {
      type: String,
      required: false,
    },
    goal: {
      type: String,
      required: false,
    },
    hasFinishedOnboarding: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);

export default mongoose.models.User || mongoose.model("User", userSchema);
