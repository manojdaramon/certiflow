import type { Request, Response, NextFunction } from "express";
import { loginSchema } from "./auth.schema.js";
import { loginUser, getCurrentUser } from "./auth.service.js";

export async function handleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const input = loginSchema.parse(req.body);
        const result = await loginUser(input);
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: result
        });
    } catch (err) {
        next(err);
    }
}

export async function handleGetMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.user!.userId;
        const user = await getCurrentUser(userId);
        res.status(200).json({
            success: true,
            message: "User profile fetched",
            data: user
        });
    } catch (err) {
        next(err);
    }
}
