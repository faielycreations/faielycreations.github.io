// email-backend.js
// Email communication routes

const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
async function sendEmail(to, subject, html) {
  return transporter.sendMail({
    from: `${process.env.STORE_NAME} <${process.env.STORE_EMAIL}>`,
    to,
    subject,
    html
  });
}

module.exports = { sendEmail };