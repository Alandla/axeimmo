import mongoose from 'mongoose';
import toJSON from './plugins/toJSON';

const voiceSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true, // Assurez-vous que chaque voix a une ID unique
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  language: {
    type: String,
    required: true,
  },
  age: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true,
  },
  accent: {
    type: String,
    trim: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  previewUrl: {
    type: String,
    trim: true,
  },
  voiceSettings: {
    stability: { type: Number, required: false },
    similarity_boost: { type: Number, required: false },
  },
});

export default voiceSchema