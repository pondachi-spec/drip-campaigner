const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Message = require('../models/Message');
const Enrollment = require('../models/Enrollment');
const Campaign = require('../models/Campaign');
const { classify } = require('../services/classifier');

// POST /api/webhook/twilio/sms  — Twilio inbound SMS
router.post('/twilio/sms', async (req, res) => {
  try {
    const { From, Body, MessageSid } = req.body;
    if (!From || !Body) {
      return res.status(400).send('<Response></Response>');
    }

    // Normalize phone (strip non-digits except leading +)
    const normalizedPhone = From.replace(/[^\d+]/g, '');

    // Find lead by phone
    const lead = await Lead.findOne({
      phone: { $regex: normalizedPhone.replace('+1', '').replace(/\D/g, ''), $options: 'i' },
    });

    // Classify the reply
    const { label } = await classify(Body.trim());

    // Save inbound message
    const message = await Message.create({
      leadId: lead?._id,
      direction: 'inbound',
      channel: 'SMS',
      body: Body.trim(),
      status: 'delivered',
      classification: label,
      twilioSid: MessageSid,
      sentAt: new Date(),
    });

    if (lead) {
      // Update lead based on classification
      if (label === 'INTERESTED' || label === 'CALL_ME') {
        await Lead.updateOne({ _id: lead._id }, {
          status: 'Hot',
          isHotFlagged: true,
          lastRepliedAt: new Date(),
        });
        // Update campaign stats
        const activeEnrollment = await Enrollment.findOne({ leadId: lead._id, status: 'active' });
        if (activeEnrollment) {
          await Campaign.updateOne({ _id: activeEnrollment.campaignId }, { $inc: { 'stats.hot': 1, 'stats.replied': 1 } });
        }
      } else if (label === 'NOT_INTERESTED' || label === 'WRONG_NUMBER') {
        // Stop all active enrollments
        await Enrollment.updateMany({ leadId: lead._id, status: 'active' }, { status: 'stopped' });
        if (lead.status !== 'Closed') {
          await Lead.updateOne({ _id: lead._id }, { status: 'Replied', lastRepliedAt: new Date() });
        }
      } else {
        // UNKNOWN or other reply — mark as Replied
        if (lead.status === 'Contacted') {
          await Lead.updateOne({ _id: lead._id }, { status: 'Replied', lastRepliedAt: new Date() });
          const activeEnrollment = await Enrollment.findOne({ leadId: lead._id, status: 'active' });
          if (activeEnrollment) {
            await Campaign.updateOne({ _id: activeEnrollment.campaignId }, { $inc: { 'stats.replied': 1 } });
          }
        }
      }
    }

    // Respond to Twilio with empty TwiML (no auto-reply)
    res.setHeader('Content-Type', 'text/xml');
    res.send('<Response></Response>');
  } catch (err) {
    console.error('Twilio webhook error:', err);
    res.setHeader('Content-Type', 'text/xml');
    res.send('<Response></Response>');
  }
});

module.exports = router;
