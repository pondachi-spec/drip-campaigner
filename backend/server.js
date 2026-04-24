require('dotenv').config({ path: '../.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Twilio webhook sends urlencoded

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/drip-campaigner';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    require('./services/scheduler').start();
  })
  .catch((err) => console.error('MongoDB error:', err));

app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/webhook', require('./routes/webhooks'));
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// Serve built frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../frontend/dist/index.html')));

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`Drip Campaigner running on http://localhost:${PORT}`));
