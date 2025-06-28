import { Request, Response, NextFunction } from "express";
import { body, query, param, validationResult } from "express-validator";

// Validation error handler
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.type === "field" ? (error as any).path : "unknown",
        message: error.msg,
        value: error.type === "field" ? (error as any).value : undefined,
      })),
    });
    return;
  }

  next();
};

// User registration validation
export const validateUserRegistration = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  body("user_type")
    .isIn(["SELLER", "BUYER", "PROSUMER"])
    .withMessage("User type must be SELLER, BUYER, or PROSUMER"),
  body("first_name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("last_name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  handleValidationErrors,
];

// Energy source validation
export const validateEnergySource = [
  body("source_type")
    .isIn(["SOLAR", "WIND", "HYDRO"])
    .withMessage("Source type must be SOLAR, WIND, or HYDRO"),
  body("capacity_kw")
    .isFloat({ min: 0.1, max: 10000 })
    .withMessage("Capacity must be between 0.1 and 10,000 kW"),
  body("efficiency_rating")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Efficiency rating must be between 0 and 100"),
  body("installation_date")
    .isISO8601()
    .withMessage("Please provide a valid installation date"),
  body("location.coordinates")
    .isArray({ min: 2, max: 2 })
    .withMessage(
      "Location coordinates must be an array of [longitude, latitude]"
    ),
  body("location.coordinates.*")
    .isFloat()
    .withMessage("Coordinates must be valid numbers"),
  handleValidationErrors,
];

// Trade execution validation
export const validateTradeExecution = [
  body("offer_id").isUUID().withMessage("Please provide a valid offer ID"),
  body("quantity_kwh")
    .isFloat({ min: 0.1 })
    .withMessage("Quantity must be greater than 0.1 kWh"),
  body("agreed_price_per_kwh")
    .isFloat({ min: 0.01 })
    .withMessage("Price must be greater than ₹0.01 per kWh"),
  handleValidationErrors,
];

// Pagination validation
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];
