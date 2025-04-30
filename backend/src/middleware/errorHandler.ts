import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import Logger from "../utils/logger";

/**
 * Express error handling middleware.
 * Catches errors passed via next(error), logs them, and sends a standardized response.
 */
const errorHandler: ErrorRequestHandler = (
  err: any, // Using 'any' for broader compatibility, can be refined
  req: Request,
  res: Response,
  next: NextFunction // Important: Must be included even if not used for Express to recognize it as error handler
) => {
  // Log the error with more context
  const errorMessage = err.message || "An unknown error occurred";
  Logger.error(
    `Error occurred on ${req.method} ${req.originalUrl}: ${errorMessage}`,
    {
      error: {
        message: errorMessage,
        stack: err.stack,
        // Add other relevant error properties if needed (e.g., err.code)
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        headers: req.headers,
        body: req.body, // Be cautious logging body in production (sensitive data)
      },
    }
  );

  // Determine status code
  // Use error's status code if available, otherwise default to 500
  const statusCode = typeof err.statusCode === "number" ? err.statusCode : 500;

  // Determine response message
  // In development or for client errors (4xx), show the original message.
  // For server errors (5xx) in production, show a generic message.
  const isDevelopment = process.env.NODE_ENV === "development";
  const responseMessage =
    isDevelopment || statusCode < 500 ? errorMessage : "Internal Server Error";

  // Send standardized JSON response
  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: responseMessage,
    // Optionally include stack trace in development
    ...(isDevelopment && { stack: err.stack }),
  });
};

export default errorHandler;
