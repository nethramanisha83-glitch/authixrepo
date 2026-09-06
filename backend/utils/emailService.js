const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const rawPort = process.env.EMAIL_PORT || '465';
  const port = parseInt(rawPort, 10);
  
  // Port 465 uses SSL/TLS (secure: true). Port 587 uses STARTTLS (secure: false).
  // EMAIL_SECURE explicitly overrides if specified ('true' or 'false').
  const secure = process.env.EMAIL_SECURE !== undefined
    ? process.env.EMAIL_SECURE === 'true'
    : port === 465;

  const username = process.env.EMAIL_USERNAME ? process.env.EMAIL_USERNAME.trim() : '';
  // Strip spaces if user pasted 16-character Gmail App Password with spaces (e.g. "xxxx xxxx xxxx xxxx")
  const password = process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.trim().replace(/\s+/g, '') : '';

  if (!username || !password) {
    console.error('[EmailService Error] EMAIL_USERNAME or EMAIL_PASSWORD environment variable is missing on server!');
    throw new Error('Email service credentials are not configured on server.');
  }

  const transportConfig = {
    host: (process.env.EMAIL_HOST || 'smtp.gmail.com').trim(),
    port: port,
    secure: secure,
    auth: {
      user: username,
      pass: password,
    },
    tls: {
      rejectUnauthorized: false,
    },
    // Connection timeouts to prevent hanging on cloud servers (e.g. Render)
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,   // 10 seconds
    socketTimeout: 15000,     // 15 seconds
  };

  if (process.env.EMAIL_SERVICE) {
    transportConfig.service = process.env.EMAIL_SERVICE.trim();
  }

  console.log(`[EmailService] Connecting to ${transportConfig.host}:${transportConfig.port} (secure: ${transportConfig.secure}, user: ${username})...`);

  const transporter = nodemailer.createTransport(transportConfig);

  const fromAddress = (process.env.EMAIL_FROM || username || 'noreply@authsystem.com').trim();
  const mailOptions = {
    from: process.env.EMAIL_FROM_NAME
      ? `"${process.env.EMAIL_FROM_NAME.trim()}" <${fromAddress}>`
      : `Auth System <${fromAddress}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Email sent successfully to ${options.email}. MessageId: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error('[EmailService Failure]', {
      code: err.code,
      command: err.command,
      response: err.response,
      message: err.message
    });
    throw err;
  }
};

module.exports = sendEmail;

