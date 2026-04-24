const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  currentStep: { type: Number, default: 0 },
  nextSendAt: { type: Date, required: true, index: true },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'stopped'],
    default: 'active',
    index: true,
  },
  startedAt: { type: Date, default: Date.now },
  lastSentAt: Date,
});

enrollmentSchema.index({ leadId: 1, campaignId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
