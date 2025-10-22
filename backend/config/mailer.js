const nodemailer = require('nodemailer');

const env = process.env.NODE_ENV || 'development';
const required = ['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS'];
const missing = required.filter(k => !process.env[k]);

let transporter;
let isMock = false;

if (missing.length) {
  if (env === 'production') {
    console.error('❌ Missing SMTP environment variables:', missing.join(', '));
    process.exit(1);
  } else {
    console.warn('⚠️ Dev mode: missing SMTP vars => using mock mailer:', missing.join(', '));
    isMock = true;
  }
}

if (!isMock) {
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  // Mock transporter: just log messages instead of sending
  transporter = {
    sendMail: async (opts) => {
      console.log('📧 [MOCK MAIL] To:', opts.to, '| Subject:', opts.subject);
      // Try extract first URL from html/text for convenience
      try {
        const body = (opts.html || opts.text || '').toString();
        const urlMatch = body.match(/https?:\/\/[^\s"']+/);
        if (urlMatch) {
          console.log('🔗 [MOCK MAIL LINK]:', urlMatch[0]);
        }
      } catch (_) {}
      return { mock: true, accepted: [opts.to], messageId: `mock-${Date.now()}` };
    }
  };
}

const sendMail = async (mailOptions) => {
  try {
    return await transporter.sendMail(mailOptions);
  } catch (e) {
    console.error('❌ Mail send failed:', e.message);
    throw e;
  }
};

module.exports = { transporter, sendMail, isMock }; 