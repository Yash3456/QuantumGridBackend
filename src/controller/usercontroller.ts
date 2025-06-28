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

    // Validate input
    if (!firstName || !lastName || !email || !Mobile || !userType) {
      res.status(400).json({
        success: false,
        error:
          "Missing required fields: firstName, lastName, Mobile, userTpye or email",
      });
      return;
    }

    // Insert user data into Supabase
    const { data, error: Error } = await supabase
      .from("User") // Replace "UserProfile" with your actual table name
      .insert([
        {
          email,
          userType,
          status: pending,
          walletAddress: "",
          kycStatus: false,
          createdat: Date.now(),
          updatedat: Date.now(),
        },
      ]);

      const { result, error} = await supabase.from("UserProfile").insert([
        data.id,
        firstName,
        lastName,
        profilePictureUrl:"",
      ]),

    if (error) {
      res.status(500).json({
        success: false,
        error: "Failed to create user",
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "An unexpected error occurred",
    });
  }
};
