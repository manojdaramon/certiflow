import { ApprovalDecision, ApprovalStage, BatchStatus, Role } from "@prisma/client";
import { prisma } from "../../config/database.js";
import type { JWTPayload } from "../../types/auth.js";
import type { ApprovalDecisionInput } from "./approvals.schema.js";

/**
 * Batches with candidates strictly greater than this threshold are
 * automatically routed through the Quality Assurance review stage.
 */
export const LARGE_BATCH_THRESHOLD = 25;

export async function processApprovalDecision(
    user: JWTPayload,
    batchId: string,
    input: ApprovalDecisionInput
) {
    return await prisma.$transaction(async (tx) => {
        // Concurrency protection: Lock the batch row for update
        const batches = await tx.$queryRaw<any[]>`
            SELECT * FROM "batches" WHERE "id" = ${batchId} FOR UPDATE
        `;

        if (!batches || batches.length === 0) {
            const error = new Error("Batch not found");
            (error as any).statusCode = 404;
            throw error;
        }

        const batch = batches[0];
        const currentVersion: number = batch.currentVersion;
        const currentStatus: BatchStatus = batch.status;

        // 1. Role & Status State Machine Validation
        if (currentStatus === BatchStatus.UNDER_DISTRICT_REVIEW) {
            if (user.role !== Role.DISTRICT_OFFICER) {
                const error = new Error("Forbidden: Only District Officers can act on batches under district review.");
                (error as any).statusCode = 403;
                throw error;
            }

            if (batch.district !== user.district) {
                const error = new Error(`Forbidden: You are only authorized to review batches for ${user.district} district.`);
                (error as any).statusCode = 403;
                throw error;
            }
        } else if (currentStatus === BatchStatus.UNDER_QUALITY_REVIEW) {
            if (user.role !== Role.QUALITY_TEAM) {
                const error = new Error("Forbidden: Only Quality Assurance team members can act on batches under quality review.");
                (error as any).statusCode = 403;
                throw error;
            }
        } else if (currentStatus === BatchStatus.UNDER_STATE_REVIEW) {
            if (user.role !== Role.STATE_OFFICE) {
                const error = new Error("Forbidden: Only State Office administrators can provide final state approval.");
                (error as any).statusCode = 403;
                throw error;
            }
        } else {
            const error = new Error(`Batch is in status '${currentStatus}' and cannot receive review decisions at this stage.`);
            (error as any).statusCode = 409;
            throw error;
        }

        let nextStatus: BatchStatus = currentStatus;
        let approvalStage: ApprovalStage = ApprovalStage.DISTRICT_FIRST;
        let actionMessage = "";

        // 2. Handle Rejection / Return for Correction
        if (input.decision === ApprovalDecision.REJECTED) {
            nextStatus = BatchStatus.REJECTED;
            actionMessage = `Batch rejected with reason: ${input.reason}`;
        } else if (input.decision === ApprovalDecision.RETURNED) {
            nextStatus = BatchStatus.RETURNED;
            actionMessage = `Batch returned to training centre for correction: ${input.reason}`;
        } else {
            // Decision is APPROVED
            if (currentStatus === BatchStatus.UNDER_DISTRICT_REVIEW) {
                // Fetch district approvals for the current submission version
                const versionApprovals = await tx.approval.findMany({
                    where: {
                        batchId,
                        submissionVersion: currentVersion,
                        decision: ApprovalDecision.APPROVED,
                        stage: { in: [ApprovalStage.DISTRICT_FIRST, ApprovalStage.DISTRICT_SECOND] }
                    }
                });

                // Rule: An officer cannot approve twice
                const alreadyApproved = versionApprovals.some((a) => a.officerId === user.userId);
                if (alreadyApproved) {
                    const error = new Error(
                        "You have already provided an approval for this submission version. A second, different district officer is required to approve."
                    );
                    (error as any).statusCode = 409;
                    throw error;
                }

                if (versionApprovals.length === 0) {
                    approvalStage = ApprovalStage.DISTRICT_FIRST;
                    nextStatus = BatchStatus.UNDER_DISTRICT_REVIEW; // Remains in review until second approval
                    actionMessage = "First district approval recorded. Awaiting second officer approval.";
                } else if (versionApprovals.length === 1) {
                    approvalStage = ApprovalStage.DISTRICT_SECOND;

                    // Dual consensus achieved! Advance to Quality or State based on threshold
                    if (batch.candidateCount > LARGE_BATCH_THRESHOLD) {
                        nextStatus = BatchStatus.UNDER_QUALITY_REVIEW;
                        actionMessage = `Second district approval recorded. Batch has ${batch.candidateCount} candidates (> ${LARGE_BATCH_THRESHOLD}), routed to Quality Team for scrutiny.`;
                    } else {
                        nextStatus = BatchStatus.UNDER_STATE_REVIEW;
                        actionMessage = "Second district approval recorded. Routed to State Directorate for final authorization.";
                    }
                } else {
                    const error = new Error("District review quota already completed for this batch.");
                    (error as any).statusCode = 409;
                    throw error;
                }
            } else if (currentStatus === BatchStatus.UNDER_QUALITY_REVIEW) {
                approvalStage = ApprovalStage.QUALITY_REVIEW;
                nextStatus = BatchStatus.UNDER_STATE_REVIEW;
                actionMessage = "Quality Assurance review approved. Routed to State Directorate for final authorization.";
            } else if (currentStatus === BatchStatus.UNDER_STATE_REVIEW) {
                approvalStage = ApprovalStage.STATE_FINAL;
                nextStatus = BatchStatus.APPROVED;
                actionMessage = "Final State approval granted. Batch is certified and ready for certificate issuance.";
            }
        }

        // 3. Record Approval Entity
        const createdApproval = await tx.approval.create({
            data: {
                batchId,
                submissionVersion: currentVersion,
                stage: approvalStage,
                officerId: user.userId,
                decision: input.decision,
                reason: input.reason || null
            },
            include: {
                officer: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        district: true
                    }
                }
            }
        });

        // 4. Update Batch State
        const updatedBatch = await tx.batch.update({
            where: { id: batchId },
            data: {
                status: nextStatus,
                approvedAt: nextStatus === BatchStatus.APPROVED ? new Date() : batch.approvedAt
            }
        });

        // 5. Append-only Immutable Audit Log
        await tx.auditLog.create({
            data: {
                actorId: user.userId,
                actorEmail: user.email,
                actorRole: user.role,
                action: `DECISION_${input.decision}_AT_${approvalStage}`,
                entityType: "BATCH",
                entityId: batchId,
                previousState: { status: currentStatus, version: currentVersion },
                newState: { status: nextStatus, version: currentVersion },
                reason: input.reason || actionMessage,
                submissionVersion: currentVersion
            }
        });

        return {
            approval: createdApproval,
            batch: updatedBatch,
            message: actionMessage
        };
    });
}

export async function getBatchAuditHistory(user: JWTPayload, batchId: string) {
    const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        select: { id: true, district: true, trainingCentreId: true }
    });

    if (!batch) {
        const error = new Error("Batch not found");
        (error as any).statusCode = 404;
        throw error;
    }

    // Role scoping
    if (user.role === Role.TRAINING_CENTRE && batch.trainingCentreId !== user.trainingCentreId) {
        const error = new Error("Forbidden: You cannot view audit history for another centre's batch");
        (error as any).statusCode = 403;
        throw error;
    }

    if (user.role === Role.DISTRICT_OFFICER && batch.district !== user.district) {
        const error = new Error(`Forbidden: You can only view audit history for ${user.district} batches`);
        (error as any).statusCode = 403;
        throw error;
    }

    const [approvals, auditLogs] = await Promise.all([
        prisma.approval.findMany({
            where: { batchId },
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
            orderBy: { createdAt: "desc" }
        }),
        prisma.auditLog.findMany({
            where: { entityType: "BATCH", entityId: batchId },
            include: {
                actor: {
                    select: {
                        id: true,
                        name: true,
                        role: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        })
    ]);

    return {
        approvals,
        auditLogs
    };
}
