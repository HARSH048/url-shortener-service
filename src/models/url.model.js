import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  longUrl: {
    type: String,
    required: true
  },
  shortCode: {
    type: String,
    required: true,
    unique: true
  },
  topic: {
    type: String,
    enum: ['acquisition', 'activation', 'retention', 'other'],
    default: 'other'
  },
  clicks: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export const Url = mongoose.model('Url', urlSchema);