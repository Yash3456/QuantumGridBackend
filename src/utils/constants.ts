export const USER_TYPES = {
  SELLER: "SELLER",
  BUYER: "BUYER",
  PROSUMER: "PROSUMER",
  GOVT_AUTHORITY: "GOVT_AUTHORITY",
  MARKET_MANAGER: "MARKET_MANAGER",
} as const;

export const USER_STATUS = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  SUSPENDED: "SUSPENDED",
  REJECTED: "REJECTED",
} as const;

export const ENERGY_SOURCES = {
  SOLAR: "SOLAR",
  WIND: "WIND",
  HYDRO: "HYDRO",
} as const;

export const TRADE_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  DISPUTED: "DISPUTED",
  CANCELLED: "CANCELLED",
} as const;

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

export const API_RESPONSE_MESSAGES = {
  SUCCESS: "Operation completed successfully",
  VALIDATION_ERROR: "Validation failed",
  UNAUTHORIZED: "Access denied",
  FORBIDDEN: "Insufficient permissions",
  NOT_FOUND: "Resource not found",
  CONFLICT: "Resource already exists",
  INTERNAL_ERROR: "Internal server error",
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
