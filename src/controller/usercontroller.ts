import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { SendOtp, VerifyOtp } from "./OTPVerification";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: email or password",
      });
      return;
    }

    await SendOtp(req, res);

    res.status(200).json({ success: true, message: "OTP Send successful" });

    // Fetch user from Supabase
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "An unexpected error occurred",
    });
  }
};

export const GetUserDetail = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const isvalidotp = await VerifyOtp(req, res);
    console.log("❌ Supasbase hit");
    const { data, error } = await supabase
      .from("UserProfile") // Replace "UserProfile" with your actual table name
      .select("*")
      .eq("email", email)
      .single();
    console.log("❌ Supasbase retirved data", data);
    if (error || !data) {
      res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
      return;
    }
    console.log("❌ Supasbase retirved data validation checked");
    // Verify password (assuming passwords are stored securely, e.g., hashed)

    if (!isvalidotp) {
      res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: data.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "An unexpected error occurred while fetching user details",
    });
  }
};
