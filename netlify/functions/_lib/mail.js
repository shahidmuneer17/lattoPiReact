// Maileroo transactional email — optional, no-op if MAILEROO_API_KEY isn't set.
async function sendMail(to, subject, html) {
  if (!process.env.MAILEROO_API_KEY) {
    console.warn('[mail] MAILEROO_API_KEY not set; skipping send to', to);
    return;
  }
  const res = await fetch('https://smtp.maileroo.com/api/v2/emails', {
    method: 'POST',
    headers: {
      'X-Api-Key': process.env.MAILEROO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: { address: 'no-reply@lattopi.com', display_name: 'LattoPi' },
      to: [{ address: to }],
      subject,
      html,
    }),
  });
  if (!res.ok) console.warn('[mail] send failed', await res.text());
}

module.exports = { sendMail };
