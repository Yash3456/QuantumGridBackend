import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// ✅ Export multer instance
const storage = multer.memoryStorage();
export const upload = multer({ storage });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const uploadImagesAndSaveUrls = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = req.files as {
      frontImage?: Express.Multer.File[];
      backImage?: Express.Multer.File[];
    };

    const username = req.body.username;

    if (!files.frontImage || !files.backImage || !username) {
      res.status(400).json({
        success: false,
        error: "Both images and username are required",
      });
      return;
    }

    const frontFile = files.frontImage[0];
    const backFile = files.backImage[0];

    // Construct upload paths
    const timestamp = Date.now();
    const frontPath = `${username}/${timestamp}-front-${frontFile.originalname}`;
    const backPath = `${username}/${timestamp}-back-${backFile.originalname}`;

    // Upload to Supabase
    const frontUpload = await supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET!)
      .upload(frontPath, files.frontImage[0].buffer);

    const backUpload = await supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET!)
      .upload(backPath, files.backImage[0].buffer);

    console.log("Front Upload:", frontUpload.error, backUpload.error);

    if (frontUpload.error || backUpload.error) {
      res.status(500).json({
        success: false,
        error:
          frontUpload.error?.message ||
          backUpload.error?.message ||
          "Upload failed",
      });
      return;
    }

    console.log("Front Upload3:");

    // Generate public URLs
    // const frontUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_STORAGE_BUCKET}/${frontPath}`;
    // const backUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_STORAGE_BUCKET}/${backPath}`;

    const frontUrl = await supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET!)
      .getPublicUrl(frontPath);
    const backUrl = await supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET!)
      .getPublicUrl(backPath);

    console.log("Front Upload2:");

    // ✅ Insert URLs into your Supabase DB table
    // const { error: dbError } = await supabase.from("").insert([
    //   {
    //     username: username,
    //     front_url: frontUrl,
    //     back_url: backUrl,
    //   },
    // ]);

    // if (dbError) {
    //   res.status(500).json({
    //     success: false,
    //     error: dbError.message,
    //   });
    //   return;
    // }

    res.status(200).json({
      success: true,
      message: "Images uploaded and saved successfully",
      frontImageUrl: frontUrl.data.publicUrl,
      backImageUrl: backUrl.data.publicUrl,
    });
  } catch (err) {
    console.error("Error uploading images:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
