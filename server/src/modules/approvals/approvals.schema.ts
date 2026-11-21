import { z } from "zod";

export const approvalDecisionSchema = z.object({
    decision: z.enum(["APPROVED", "REJECTED", "RETURNED"]),
    reason: z.string().optional()
}).refine(
    (data) => {
        if ((data.decision === "REJECTED" || data.decision === "RETURNED") && (!data.reason || !data.reason.trim())) {
            return false;
        }
        return true;
    },
    {
        message: "A clear reason is mandatory when rejecting or returning a batch for correction.",
        path: ["reason"]
    }
);

export type ApprovalDecisionInput = z.infer<typeof approvalDecisionSchema>;
