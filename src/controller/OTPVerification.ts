// controller/OTPVerification.ts
// Complete OTP Controller with Multiple Email Service Options

import { Request, Response } from "express";
import nodemailer from "nodemailer";
import { otpEmailTemplate } from "../templates/OtpTemplate";

const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes
const otpStore: {
  [emailOrMobile: string]: { otp: string; expiresAt: number };
} = {};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

// Generate 6-digit OTP
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ==========================================
// EMAIL SERVICE CONFIGURATIONS
// ==========================================

// Option 1: Gmail SMTP (Fixed Configuration)
const createGmailTransporter = () => {
  console.log("🔧 Using Gmail SMTP configuration");
  console.log("📧 Email User:", process.env.MAIL_USER);
  console.log("🔑 Password provided:", process.env.MAIL_PASS ? "YES" : "NO");

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.MAIL_USER!,
      pass: process.env.MAIL_PASS!, // App Password (16 chars, NO SPACES)
    },
    tls: {
      rejectUnauthorized: false,
    },
    // Debug options (remove in production)
    debug: process.env.NODE_ENV === "development",
    logger: process.env.NODE_ENV === "development",
  });
};

// Option 2: Outlook/Hotmail SMTP
const createOutlookTransporter = () => {
  console.log("🔧 Using Outlook SMTP configuration");
  return nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER!,
      pass: process.env.MAIL_PASS!, // Regular password works for Outlook
    },
  });
};

// Option 3: Mailtrap (Development)
const createMailtrapTransporter = () => {
  console.log("🔧 Using Mailtrap configuration (Development)");
  return nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.MAIL_USER!,
      pass: process.env.MAIL_PASS!,
    },
  });
};

// Option 4: Generic SMTP
const createGenericTransporter = () => {
  console.log("🔧 Using Generic SMTP configuration");
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.MAIL_PORT || "587"),
    secure: process.env.MAIL_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USER!,
      pass: process.env.MAIL_PASS!,
    },
  });
};

// ==========================================
// SMART TRANSPORTER SELECTION
// ==========================================

const getTransporter = () => {
  const emailUser = process.env.MAIL_USER?.toLowerCase();

  // Auto-detect email provider
  if (emailUser?.includes("gmail.com")) {
    return createGmailTransporter();
  } else if (
    emailUser?.includes("outlook.com") ||
    emailUser?.includes("hotmail.com")
  ) {
    return createOutlookTransporter();
  } else if (
    process.env.NODE_ENV === "development" &&
    process.env.MAIL_HOST?.includes("mailtrap")
  ) {
    return createMailtrapTransporter();
  } else {
    return createGenericTransporter();
  }
};

// ==========================================
// ENHANCED EMAIL SENDING FUNCTION
// ==========================================

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const transporter = getTransporter();

    // Verify connection
    console.log("🔄 Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection verified successfully");

    // Prepare email options
    const mailOptions = {
      from: `"QuantumGrid Energy Trading" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
      // Add text fallback
      text: `Your OTP verification code. Please check HTML version for better formatting.`,
    };

    console.log(`📤 Sending email to: ${to}`);
    console.log(`📋 Subject: ${subject}`);

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully!");
    console.log(`📧 Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error: any) {
    console.error("❌ Email sending failed:");
    console.error("Error Code:", error.code);
    console.error("Error Message:", error.message);

    if (error.response) {
      console.error("SMTP Response:", error.response);
    }

    // Throw with enhanced error info
    const enhancedError = new Error(getEmailErrorMessage(error));
    enhancedError.name = error.code || "EmailError";
    throw enhancedError;
  }
};

// ==========================================
// ERROR MESSAGE HELPER
// ==========================================

const getEmailErrorMessage = (error: any): string => {
  const errorCode = error.code;
  const errorMessage = error.message?.toLowerCase() || "";

  // Gmail specific errors
  if (errorMessage.includes("application-specific password required")) {
    return "Gmail requires an App Password. Please enable 2-Factor Authentication and generate an App Password.";
  }

  if (errorCode === "EAUTH" || errorMessage.includes("invalid login")) {
    return "Email authentication failed. Please check your email credentials and ensure you're using the correct password.";
  }

  if (errorCode === "ECONNECTION" || errorMessage.includes("connection")) {
    return "Failed to connect to email server. Please check your internet connection and email server settings.";
  }

  if (errorMessage.includes("timeout")) {
    return "Email sending timed out. Please try again.";
  }

  if (errorMessage.includes("rate limit") || errorMessage.includes("quota")) {
    return "Email sending rate limit exceeded. Please try again later.";
  }

  // Default error
  return `Email sending failed: ${error.message}`;
};

// ==========================================
// SEND OTP FUNCTION
// ==========================================

