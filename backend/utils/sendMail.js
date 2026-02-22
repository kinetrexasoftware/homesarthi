import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Create transporter
const createTransporter = () => {
    if (!process.env.USER_EMAIL || !process.env.USER_PASSWORD) {
        console.warn("WARNING: USER_EMAIL or USER_PASSWORD not set in .env. Emails will not be sent.");
        return null;
    }

    return nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.USER_EMAIL,
            pass: process.env.USER_PASSWORD?.replace(/\s/g, ''),
        },
        connectionTimeout: 15000,
        socketTimeout: 30000,
        tls: {
            rejectUnauthorized: false
        }
    });
};

const sendMail = async (to, otp) => {
    try {
        const transporter = createTransporter();

        if (!transporter) {
            console.log("-----------------------------------------");
            console.log(`DEVELOPMENT OTP for ${to}: ${otp}`);
            console.log("-----------------------------------------");
            return { messageId: "dev-mode-log" };
        }

        const info = await transporter.sendMail({
            from: process.env.USER_EMAIL,
            to: to,
            subject: "Reset Your Password - HomeSarthi",
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #2563eb; text-align: center;">HomeSarthi Password Reset</h2>
        <p style="color: #4b5563; font-size: 16px;">Hello,</p>
        <p style="color: #4b5563; font-size: 16px;">You requested to reset your password. Here is your One-Time Password (OTP):</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">${otp}</span>
        </div>
        <p style="color: #4b5563; font-size: 16px;">This OTP is valid for <b>5 minutes</b>.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">© 2026 HomeSarthi. All rights reserved.</p>
      </div>`
        });

        console.log("Email sent:", info.messageId);
        return info;
    } catch (err) {
        console.error("Nodemailer Error Details:", {
            message: err.message,
            code: err.code,
            command: err.command,
            response: err.response
        });
        throw err;
    }
};

export default sendMail;
