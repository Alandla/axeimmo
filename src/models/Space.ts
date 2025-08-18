import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";
import { MemberRole, PlanName, SubscriptionType } from "../types/enums";
import mediaSchema from "./Media";
import avatarSchema from "./Avatar";
import voiceSchema from "./Voice";

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
  storageLimit: {
    type: Number,
    default: 1 * 1024 * 1024 * 1024, // 1 GO par défaut pour le plan gratuit
  },
  imageToVideoLimit: {
    type: Number,
    default: 0,
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

// Schéma pour les détails de l'entreprise
const companyDetailsSchema = new mongoose.Schema({
  companyName: String,
  website: String,
  companyType: String,
  companySize: String,
  salesType: String,
  companyMission: String,
  companyTarget: String,
  companyNeeds: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// Schéma pour les clés API
const apiKeySchema = new mongoose.Schema({
  keyHash: String,
  keyPrefix: String, // Pour affichage (premiers 12 caractères)
  name: {
    type: String,
    default: 'Production'
  },
  lastUsedAt: Date,
  permissions: [{
    type: String,
    enum: [
      'video:generate',
      'video:export', 
      'resources:read',
      'webhooks:manage'
    ],
    default: ['video:generate', 'video:export', 'resources:read']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  revokedAt: Date,
  rateLimitPerMinute: {
    type: Number,
    default: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
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
    details: {
      type: companyDetailsSchema,
      default: () => ({}),
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
    videoIdeas: {
      type: [String],
      default: []
    },
    lastUsed: {
      voices: [],
      avatars: [],
      subtitles: [],
      formats: [],
      config: {}
    },
    usedStorageBytes: {
      type: Number,
      default: 0,
    },
    imageToVideoUsed: {
      type: Number,
      default: 0,
    },
    logo: {
      url: {
        type: String,
        trim: true,
      },
      position: {
        x: {
          type: Number,
          min: 0,
          max: 100,
          default: 85, // Position par défaut à droite
        },
        y: {
          type: Number,
          min: 0,
          max: 100,
          default: 10, // Position par défaut en bas
        },
      },
      show: {
        type: Boolean,
        default: true,
      },
      size: {
        type: Number,
        min: 0,
        max: 100,
        default: 19,
      },
    },
    apiKeys: [apiKeySchema]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

spaceSchema.plugin(toJSON);
mediaSpaceSchema.plugin(toJSON);

// Index pour optimiser les requêtes de validation des clés API
spaceSchema.index({ 
  'apiKeys.keyPrefix': 1, 
  'apiKeys.isActive': 1 
}, { 
  sparse: true,
  name: 'apikeys_validation_index'
});

export default mongoose.models.Space || mongoose.model("Space", spaceSchema);