export const SendOtp = async (req: Request, res: Response) => {
  try {
    console.log("\n🚀 === SEND OTP REQUEST ===");
    console.log("📝 Request body:", JSON.stringify(req.body, null, 2));

    const { email, name } = req.body;

    // ==========================================
    // INPUT VALIDATION
    // ==========================================

    if (!email) {
      console.log("❌ Validation failed: Email is required");
      return res.status(400).json({
        success: false,
        message: "Email address is required",
        error: "MISSING_EMAIL",
      });
    }

    if (!isValidEmail(email)) {
      console.log("❌ Validation failed: Invalid email format");
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
        error: "INVALID_EMAIL_FORMAT",
      });
    }

    // ==========================================
    // ENVIRONMENT VALIDATION
    // ==========================================

    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      console.error("❌ Missing email environment variables!");
      console.log("MAIL_USER:", process.env.MAIL_USER ? "✓ Set" : "❌ Missing");
      console.log("MAIL_PASS:", process.env.MAIL_PASS ? "✓ Set" : "❌ Missing");

      return res.status(500).json({
        success: false,
        message:
          "Email service is not properly configured. Please contact administrator.",
        error: "EMAIL_SERVICE_NOT_CONFIGURED",
      });
    }

    // ==========================================
    // RATE LIMITING CHECK
    // ==========================================

    const existingRecord = otpStore[email];
    if (
      existingRecord &&
      Date.now() - (existingRecord.expiresAt - OTP_EXPIRY) < 60000
    ) {
      console.log("⏰ Rate limit: OTP recently sent");
      return res.status(429).json({
        success: false,
        message: "Please wait at least 1 minute before requesting a new OTP",
        error: "RATE_LIMITED",
        retryAfter: 60,
      });
    }

    // ==========================================
    // GENERATE OTP
    // ==========================================

    const otp = generateOtp();
    console.log(`🔢 Generated OTP for ${email}: ${otp}`); // Remove in production

    // ==========================================
    // PREPARE EMAIL CONTENT
    // ==========================================

    const userName = name || "User";
    const html = otpEmailTemplate(otp, userName);
    const subject = "Your QuantumGrid Verification Code";

    console.log(`👤 Sending OTP to: ${userName} (${email})`);

    // ==========================================
    // SEND EMAIL
    // ==========================================

    const emailResult = await sendEmail(email, subject, html);

    // ==========================================
    // STORE OTP
    // ==========================================

    otpStore[email] = {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY,
    };

    console.log(
      `💾 OTP stored for ${email}, expires at: ${new Date(
        Date.now() + OTP_EXPIRY
      ).toISOString()}`
    );

    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================

    const response = {
      success: true,
      message: "OTP sent successfully to your email address",
      data: {
        email,
        messageId: emailResult.messageId,
        expiresIn: OTP_EXPIRY / 1000, // seconds
        expiresAt: new Date(Date.now() + OTP_EXPIRY).toISOString(),
      },
      // Include OTP in development for testing
      ...(process.env.NODE_ENV === "development" && {
        debug: { otp, note: "OTP included for development testing only" },
      }),
    };

    console.log("✅ OTP sent successfully!");
    console.log("📤 Response:", JSON.stringify(response, null, 2));

    return res.status(200).json(response);
  } catch (error: any) {
    console.error("\n❌ === SEND OTP ERROR ===");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    console.error("Stack Trace:", error.stack);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send OTP. Please try again.",
      error: error.name || "EMAIL_SEND_ERROR",
      // Include more details in development
      ...(process.env.NODE_ENV === "development" && {
        debug: {
          errorCode: error.code,
          errorResponse: error.response,
          timestamp: new Date().toISOString(),
        },
      }),
    });
  }
};

// ==========================================
// VERIFY OTP FUNCTION
// ==========================================

