import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 * Catches all errors and formats the response
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  // if (err.name === 'CastError') {
  //   const message = 'Resource not found';
  //   error = new AppError(message, 404);
  // }

  // Mongoose duplicate key
  // if (err.name === 'MongoError' && (err as any).code === 11000) {
  //   const message = 'Duplicate field value entered';
  //   error = new AppError(message, 400);
  // }

  // Mongoose validation error
  // if (err.name === 'ValidationError') {
  //   const message = Object.values((err as any).errors).map((val: any) => val.message);
  //   error = new AppError(message.join(', '), 400);
  // }

  res.status((error as AppError).statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Async error wrapper to catch errors in async routes
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);
