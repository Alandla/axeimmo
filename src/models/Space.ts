import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";
import { MemberRole, PlanName, SubscriptionType } from "../types/enums";

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
    default: 0,
  },
});

const spaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    members: [memberSchema],
    plan: planSchema,
    credits: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

spaceSchema.plugin(toJSON);

export default mongoose.models.Space || mongoose.model("Space", spaceSchema);