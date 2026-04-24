const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const Enrollment = require('../models/Enrollment');
const Lead = require('../models/Lead');

// List all campaigns
router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get single campaign
router.get('/:id', async (req, res) => {
  try {
    const c = await Campaign.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create campaign
router.post('/', async (req, res) => {
  try {
    const campaign = await Campaign.create(req.body);
    res.status(201).json(campaign);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Update campaign
router.put('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!campaign) return res.status(404).json({ error: 'Not found' });
    res.json(campaign);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Delete campaign
router.delete('/:id', async (req, res) => {
  try {
    await Campaign.findByIdAndDelete(req.params.id);
    await Enrollment.deleteMany({ campaignId: req.params.id });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Toggle status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!campaign) return res.status(404).json({ error: 'Not found' });
    res.json(campaign);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Enroll leads in a campaign
router.post('/:id/enroll', async (req, res) => {
  try {
    const { leadIds } = req.body;
    if (!leadIds?.length) return res.status(400).json({ error: 'leadIds required' });

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (!campaign.steps.length) return res.status(400).json({ error: 'Campaign has no steps' });

    const firstStep = campaign.steps[0];
    const delayMs = firstStep.delayUnit === 'days'
      ? firstStep.delayValue * 24 * 3600 * 1000
      : firstStep.delayValue * 3600 * 1000;

    let enrolled = 0;
    for (const leadId of leadIds) {
      const exists = await Enrollment.findOne({ leadId, campaignId: campaign._id });
      if (exists) continue;
      await Enrollment.create({
        leadId,
        campaignId: campaign._id,
        currentStep: 0,
        nextSendAt: new Date(Date.now() + delayMs),
        status: 'active',
      });
      enrolled++;
    }

    await Campaign.updateOne({ _id: campaign._id }, { $inc: { 'stats.enrolled': enrolled } });
    res.json({ enrolled });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get enrollments for a campaign
router.get('/:id/enrollments', async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ campaignId: req.params.id })
      .populate('leadId', 'name phone email status')
      .sort({ startedAt: -1 })
      .limit(100);
    res.json(enrollments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
