let sgMail = null;

function getMailer() {
  if (sgMail) return sgMail;
  const key = process.env.SENDGRID_API_KEY;
  if (key) {
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(key);
  }
  return sgMail;
}

async function sendEmail(to, subject, htmlBody) {
  const mailer = getMailer();
  const from = process.env.FROM_EMAIL || 'noreply@example.com';

  if (!mailer) {
    console.log(`[EMAIL SIMULATED] To: ${to}\nSubject: ${subject}\nBody: ${htmlBody.slice(0, 200)}…\n`);
    return { status: 'simulated' };
  }

  await mailer.send({ to, from, subject, html: htmlBody });
  return { status: 'sent' };
}

module.exports = { sendEmail };
