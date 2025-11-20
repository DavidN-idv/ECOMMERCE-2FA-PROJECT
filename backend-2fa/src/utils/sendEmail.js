import nodeMailer from 'nodemailer';
import dotenv from 'dotenv';

// Đảm bảo load biến môi trường
dotenv.config();

const sendEmail = async (options) => {
  
  // --- DEBUG: Kiểm tra xem code có đọc được .env không ---
  console.log("DEBUG EMAIL CONFIG:");
  console.log("- MAIL:", process.env.SMTP_MAIL);
  console.log("- PASS:", process.env.SMTP_PASSWORD ? "****** (Đã có)" : "MISSING (Thiếu!)");
  // -------------------------------------------------------

  const transporter = nodeMailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    service: process.env.SMTP_SERVICE, 
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

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${options.email}`);
  } catch (error) {
    console.error('❌ Email Error:', error);
    throw new Error('Email could not be sent');
  }
};

export default sendEmail;