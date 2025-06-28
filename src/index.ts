import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./Db/db";
import MainRoutes from "./Routes/main";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to DB
connectDB();

// Middleware
app.use(cors()); // Enable CORS
app.use(helmet()); // Secure headers
app.use(morgan("dev")); // Logging requests
app.use(express.json()); // Parse JSON bodies

// Routes
app.use("/api", MainRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("✅ OTP Verification Service is Live");
});

// Fallback for 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware (optional)
app.use(((
  err: any,
  req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something broke!", error: err.message });
}) as express.ErrorRequestHandler);

app.listen(5000, '0.0.0.0', () => {
  console.log("Server running on port 5000");
});

