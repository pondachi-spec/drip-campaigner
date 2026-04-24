const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  direction: { type: String, enum: ['outbound', 'inbound'], required: true },
  channel: { type: String, enum: ['SMS', 'Email'], required: true },
  subject: String,
  body: { type: String, required: true },
  status: { type: String, enum: ['sent', 'delivered', 'failed', 'simulated'], default: 'simulated' },
  classification: {
    type: String,
    enum: ['INTERESTED', 'NOT_INTERESTED', 'CALL_ME', 'WRONG_NUMBER', 'UNKNOWN'],
    default: null,
  },
  twilioSid: String,
  sentAt: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('Message', messageSchema);
