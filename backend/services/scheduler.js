const cron = require('node-cron');
const Enrollment = require('../models/Enrollment');
const Campaign = require('../models/Campaign');
const Lead = require('../models/Lead');
const Message = require('../models/Message');
const { sendSMS } = require('./twilio');
const { sendEmail } = require('./sendgrid');
const { render, buildVars, wrapHtml } = require('./templateEngine');

function delayMs(value, unit) {
  return unit === 'days' ? value * 24 * 3600 * 1000 : value * 3600 * 1000;
}

async function processQueue() {
  const now = new Date();
  const hour = now.getHours();

  if (hour < 9 || hour >= 19) {
    console.log(`[Scheduler] Outside 9am-7pm window (hour=${hour}), skipping.`);
    return;
  }

  const dueEnrollments = await Enrollment.find({
    status: 'active',
    nextSendAt: { $lte: now },
  }).populate('leadId campaignId');

  if (!dueEnrollments.length) return;
  console.log(`[Scheduler] Processing ${dueEnrollments.length} due enrollments`);

  for (const enrollment of dueEnrollments) {
    const campaign = enrollment.campaignId;
    const lead = enrollment.leadId;

    if (!campaign || !lead) {
      enrollment.status = 'stopped';
      await enrollment.save();
      continue;
    }

    const step = campaign.steps[enrollment.currentStep];

    if (!step) {
      enrollment.status = 'completed';
      await enrollment.save();
      continue;
    }

    // Check sendOnlyIfNoReply conditional
    if (step.sendOnlyIfNoReply) {
      const since = enrollment.lastSentAt || enrollment.startedAt;
      const replied = await Message.findOne({
        leadId: lead._id,
        direction: 'inbound',
        sentAt: { $gte: since },
      });
      if (replied) {
        // Lead replied — advance step without sending
        enrollment.currentStep++;
        if (enrollment.currentStep < campaign.steps.length) {
          const next = campaign.steps[enrollment.currentStep];
          enrollment.nextSendAt = new Date(now.getTime() + delayMs(next.delayValue, next.delayUnit));
        } else {
          enrollment.status = 'completed';
        }
        await enrollment.save();
        continue;
      }
    }

    // Build message
    const vars = buildVars(lead);
    const body = render(step.body, vars);
    let msgStatus = 'simulated';
    let twilioSid;

    try {
      if (step.channel === 'SMS') {
        if (lead.phone) {
          const result = await sendSMS(lead.phone, body);
          msgStatus = result.status;
          twilioSid = result.sid;
        }
      } else {
        if (lead.email) {
          const subject = render(step.subject || 'Investment Opportunity', vars);
          await sendEmail(lead.email, subject, wrapHtml(body, subject));
          msgStatus = 'sent';
        }
      }
    } catch (err) {
      console.error(`[Scheduler] Send error for lead ${lead._id}:`, err.message);
      msgStatus = 'failed';
    }

    // Save outbound message
    await Message.create({
      leadId: lead._id,
      campaignId: campaign._id,
      direction: 'outbound',
      channel: step.channel,
      subject: step.channel === 'Email' ? render(step.subject || '', vars) : undefined,
      body,
      status: msgStatus,
      twilioSid,
      sentAt: now,
    });

    // Advance enrollment
    enrollment.currentStep++;
    enrollment.lastSentAt = now;
    if (enrollment.currentStep < campaign.steps.length) {
      const next = campaign.steps[enrollment.currentStep];
      enrollment.nextSendAt = new Date(now.getTime() + delayMs(next.delayValue, next.delayUnit));
    } else {
      enrollment.status = 'completed';
    }
    await enrollment.save();

    // Update lead status
    if (lead.status === 'New') {
      await Lead.updateOne({ _id: lead._id }, { status: 'Contacted', lastContactedAt: now });
    }

    await Campaign.updateOne({ _id: campaign._id }, { $inc: { 'stats.sent': 1 } });
  }
}

function start() {
  // Every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    processQueue().catch((err) => console.error('[Scheduler] Error:', err.message));
  });
  console.log('[Scheduler] Started — checking every 15 minutes (sends 9am–7pm only)');
}

module.exports = { start, processQueue };
