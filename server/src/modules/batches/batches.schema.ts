import { z } from "zod";

export const createBatchSchema = z.object({
    courseName: z.string().min(3, "Course name must be at least 3 characters long"),
    district: z.string().optional()
});

export const addCandidateSchema = z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    nationalId: z.string().min(4, "National ID must be at least 4 characters"),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid 10-digit Indian mobile number"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    grade: z.string().min(1, "Grade is required"),
    completionDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid completion date"
    })
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type AddCandidateInput = z.infer<typeof addCandidateSchema>;
