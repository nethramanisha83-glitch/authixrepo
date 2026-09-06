const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Direct Gmail / SMTP Transport using Nodemailer 'service' setting
  if (process.env.EMAIL_USERNAME && process.env.EMAIL_PASSWORD) {
    const username = process.env.EMAIL_USERNAME.trim();
    const password = process.env.EMAIL_PASSWORD.trim().replace(/\s+/g, '');

    if (username && password) {
      console.log(`[EmailService] Sending email to ${options.email} via Gmail (${username})...`);
      
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: username,
          pass: password,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      const fromAddress = (process.env.EMAIL_FROM || username).trim();
      const mailOptions = {
        from: `Auth System <${fromAddress}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EmailService] Email sent successfully via Gmail to ${options.email}. MessageId: ${info.messageId}`);
        return info;
      } catch (gmailErr) {
        console.warn(`[EmailService] Gmail direct delivery warning (${gmailErr.message}). Attempting fallback...`);
      }
    }
  }

  // 2. HTTP API Provider: Resend (Port 443 HTTPS)
  if (process.env.RESEND_API_KEY) {
    try {
      console.log(`[EmailService] Sending email to ${options.email} via Resend HTTP API (Port 443)...`);
      
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
      if (res.ok) {
        console.log(`[EmailService] Email sent via Resend API! ID: ${data.id}`);
        return data;
      }
      
      console.warn(`[EmailService] Resend API Warning: ${data.message}.`);
      throw new Error(data.message || 'Resend HTTP email delivery failed.');
    } catch (resendErr) {
      console.warn(`[EmailService] Resend error (${resendErr.message})`);
      throw resendErr;
    }
  }

  throw new Error('No working email provider credentials configured on server.');
};

module.exports = sendEmail;

