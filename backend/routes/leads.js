const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const axios = require('axios');
const Lead = require('../models/Lead');
const axios2 = require('axios');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// GET all leads (with optional status filter)
router.get('/', async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const leads = await Lead.find(filter).sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Pipeline stats
router.get('/stats', async (req, res) => {
  try {
    const statuses = ['New', 'Contacted', 'Replied', 'Hot', 'Closed'];
    const counts = await Promise.all(
      statuses.map(async (s) => ({ status: s, count: await Lead.countDocuments({ status: s }) }))
    );
    const total = counts.reduce((a, c) => a + c.count, 0);
    res.json({ total, pipeline: counts });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CSV import
router.post('/import/csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const rows = parse(req.file.buffer.toString('utf-8'), {
      columns: true, skip_empty_lines: true, trim: true,
    });

    let imported = 0, skipped = 0;
    for (const row of rows) {
      const keys = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), v]));
      const name = keys.name || keys['owner name'] || '';
      const phone = keys.phone || keys['phone number'] || '';
      const email = keys.email || '';
      const address = keys.address || keys['property address'] || '';
      const city = keys.city || '';

      if (!name) { skipped++; continue; }
      await Lead.findOneAndUpdate(
        { name, phone },
        { name, phone, email, address, city, source: 'csv' },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      imported++;
    }
    res.json({ imported, skipped });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Import from Alisha
router.post('/import/alisha', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:3000/api/leads', {
      params: { status: 'qualified' },
      timeout: 5000,
    });
    const alishaLeads = Array.isArray(response.data) ? response.data : response.data?.leads || [];

    let imported = 0, skipped = 0;
    for (const al of alishaLeads) {
      const name = al.name || al.ownerName || '';
      const phone = al.phone || al.phoneNumber || '';
      if (!name) { skipped++; continue; }
      await Lead.findOneAndUpdate(
        { name, phone },
        {
          name, phone,
          email: al.email || '',
          address: al.address || al.propertyAddress || '',
          city: al.city || '',
          source: 'alisha',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      imported++;
    }
    res.json({ imported, skipped });
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return res.status(502).json({ error: 'Could not connect to Alisha (localhost:3000)' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Update lead
router.put('/:id', async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lead) return res.status(404).json({ error: 'Not found' });
    res.json(lead);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Send Hot lead to Alisha
router.post('/:id/alisha', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    await axios.post('http://localhost:3000/api/webhook/propwire', {
      name: lead.name,
      address: lead.address,
      phone: lead.phone,
      source: 'Drip Campaigner',
    }, { timeout: 5000 });

    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ECONNREFUSED') return res.status(502).json({ error: 'Alisha not reachable' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
