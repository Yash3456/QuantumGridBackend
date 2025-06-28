import express, { Request, Response } from "express";
import dotenv from "dotenv";
import {
  GetOtpStatus,
  SendOtp,
  TestEmailConnection,
  VerifyOtp,
} from "../controller/OTPVerification";
import { GetUserDetail, loginUser } from "../controller/usercontroller";
// import { uploadDocument } from "../controller/DocumentUploadation";

dotenv.config();

const router = express.Router();

// Type-safe route handlers
router.post("/send-otp", async (req: Request, res: Response) => {
  try {
    await SendOtp(req, res);
  } catch (error) {
    console.error("Error in send-otp route:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

router.post("/verify-otp", async (req: Request, res: Response) => {
  try {
    await VerifyOtp(req, res);
  } catch (error) {
    console.error("Error in verify-otp route:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

router.get("/test-email", async (req: Request, res: Response) => {
  try {
    await TestEmailConnection(req, res);
  } catch (error) {
    console.error("Error in test-email route:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});
router.get("/status", async (req: Request, res: Response) => {
  try {
    await GetOtpStatus(req, res);
  } catch (error) {
    console.error("Error in status route:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

router.use("/login", async (req: Request, res: Response) => {
  try {
    await loginUser(req, res);
  } catch (error) {
    console.error("Error in status route:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

router.use("/verify-login", async (req: Request, res: Response) => {
  try {
    await GetUserDetail(req, res);
  } catch (error) {
    console.error("Error in status route:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;
