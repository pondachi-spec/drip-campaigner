const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  channel: { type: String, enum: ['SMS', 'Email'], required: true },
  delayValue: { type: Number, default: 1 },
  delayUnit: { type: String, enum: ['hours', 'days'], default: 'days' },
  subject: String,
  body: { type: String, required: true },
  sendOnlyIfNoReply: { type: Boolean, default: true },
}, { _id: false });

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  steps: [stepSchema],
  status: { type: String, enum: ['draft', 'active', 'paused'], default: 'draft' },
  stats: {
    enrolled: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    replied: { type: Number, default: 0 },
    hot: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

campaignSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Campaign', campaignSchema);
