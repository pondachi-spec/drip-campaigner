function render(template, variables = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => variables[key] ?? `{${key}}`);
}

function buildVars(lead) {
  return {
    name: lead.name || '',
    address: lead.address || '',
    city: lead.city || '',
    investor_name: process.env.INVESTOR_NAME || 'Your Investor',
  };
}

function wrapHtml(body, subject) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px}
  .card{background:#fff;border-radius:8px;padding:32px;max-width:600px;margin:0 auto}
  .footer{color:#999;font-size:12px;margin-top:24px}
</style></head>
<body>
  <div class="card">
    <h2 style="color:#4f46e5">${subject}</h2>
    <p style="color:#333;line-height:1.7">${body.replace(/\n/g, '<br>')}</p>
    <div class="footer">This message was sent to you as a property owner. Reply STOP to opt out.</div>
  </div>
</body>
</html>`;
}

module.exports = { render, buildVars, wrapHtml };
