import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Multer config for memory storage
const storage = multer.memoryStorage();
export const upload = multer({ storage });

export const uploadMultipleDocuments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    const username = req.body.username;

    if (!files || files.length === 0 || !username) {
      res.status(400).json({
        success: false,
        error: "Missing files or username",
      });
      return;
    }

    // ✅ Step 1: Split username into firstName and lastName
    const [firstName, lastName] = username.trim().split(" ");

    if (!firstName || !lastName) {
      res.status(400).json({
        success: false,
        error: "Please provide both first and last name in username",
      });
      return;
    }

    // ✅ Step 2: Query Supabase to get userId using both names
    const { data, error } = await supabase
      .from("user_profile") // Replace with your actual profile table
      .select("userId") // Replace with actual field name if different
      .eq("firstName", firstName)
      .eq("lastName", lastName)
      .single();

    if (error || !data) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    const userId = data.userId;
    const uploadedFiles: { name: string; url: string }[] = [];

    for (const file of files) {
      const path = `${userId}/${Date.now()}-${file.originalname}`;

      const { error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET!)
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error(
          "Upload failed for",
          file.originalname,
          uploadError.message
        );
        continue;
      }

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${process.env.SUPABASE_STORAGE_BUCKET}/${path}`;
      uploadedFiles.push({ name: file.originalname, url: publicUrl });
    }

    res.status(200).json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while uploading documents",
    });
  }
};
