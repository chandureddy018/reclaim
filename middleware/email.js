const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send match notification email
const sendMatchEmail = async ({ toEmail, toName, yourItem, matchedItem }) => {
  try {
    const isLost = yourItem.type === 'lost';
    await transporter.sendMail({
      from: `"Re-Claim" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Re-Claim: Possible match found for your ${isLost ? 'lost' : 'found'} item!`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px">
          <h2 style="color:#1e3a8a;margin-bottom:8px">Re-Claim — Possible Match Found!</h2>
          <p style="color:#334155">Hi <strong>${toName}</strong>,</p>
          <p style="color:#334155">Good news! We found a possible match for your <strong>${isLost ? 'lost' : 'found'}</strong> item.</p>

          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
            <p style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Your Item</p>
            <p style="font-size:16px;font-weight:600;color:#0f172a;margin-bottom:4px">${yourItem.name}</p>
            <p style="color:#64748b;font-size:13px">📍 ${yourItem.location} &nbsp;|&nbsp; 🏷 ${yourItem.category}</p>
          </div>

          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:16px 0">
            <p style="color:#1d4ed8;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Matched ${isLost ? 'Found' : 'Lost'} Item</p>
            <p style="font-size:16px;font-weight:600;color:#0f172a;margin-bottom:4px">${matchedItem.name}</p>
            <p style="color:#64748b;font-size:13px">📍 ${matchedItem.location} &nbsp;|&nbsp; 🏷 ${matchedItem.category}</p>
            <p style="color:#64748b;font-size:13px">👤 Reported by: ${matchedItem.reportedBy.name}</p>
            <p style="color:#64748b;font-size:13px">📞 Contact: ${matchedItem.reportedBy.phone || matchedItem.contact || 'Not provided'}</p>
          </div>

          <p style="color:#334155">Please log in to Re-Claim and contact the reporter to verify and recover the item.</p>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px">This is an automated notification from Re-Claim — Digital Lost & Found System.</p>
        </div>
      `
    });
    console.log(`Match email sent to ${toEmail}`);
  } catch (err) {
    console.error('Email send error:', err.message);
    // Don't crash the app if email fails
  }
};

// Welcome email on signup
const sendWelcomeEmail = async ({ toEmail, toName }) => {
  try {
    await transporter.sendMail({
      from: `"Re-Claim" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Welcome to Re-Claim!',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px">
          <h2 style="color:#1e3a8a">Welcome to Re-Claim!</h2>
          <p style="color:#334155">Hi <strong>${toName}</strong>, your account has been created successfully.</p>
          <p style="color:#334155">You can now report lost items, browse found items, and help the community.</p>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px">Re-Claim — Digital Lost & Found System</p>
        </div>
      `
    });
  } catch (err) {
    console.error('Welcome email error:', err.message);
  }
};

module.exports = { sendMatchEmail, sendWelcomeEmail };
