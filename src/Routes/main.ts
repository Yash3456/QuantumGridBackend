// src/routes/route.ts
import express, { response } from "express";

// Import individual route modules
import OTPRoutes from "./Authentication";
import { upload, uploadMultipleDocuments } from "../Services/DocumentService";

// Main router
const router = express.Router();

// Prefix routes
// router.use("/energy", energyRoutes);
// router.use("/users", userRoutes);
// router.use("/transactions", transactionRoutes);
router.use("/otp", OTPRoutes);
router.post("/upload", upload.array("documents", 10), uploadMultipleDocuments);

export default router;
