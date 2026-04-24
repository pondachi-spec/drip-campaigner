let twilioClient = null;

function getClient() {
  if (twilioClient) return twilioClient;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (sid && token) {
    twilioClient = require('twilio')(sid, token);
  }
  return twilioClient;
}

async function sendSMS(to, body) {
  const client = getClient();
  const from = process.env.TWILIO_PHONE;

  if (!client || !from) {
    console.log(`[SMS SIMULATED] To: ${to}\nBody: ${body}\n`);
    return { sid: `SIM_${Date.now()}`, status: 'simulated' };
  }

  const message = await client.messages.create({ body, from, to });
  return { sid: message.sid, status: message.status };
}

module.exports = { sendSMS };
