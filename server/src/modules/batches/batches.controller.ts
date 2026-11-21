import type { Request, Response, NextFunction } from "express";
import { createBatchSchema, addCandidateSchema } from "./batches.schema.js";
import {
    createBatch,
    listBatches,
    getBatchById,
    addCandidateManually,
    importCandidatesCSV,
    submitBatchForApproval
} from "./batches.service.js";

function getParamId(req: Request): string {
    const id = req.params.id;
    return Array.isArray(id) ? id[0] : id;
}

export async function handleCreateBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const input = createBatchSchema.parse(req.body);
        const batch = await createBatch(req.user!, input);
        res.status(201).json({
            success: true,
            message: "Batch created successfully in draft mode",
            data: batch
        });
    } catch (err) {
        next(err);
    }
}

export async function handleListBatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const batches = await listBatches(req.user!);
        res.status(200).json({
            success: true,
            message: "Batches retrieved",
            data: batches
        });
    } catch (err) {
        next(err);
    }
}

export async function handleGetBatchById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const batchId = getParamId(req);
        const batch = await getBatchById(req.user!, batchId);
        res.status(200).json({
            success: true,
            message: "Batch retrieved",
            data: batch
        });
    } catch (err) {
        next(err);
    }
}

export async function handleAddCandidate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const batchId = getParamId(req);
        const input = addCandidateSchema.parse(req.body);
        const candidate = await addCandidateManually(req.user!, batchId, input);
        res.status(201).json({
            success: true,
            message: "Candidate registered successfully",
            data: candidate
        });
    } catch (err) {
        next(err);
    }
}

export async function handleUploadCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const batchId = getParamId(req);
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: "No CSV spreadsheet file provided in request."
            });
            return;
        }

        const csvContent = req.file.buffer.toString("utf-8");
        const result = await importCandidatesCSV(req.user!, batchId, csvContent);

        res.status(200).json({
            success: true,
            message: `Successfully validated and imported ${result.importedCount} candidate(s)`,
            data: result
        });
    } catch (err) {
        next(err);
    }
}

export async function handleSubmitBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const batchId = getParamId(req);
        const batch = await submitBatchForApproval(req.user!, batchId);
        res.status(200).json({
            success: true,
            message: "Batch successfully submitted for district approval",
            data: batch
        });
    } catch (err) {
        next(err);
    }
}
