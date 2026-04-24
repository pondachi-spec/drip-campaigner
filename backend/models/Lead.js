const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: String,
  email: String,
  address: String,
  city: String,
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Replied', 'Hot', 'Closed'],
    default: 'New',
    index: true,
  },
  source: { type: String, enum: ['csv', 'alisha', 'manual'], default: 'manual' },
  isHotFlagged: { type: Boolean, default: false },
  lastContactedAt: Date,
  lastRepliedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

leadSchema.index({ phone: 1 });
leadSchema.index({ email: 1 });

module.exports = mongoose.model('Lead', leadSchema);
