import type { Request, Response, NextFunction } from "express";
import { approvalDecisionSchema } from "./approvals.schema.js";
import { processApprovalDecision, getBatchAuditHistory } from "./approvals.service.js";

function getParamId(req: Request): string {
    const id = req.params.id;
    return Array.isArray(id) ? id[0] : id;
}

export async function handleApprovalDecision(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const batchId = getParamId(req);
        const input = approvalDecisionSchema.parse(req.body);
        const result = await processApprovalDecision(req.user!, batchId, input);

        res.status(200).json({
            success: true,
            message: result.message,
            data: result
        });
    } catch (err) {
        next(err);
    }
}

export async function handleGetBatchHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const batchId = getParamId(req);
        const history = await getBatchAuditHistory(req.user!, batchId);

        res.status(200).json({
            success: true,
            message: "Batch history retrieved",
            data: history
        });
    } catch (err) {
        next(err);
    }
}
