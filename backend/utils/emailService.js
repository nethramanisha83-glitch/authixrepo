const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. HTTP API Provider: Brevo / Sendinblue (Port 443 HTTPS - Free 300 emails/day to ANY recipient)
  if (process.env.BREVO_API_KEY) {
    try {
      console.log(`[EmailService] Sending email to ${options.email} via Brevo HTTP API (Port 443)...`);
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Auth System', email: process.env.EMAIL_FROM || 'nethramanisha83@gmail.com' },
          to: [{ email: options.email }],
          subject: options.subject,
          textContent: options.message,
          htmlContent: options.html || `<p>${options.message.replace(/\n/g, '<br>')}</p>`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log(`[EmailService] Email sent via Brevo API! MessageId: ${data.messageId}`);
        return data;
      }
      console.warn(`[EmailService] Brevo API error:`, data);
      throw new Error(data.message || 'Brevo email delivery failed.');
    } catch (brevoErr) {
      console.warn(`[EmailService] Brevo error (${brevoErr.message})`);
      if (!process.env.RESEND_API_KEY && !process.env.EMAIL_USERNAME) throw brevoErr;
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
      
      console.warn(`[EmailService] Resend API Warning: ${data.message}`);
      throw new Error(data.message || 'Resend HTTP email delivery failed.');
    } catch (resendErr) {
      console.warn(`[EmailService] Resend error (${resendErr.message})`);
      if (!process.env.EMAIL_USERNAME) throw resendErr;
    }
  }

  // 3. Fallback: Direct Nodemailer SMTP
  if (process.env.EMAIL_USERNAME && process.env.EMAIL_PASSWORD) {
    const username = process.env.EMAIL_USERNAME.trim();
    const password = process.env.EMAIL_PASSWORD.trim().replace(/\s+/g, '');

    console.log(`[EmailService] Sending email to ${options.email} via Nodemailer Gmail...`);
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: { user: username, pass: password },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    const fromAddress = (process.env.EMAIL_FROM || username).trim();
    const mailOptions = {
      from: `Auth System <${fromAddress}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    return await transporter.sendMail(mailOptions);
  }

  throw new Error('No working email provider credentials configured on server.');
};

module.exports = sendEmail;

