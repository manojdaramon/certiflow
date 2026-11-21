import type { Role } from "@prisma/client";

export interface JWTPayload {
    userId: string;
    email: string;
    name: string;
    role: Role;
    district: string | null;
    trainingCentreId: string | null;
}

declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}
