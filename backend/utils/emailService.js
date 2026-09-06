const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const port = parseInt(process.env.EMAIL_PORT || '465', 10);
  
  // Port 465 uses SSL/TLS (secure: true). Port 587 uses STARTTLS (secure: false).
  // EMAIL_SECURE explicitly overrides if specified ('true' or 'false').
  const secure = process.env.EMAIL_SECURE !== undefined
    ? process.env.EMAIL_SECURE === 'true'
    : port === 465;

  const transportConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: port,
    secure: secure,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
    // Connection timeouts to prevent hanging on cloud servers (e.g. Render)
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,   // 10 seconds
    socketTimeout: 15000,     // 15 seconds
  };

  // Support optional EMAIL_SERVICE (e.g., 'gmail')
  if (process.env.EMAIL_SERVICE) {
    transportConfig.service = process.env.EMAIL_SERVICE;
  }

  const transporter = nodemailer.createTransport(transportConfig);

  const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USERNAME || 'noreply@authsystem.com';
  const mailOptions = {
    from: process.env.EMAIL_FROM_NAME
      ? `"${process.env.EMAIL_FROM_NAME}" <${fromAddress}>`
      : `Auth System <${fromAddress}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

