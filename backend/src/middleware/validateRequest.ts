import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import Logger from "../utils/logger";

/**
 * Middleware to validate request body, params, or query against a Zod schema.
 * @param schema The Zod schema to validate against.
 */
const validateRequest =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));

        Logger.warn("Request validation failed", {
          errors: formattedErrors,
          request: {
            method: req.method,
            url: req.originalUrl,
            body: req.body,
            params: req.params,
          },
        });

        const validationError: any = new Error("Input validation failed");
        validationError.statusCode = 400;
        validationError.details = formattedErrors;
        return next(validationError);
      } else {
        Logger.error("Unexpected error during validation", { error });
        return next(error);
      }
    }
  };

export default validateRequest;
