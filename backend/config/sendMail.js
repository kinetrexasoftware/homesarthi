import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Create transporter using your existing .env keys
const transporter = nodemailer.createTransport({
  service: "Gmail",
  port: 465,
  secure: true,
  auth: {
    user: process.env.USER_EMAIL,      // matches your .env
    pass: process.env.USER_PASSWORD,   // matches your .env
  },
});

const sendMail = async (to, otp) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.USER_EMAIL,     // sender email
      to: to,                           // recipient email
      subject: "Reset Your Password",
      html: `<p>Your OTP for Password Reset is <b>${otp}</b>. It expires in 5 minutes.</p>`
    });

    console.log("Email sent:", info);
    if (nodemailer.getTestMessageUrl(info)) {
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    }
  } catch (err) {
    console.error("Error sending email:", err);
    throw err;
  }
};

export default sendMail;
