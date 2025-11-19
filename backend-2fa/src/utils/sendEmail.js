import nodeMailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const sendEmail = async (options) => {
  const transporter = nodeMailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, 
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"Ecommercial Security" <${process.env.SMTP_MAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  // 3. Gửi
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Elastic Email Error:', error);
    throw new Error('Email could not be sent');
  }
};

export default sendEmail;