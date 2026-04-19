import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let _transporter = null;

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465, // true for port 465, false for 587
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  }
  return _transporter;
}

export async function sendPasswordResetEmail({ to, resetToken }) {
  const frontendUrl = env.frontendUrl || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"Rugendo Rwanda" <${env.smtpUser}>`,
    to,
    subject: 'Reset your Rugendo Rwanda password',
    text: `You requested a password reset.\n\nClick the link below to reset your password (valid for 1 hour):\n\n${resetLink}\n\nIf you did not request this, ignore this email.`,
    html: `
      <p>You requested a password reset for your Rugendo Rwanda account.</p>
      <p>
        <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">
          Reset Password
        </a>
      </p>
      <p>This link is valid for <strong>1 hour</strong>.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  };

  const transporter = getTransporter();
  const info = await transporter.sendMail(mailOptions);
  console.log(`[mail] Password reset email sent to ${to} — messageId: ${info.messageId}`);
  return info;
}
