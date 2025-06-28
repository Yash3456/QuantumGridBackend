import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";

declare global {
  var __db__: PrismaClient;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    log: ["error", "warn"],
  });
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient({
      log: ["query", "info", "warn", "error"],
    });
  }
  prisma = global.__db__;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info("✅ Database connection established");
  } catch (error) {
    logger.error("❌ Database connection failed:", error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info("🔌 Database disconnected");
  } catch (error) {
    logger.error("❌ Database disconnection failed:", error);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await disconnectDatabase();
  process.exit(0);
});

export { prisma };
