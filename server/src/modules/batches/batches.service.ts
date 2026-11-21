import { BatchStatus, Role } from "@prisma/client";
import { prisma } from "../../config/database.js";
import type { JWTPayload } from "../../types/auth.js";
import type { CreateBatchInput, AddCandidateInput } from "./batches.schema.js";
import { validateCandidateCSV } from "./csv-parser.js";

/**
 * Generates an official, human-readable batch identifier.
 */
function generateBatchNumber(district: string): string {
    const year = new Date().getFullYear();
    const distCode = (district || "HYD").substring(0, 3).toUpperCase();
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    return `BATCH-${distCode}-${year}-${randomHex}`;
}

export async function createBatch(user: JWTPayload, input: CreateBatchInput) {
    if (!user.trainingCentreId) {
        const error = new Error("User is not associated with an accredited training centre");
        (error as any).statusCode = 403;
        throw error;
    }

    const tc = await prisma.trainingCentre.findUnique({
        where: { id: user.trainingCentreId }
    });

    if (!tc) {
        const error = new Error("Associated training centre not found");
        (error as any).statusCode = 404;
        throw error;
    }

    const district = input.district || user.district || tc.district;
    const batchNumber = generateBatchNumber(district);

    const batch = await prisma.$transaction(async (tx) => {
        const created = await tx.batch.create({
            data: {
                batchNumber,
                courseName: input.courseName,
                trainingCentreId: tc.id,
                district,
                status: BatchStatus.DRAFT,
                currentVersion: 1,
                candidateCount: 0
            },
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

        await tx.auditLog.create({
            data: {
                actorId: user.userId,
                actorEmail: user.email,
                actorRole: user.role,
                action: "BATCH_CREATED",
                entityType: "BATCH",
                entityId: created.id,
                newState: {
                    batchNumber: created.batchNumber,
                    courseName: created.courseName,
                    district: created.district,
                    status: created.status
                },
                submissionVersion: 1
            }
        });

        return created;
    });

    return batch;
}

export async function listBatches(user: JWTPayload) {
    let whereClause: any = {};

    if (user.role === Role.TRAINING_CENTRE) {
        if (!user.trainingCentreId) return [];
        whereClause = { trainingCentreId: user.trainingCentreId };
    } else if (user.role === Role.DISTRICT_OFFICER) {
        whereClause = {
            district: user.district || undefined,
            status: { not: BatchStatus.DRAFT }
        };
    } else if (user.role === Role.QUALITY_TEAM) {
        whereClause = {
            status: { in: [BatchStatus.UNDER_QUALITY_REVIEW, BatchStatus.UNDER_STATE_REVIEW, BatchStatus.APPROVED] }
        };
    } else if (user.role === Role.STATE_OFFICE) {
        // State office sees all submitted batches
        whereClause = {
            status: { not: BatchStatus.DRAFT }
        };
    }

    const batches = await prisma.batch.findMany({
        where: whereClause,
        include: {
            trainingCentre: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                    district: true
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    return batches;
}

export async function getBatchById(user: JWTPayload, batchId: string) {
    const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        include: {
            trainingCentre: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                    district: true
                }
            },
            candidates: {
                orderBy: { fullName: "asc" }
            },
            approvals: {
                include: {
                    officer: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
                            district: true
                        }
                    }
                },
                orderBy: { createdAt: "asc" }
            }
        }
    });

    if (!batch) {
        const error = new Error("Batch not found");
        (error as any).statusCode = 404;
        throw error;
    }

    // Role-based resource authorization check (IDOR protection)
    if (user.role === Role.TRAINING_CENTRE && batch.trainingCentreId !== user.trainingCentreId) {
        const error = new Error("Forbidden: You do not have permission to view batches from another training centre");
        (error as any).statusCode = 403;
        throw error;
    }

    if (user.role === Role.DISTRICT_OFFICER && batch.district !== user.district) {
        const error = new Error(`Forbidden: You are only authorized to view batches within ${user.district} district`);
        (error as any).statusCode = 403;
        throw error;
    }

    return batch;
}

export async function addCandidateManually(user: JWTPayload, batchId: string, input: AddCandidateInput) {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });

    if (!batch) {
        const error = new Error("Batch not found");
        (error as any).statusCode = 404;
        throw error;
    }

    if (batch.trainingCentreId !== user.trainingCentreId) {
        const error = new Error("Forbidden: You can only modify batches belonging to your training centre");
        (error as any).statusCode = 403;
        throw error;
    }

    if (batch.status !== BatchStatus.DRAFT && batch.status !== BatchStatus.RETURNED) {
        const error = new Error(`Cannot add candidates when batch status is '${batch.status}'`);
        (error as any).statusCode = 409;
        throw error;
    }

    // Check duplicate nationalId
    const existing = await prisma.candidate.findUnique({
        where: {
            batchId_nationalId: {
                batchId,
                nationalId: input.nationalId.trim()
            }
        }
    });

    if (existing) {
        const error = new Error(`A candidate with National ID '${input.nationalId}' already exists in this batch`);
        (error as any).statusCode = 409;
        throw error;
    }

    const candidate = await prisma.$transaction(async (tx) => {
        const created = await tx.candidate.create({
            data: {
                batchId,
                fullName: input.fullName.trim(),
                nationalId: input.nationalId.trim(),
                phone: input.phone.trim(),
                email: input.email ? input.email.trim() : null,
                grade: input.grade.trim(),
                completionDate: new Date(input.completionDate)
            }
        });

        await tx.batch.update({
            where: { id: batchId },
            data: {
                candidateCount: { increment: 1 }
            }
        });

        return created;
    });

    return candidate;
}

