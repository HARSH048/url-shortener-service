import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  urlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  userAgent: {
    browser: String,
    device: String,
    os: String
  },
  ipAddress: String,
  location: {
    country: String,
    region: String,
    city: String
  },
  referrer: String
}, {
  timestamps: true
});

export const Analytics = mongoose.model('Analytics', analyticsSchema);