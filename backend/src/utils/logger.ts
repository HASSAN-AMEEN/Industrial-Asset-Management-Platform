import morgan from 'morgan';
import { Request, Response } from 'express';

/**
 * Logging utility for the application
 * Uses Morgan for HTTP request logging
 */

// Custom Morgan token for request ID
morgan.token('id', (req: Request) => req.headers['x-request-id'] as string || 'N/A');

// Custom format for development
const developmentFormat = ':id :method :url :status :response-time ms - :res[content-length]';

// Custom format for production
const productionFormat = ':id :method :url :status :response-time ms - :remote-addr';

/**
 * Get Morgan middleware based on environment
 */
export const httpLogger = () => {
  if (process.env.NODE_ENV === 'production') {
    return morgan(productionFormat);
  }
  return morgan(developmentFormat);
};

/**
 * Application logger for general logging
 */
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
};
