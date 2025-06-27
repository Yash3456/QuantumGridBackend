// src/routes/route.ts
import express, { response } from "express";

// Import individual route modules
import OTPRoutes from "./Authentication";

// Main router
const router = express.Router();

// Prefix routes
// router.use("/energy", energyRoutes);
// router.use("/users", userRoutes);
// router.use("/transactions", transactionRoutes);
router.use("/otp", OTPRoutes);

export default router;
