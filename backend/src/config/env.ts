import dotenv from "dotenv";
import path from "path";

/**
 * Environment configuration
 * Loads and validates environment variables
 */

// Load local overrides first, then base env defaults.
// This keeps machine-specific development values in .env.local and leaves production untouched.
dotenv.config({ path: path.join(__dirname, "../../.env.local") });
dotenv.config({ path: path.join(__dirname, "../../.env") });

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  FRONTEND_URL: string;
  BASE_URL: string;
}

// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
}

const port = parseInt(process.env.PORT || "5000", 10);

export const config: EnvConfig = {
  PORT: port,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:19006",
  BASE_URL: process.env.BASE_URL || `http://localhost:${port}`,
};

export default config;
