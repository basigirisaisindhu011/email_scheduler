import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const transporter = nodemailer.createTransport({
  host: env.etherealHost,
  port: env.etherealPort,
  secure: false,
  auth: env.etherealUser && env.etherealPass ? { user: env.etherealUser, pass: env.etherealPass } : undefined,
});

export const sendEmail = async (payload: EmailPayload) => {
  if (!env.etherealUser || !env.etherealPass) {
    const testAccount = await nodemailer.createTestAccount();
    const dynamicTransport = nodemailer.createTransport({
      host: env.etherealHost,
      port: env.etherealPort,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });

    const info = await dynamicTransport.sendMail({
      from: 'Persistent Email Scheduler <noreply@example.com>',
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html || payload.text,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('Ethereal preview URL:', previewUrl || 'No preview URL');

    return { messageId: info.messageId, previewUrl };
  }

  const info = await transporter.sendMail({
    from: 'Persistent Email Scheduler <noreply@example.com>',
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html || payload.text,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log('Ethereal preview URL:', previewUrl || 'No preview URL');

  return { messageId: info.messageId, previewUrl };
};
