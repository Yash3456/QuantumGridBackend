import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { firstName, lastName, email, Mobile, userType } = req.body;

    if (!firstName || !lastName || !email || !Mobile || !userType) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: firstName, lastName, Mobile, userType, or email",
      });
      return;
    }

    // Insert into User table
    const { data: userData, error: userError } = await supabase
      .from("User")
      .insert([
        {
          email,
          userType,
          status: "pending",
          walletAddress: "",
          kycStatus: false,
          createdat: Date.now(),
          updatedat: Date.now(),
        },
      ])
      .select()
      .single(); // So we can get the inserted ID

    if (userError || !userData) {
      res.status(500).json({
        success: false,
        error: "Failed to create User",
      });
      return;
    }

    // Insert into UserProfile table
    const { data: profileData, error: profileError } = await supabase
      .from("UserProfile")
      .insert([
        {
          user_id: userData.id, // assuming you have a foreign key
          firstName,
          lastName,
          profilePictureUrl: "",
        },
      ])
      .select()
      .single();

    if (profileError) {
      res.status(500).json({
        success: false,
        error: "Failed to create UserProfile",
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        ...userData,
        profile: profileData,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({
      success: false,
      error: "An unexpected error occurred",
    });
  }
};
