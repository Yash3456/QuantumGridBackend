import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prismaconnect";
import { environment } from "../config/environment";
import logger from "../utils/logger";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    user_type: string;
    status: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "Access denied. No valid token provided.",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = jwt.verify(token, environment.JWT_SECRET) as any;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        user_type: true,
        status: true,
        is_active: true,
      },
    });

    if (!user || !user.is_active) {
      res.status(401).json({
        success: false,
        error: "Invalid token or user not found.",
      });
      return;
    }

    if (user.status === "SUSPENDED") {
      res.status(403).json({
        success: false,
        error: "Account suspended. Contact support.",
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error("Auth middleware error:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: "Invalid token.",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Authentication error.",
    });
  }
};

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
      return;
    }

    if (!roles.includes(req.user.user_type)) {
      res.status(403).json({
        success: false,
        error: "Insufficient permissions.",
      });
      return;
    }

    next();
  };
};

// Optional auth middleware (doesn't require authentication)
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header("Authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, environment.JWT_SECRET) as any;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          user_type: true,
          status: true,
          is_active: true,
        },
      });

      if (user && user.is_active && user.status !== "SUSPENDED") {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