export async function importCandidatesCSV(user: JWTPayload, batchId: string, csvContent: string) {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });

    if (!batch) {
        const error = new Error("Batch not found");
        (error as any).statusCode = 404;
        throw error;
    }

    if (batch.trainingCentreId !== user.trainingCentreId) {
        const error = new Error("Forbidden: You can only upload candidates to your training centre's batches");
        (error as any).statusCode = 403;
        throw error;
    }

    if (batch.status !== BatchStatus.DRAFT && batch.status !== BatchStatus.RETURNED) {
        const error = new Error(`Cannot upload candidates when batch status is '${batch.status}'`);
        (error as any).statusCode = 409;
        throw error;
    }

    // 1. Strict All-or-Nothing Parse and Validation
    const validationResult = validateCandidateCSV(csvContent);

    if (!validationResult.isValid) {
        const error = new Error(`Spreadsheet validation failed with ${validationResult.errors.length} error(s). Nothing was saved.`);
        (error as any).statusCode = 400;
        (error as any).errors = validationResult.errors;
        throw error;
    }

    // 2. All-or-Nothing Transactional Persist
    const result = await prisma.$transaction(async (tx) => {
        // Replace existing candidates on fresh upload or append
        // To allow centre to fix errors and re-upload cleanly, replace existing candidates
        await tx.candidate.deleteMany({
            where: { batchId }
        });

        // Bulk insert
        await tx.candidate.createMany({
            data: validationResult.candidates.map((c) => ({
                batchId,
                fullName: c.fullName,
                nationalId: c.nationalId,
                phone: c.phone,
                email: c.email || null,
                grade: c.grade,
                completionDate: c.completionDate
            }))
        });

        // Update batch candidate count
        const updatedBatch = await tx.batch.update({
            where: { id: batchId },
            data: {
                candidateCount: validationResult.candidates.length
            }
        });

        // Record Audit
        await tx.auditLog.create({
            data: {
                actorId: user.userId,
                actorEmail: user.email,
                actorRole: user.role,
                action: "CANDIDATES_IMPORTED",
                entityType: "BATCH",
                entityId: batchId,
                newState: {
                    importedCandidatesCount: validationResult.candidates.length,
                    submissionVersion: batch.currentVersion
                },
                submissionVersion: batch.currentVersion
            }
        });

        return {
            importedCount: validationResult.candidates.length,
            batch: updatedBatch
        };
    });

    return result;
}

export async function submitBatchForApproval(user: JWTPayload, batchId: string) {
    const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        include: { candidates: true }
    });

    if (!batch) {
        const error = new Error("Batch not found");
        (error as any).statusCode = 404;
        throw error;
    }

    if (batch.trainingCentreId !== user.trainingCentreId) {
        const error = new Error("Forbidden: You can only submit batches belonging to your training centre");
        (error as any).statusCode = 403;
        throw error;
    }

    if (batch.status !== BatchStatus.DRAFT && batch.status !== BatchStatus.RETURNED) {
        const error = new Error(`Batch cannot be submitted from status '${batch.status}'`);
        (error as any).statusCode = 409;
        throw error;
    }

    if (batch.candidateCount === 0 || batch.candidates.length === 0) {
        const error = new Error("Cannot submit an empty batch. Please add or upload candidates before submitting.");
        (error as any).statusCode = 400;
        throw error;
    }

    const isResubmission = batch.status === BatchStatus.RETURNED;
    const nextVersion = isResubmission ? batch.currentVersion + 1 : batch.currentVersion;

    const submitted = await prisma.$transaction(async (tx) => {
        const updated = await tx.batch.update({
            where: { id: batchId },
            data: {
                status: BatchStatus.UNDER_DISTRICT_REVIEW,
                submittedAt: new Date(),
                currentVersion: nextVersion
            }
        });

        await tx.auditLog.create({
            data: {
                actorId: user.userId,
                actorEmail: user.email,
                actorRole: user.role,
                action: isResubmission ? "BATCH_RESUBMITTED" : "BATCH_SUBMITTED",
                entityType: "BATCH",
                entityId: batchId,
                previousState: { status: batch.status, version: batch.currentVersion },
                newState: { status: updated.status, version: updated.currentVersion },
                submissionVersion: nextVersion
            }
        });

        return updated;
    });

    return submitted;
}