export const VerifyOtp = async (req: Request, res: Response) => {
  try {
    console.log("\n🔍 === VERIFY OTP REQUEST ===");
    console.log("📝 Request body:", JSON.stringify(req.body, null, 2));

    const { email, otp } = req.body;

    // ==========================================
    // INPUT VALIDATION
    // ==========================================

    if (!email || !otp) {
      console.log("❌ Validation failed: Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
        error: "MISSING_REQUIRED_FIELDS",
      });
    }

    if (!isValidEmail(email)) {
      console.log("❌ Validation failed: Invalid email format");
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
        error: "INVALID_EMAIL_FORMAT",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      console.log("❌ Validation failed: Invalid OTP format");
      return res.status(400).json({
        success: false,
        message: "OTP must be a 6-digit number",
        error: "INVALID_OTP_FORMAT",
      });
    }

    // ==========================================
    // FIND OTP RECORD
    // ==========================================

    const record = otpStore[email];
    if (!record) {
      console.log(`❌ OTP not found for email: ${email}`);
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please request a new OTP.",
        error: "OTP_NOT_FOUND",
      });
    }

    // ==========================================
    // CHECK EXPIRY
    // ==========================================

    if (Date.now() > record.expiresAt) {
      console.log(`⏰ OTP expired for email: ${email}`);
      delete otpStore[email]; // Clean up expired OTP
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
        error: "OTP_EXPIRED",
      });
    }

    // ==========================================
    // VERIFY OTP
    // ==========================================

    if (otp !== record.otp) {
      console.log(`❌ Invalid OTP provided for email: ${email}`);
      console.log(`Expected: ${record.otp}, Received: ${otp}`);
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please check and try again.",
        error: "INVALID_OTP",
      });
    }

    // ==========================================
    // SUCCESS - CLEAN UP AND RESPOND
    // ==========================================

    delete otpStore[email]; // One-time use
    console.log(`✅ OTP verified successfully for email: ${email}`);

    const response = {
      success: true,
      message: "OTP verified successfully",
      data: {
        email,
        verifiedAt: new Date().toISOString(),
      },
    };

    console.log("✅ OTP verification successful!");
    console.log("📤 Response:", JSON.stringify(response, null, 2));

    return res.status(200).json(response);
  } catch (error: any) {
    console.error("\n❌ === VERIFY OTP ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack Trace:", error.stack);

    return res.status(500).json({
      success: false,
      message: "Internal server error during OTP verification",
      error: "VERIFICATION_ERROR",
      ...(process.env.NODE_ENV === "development" && {
        debug: {
          errorMessage: error.message,
          timestamp: new Date().toISOString(),
        },
      }),
    });
  }
};

// ==========================================
// TEST EMAIL CONNECTION FUNCTION
// ==========================================

export const TestEmailConnection = async (req: Request, res: Response) => {
  try {
    console.log("\n🧪 === EMAIL CONNECTION TEST ===");

    // Environment check
    console.log("📧 MAIL_USER:", process.env.MAIL_USER || "❌ NOT SET");
    console.log(
      "🔑 MAIL_PASS:",
      process.env.MAIL_PASS ? "✓ PROVIDED" : "❌ NOT SET"
    );
    console.log("🏠 MAIL_HOST:", process.env.MAIL_HOST || "auto-detected");
    console.log("🔌 MAIL_PORT:", process.env.MAIL_PORT || "auto-detected");

    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      return res.status(500).json({
        success: false,
        message: "Email configuration missing",
        missing: {
          MAIL_USER: !process.env.MAIL_USER,
          MAIL_PASS: !process.env.MAIL_PASS,
        },
      });
    }

    const transporter = getTransporter();

    // Test connection
    console.log("🔄 Testing SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection successful!");

    // Send test email to same address
    const testEmail = process.env.MAIL_USER;
    console.log(`📤 Sending test email to: ${testEmail}`);

    const testEmailResult = await transporter.sendMail({
      from: `"QuantumGrid Test" <${process.env.MAIL_USER}>`,
      to: testEmail,
      subject: "✅ QuantumGrid Email Configuration Test",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #667eea;">🎉 Email Configuration Successful!</h2>
          <p>If you're reading this, your QuantumGrid email configuration is working perfectly.</p>
          <div style="background: #f0f0f0; padding: 15px; border-radius: 5px;">
            <strong>Test Details:</strong><br>
            📧 From: ${process.env.MAIL_USER}<br>
            🕐 Time: ${new Date().toISOString()}<br>
            🔧 Provider: Auto-detected
          </div>
          <p><em>This is an automated test email from QuantumGrid Energy Trading Platform.</em></p>
        </div>
      `,
      text: "QuantumGrid email configuration test successful!",
    });

    console.log("✅ Test email sent successfully!");

    return res.status(200).json({
      success: true,
      message: "Email configuration test successful",
      data: {
        provider: process.env.MAIL_USER?.includes("gmail")
          ? "Gmail"
          : process.env.MAIL_USER?.includes("outlook")
          ? "Outlook"
          : "Other",
        messageId: testEmailResult.messageId,
        testEmailSentTo: testEmail,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("❌ Email test failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Email configuration test failed",
      error: getEmailErrorMessage(error),
      details: {
        errorCode: error.code,
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

// ==========================================
// GET OTP STATUS FUNCTION (BONUS)
// ==========================================

export const GetOtpStatus = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;

    if (!email || !isValidEmail(email as string)) {
      return res.status(400).json({
        success: false,
        message: "Valid email address is required",
        error: "INVALID_EMAIL",
      });
    }

    const record = otpStore[email as string];

    if (!record) {
      return res.status(200).json({
        success: true,
        data: {
          hasActiveOtp: false,
          status: "no_otp",
        },
      });
    }

    const isExpired = Date.now() > record.expiresAt;
    const remainingTime = Math.max(0, record.expiresAt - Date.now());

    return res.status(200).json({
      success: true,
      data: {
        hasActiveOtp: !isExpired,
        status: isExpired ? "expired" : "active",
        remainingTime: remainingTime, // milliseconds
        expiresAt: new Date(record.expiresAt).toISOString(),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to get OTP status",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORT ALL FUNCTIONS
// ==========================================
