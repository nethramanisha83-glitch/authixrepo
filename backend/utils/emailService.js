const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. HTTP API Provider: Resend (Port 443 HTTPS - Never blocked on Render Free Tier)
  if (process.env.RESEND_API_KEY) {
    console.log(`[EmailService] Sending email to ${options.email} via Resend HTTP API (Port 443)...`);
    
    // For Resend free accounts without custom DNS domain verification, default to onboarding@resend.dev
    let resendFrom = 'Authix <onboarding@resend.dev>';
    if (process.env.EMAIL_FROM && !process.env.EMAIL_FROM.includes('authsystem.com')) {
      resendFrom = process.env.EMAIL_FROM.trim();
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [options.email],
        subject: options.subject,
        text: options.message,
        html: options.html || `<p>${options.message.replace(/\n/g, '<br>')}</p>`,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[EmailService Resend Error]', data);
      throw new Error(data.message || 'Resend HTTP email delivery failed.');
    }
    console.log(`[EmailService] Email sent via Resend API! ID: ${data.id}`);
    return data;
  }

  // 2. HTTP API Provider: Brevo / Sendinblue (Port 443 HTTPS)
  if (process.env.BREVO_API_KEY) {
    console.log(`[EmailService] Sending email to ${options.email} via Brevo HTTP API (Port 443)...`);
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY.trim(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Auth System', email: process.env.EMAIL_FROM || 'noreply@authsystem.com' },
        to: [{ email: options.email }],
        subject: options.subject,
        textContent: options.message,
        htmlContent: options.html || `<p>${options.message.replace(/\n/g, '<br>')}</p>`,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[EmailService Brevo Error]', data);
      throw new Error(data.message || 'Brevo HTTP email delivery failed.');
    }
    console.log(`[EmailService] Email sent via Brevo API! MessageId: ${data.messageId}`);
    return data;
  }

  // 3. Fallback: Nodemailer SMTP (For local dev or servers with open SMTP ports)
  const rawPort = process.env.EMAIL_PORT || '465';
  const port = parseInt(rawPort, 10);
  
  const secure = process.env.EMAIL_SECURE !== undefined
    ? process.env.EMAIL_SECURE === 'true'
    : port === 465;

  const username = process.env.EMAIL_USERNAME ? process.env.EMAIL_USERNAME.trim() : '';
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
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
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

