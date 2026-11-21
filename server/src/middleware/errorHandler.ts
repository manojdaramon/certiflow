import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export interface AppError extends Error {
    statusCode?: number;
    errors?: unknown;
}

export function errorHandler(
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    const statusCode = err.statusCode || (err instanceof ZodError ? 400 : 500);

    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: err.errors
        });
        return;
    }

    const message = statusCode === 500 && process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "An unexpected error occurred";

    res.status(statusCode).json({
        success: false,
        message,
        ...(err.errors ? { errors: err.errors } : {})
    });
}
