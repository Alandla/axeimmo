import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";
import { MemberRole, PlanName, SubscriptionType } from "../types/enums";
import mediaSchema from "./Media";
import avatarSchema from "./Avatar";
import voiceSchema from "./Voice";
import { subtitles } from "../config/subtitles.config";

// Schéma pour les membres
const memberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  roles: {
    type: String,
    enum: Object.values(MemberRole),
    required: true,
  },
});

// Schéma pour le plan
const planSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: Object.values(PlanName),
    required: true,
    default: PlanName.FREE,
  },
  customerId: String,
  priceId: String,
  subscriptionType: {
    type: String,
    enum: Object.values(SubscriptionType),
    required: true,
  },
  creditsMonth: {
    type: Number,
    required: true,
    default: 10,
  },
  nextPhase: {
    type: Date,
    required: true,
    default: () => {
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      return date;
    },
  },
});

const mediaSpaceSchema = new mongoose.Schema(
  {
    media: mediaSchema,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    uploadedAt: Date,
    autoPlacement: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
)

const spaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    members: [memberSchema],
    medias: [mediaSpaceSchema],
    plan: planSchema,
    credits: {
      type: Number,
      default: 10,
    },
    subtitleStyle: [
      {
        name: String,
        style: {
          type: Object
        }
      }
    ],
    avatars: [avatarSchema],
    voices: [voiceSchema],
    lastUsed: {
      voices: [],
      avatars: [],
      subtitles: []
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

spaceSchema.plugin(toJSON);
mediaSpaceSchema.plugin(toJSON);

export default mongoose.models.Space || mongoose.model("Space", spaceSchema);