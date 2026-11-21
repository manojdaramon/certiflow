import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import type { JWTPayload } from "../../types/auth.js";
import type { LoginInput } from "./auth.schema.js";

export async function loginUser(input: LoginInput) {
    const user = await prisma.user.findUnique({
        where: { email: input.email.toLowerCase().trim() },
        include: {
            trainingCentre: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                    district: true
                }
            }
        }
    });

    if (!user) {
        const error = new Error("Invalid email or password");
        (error as any).statusCode = 401;
        throw error;
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
        const error = new Error("Invalid email or password");
        (error as any).statusCode = 401;
        throw error;
    }

    const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        district: user.district,
        trainingCentreId: user.trainingCentreId
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: "24h"
    });

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            district: user.district,
            trainingCentre: user.trainingCentre
        }
    };
}

export async function getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            district: true,
            trainingCentre: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                    district: true
                }
            }
        }
    });

    if (!user) {
        const error = new Error("User not found");
        (error as any).statusCode = 404;
        throw error;
    }

    return user;
}
