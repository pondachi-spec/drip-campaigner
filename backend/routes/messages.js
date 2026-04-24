const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Inbox — all inbound messages, newest first
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const filter = { direction: 'inbound' };
    if (req.query.classification) filter.classification = req.query.classification;

    const messages = await Message.find(filter)
      .populate('leadId', 'name phone email status')
      .populate('campaignId', 'name')
      .sort({ sentAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Message.countDocuments(filter);
    res.json({ messages, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Conversation thread for a lead
router.get('/lead/:leadId', async (req, res) => {
  try {
    const messages = await Message.find({ leadId: req.params.leadId })
      .sort({ sentAt: 1 });
    res.json(messages);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Stats for dashboard
router.get('/stats', async (req, res) => {
  try {
    const [total, interested, callMe, notInterested] = await Promise.all([
      Message.countDocuments({ direction: 'inbound' }),
      Message.countDocuments({ direction: 'inbound', classification: 'INTERESTED' }),
      Message.countDocuments({ direction: 'inbound', classification: 'CALL_ME' }),
      Message.countDocuments({ direction: 'inbound', classification: 'NOT_INTERESTED' }),
    ]);
    res.json({ total, interested, callMe, notInterested });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
