/** React imports */
import { useEffect, useState } from "react";

/** Services */
import { fetchBatches } from "../../services/batches.js";

/** Components */
import CreateBatchModal from "./CreateBatchModal.jsx";

/** Styles */
import styles from "./batch-list.module.css";

const STATUS_BADGES = {
    DRAFT: { label: "Draft", className: styles.statusDraft },
    SUBMITTED: { label: "Submitted", className: styles.statusSubmitted },
    UNDER_DISTRICT_REVIEW: { label: "District Review", className: styles.statusReview },
    UNDER_QUALITY_REVIEW: { label: "Quality Review", className: styles.statusReview },
    UNDER_STATE_REVIEW: { label: "State Review", className: styles.statusReview },
    APPROVED: { label: "Approved", className: styles.statusApproved },
    REJECTED: { label: "Rejected", className: styles.statusRejected },
    RETURNED: { label: "Returned", className: styles.statusReturned }
};

const BatchList = ({ user, onSelectBatch }) => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const loadBatches = async () => {
        try {
            setLoading(true);
            const data = await fetchBatches();
            setBatches(data);
        } catch (err) {
            setError(err.message || "Failed to load batches");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBatches();
    }, [user]);

    const handleCreated = (newBatch) => {
        setBatches([newBatch, ...batches]);
        if (onSelectBatch) {
            onSelectBatch(newBatch.id);
        }
    };

    const isTC = user.role === "TRAINING_CENTRE";

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>
                        {isTC ? "Training Centre Batches" : "Batch Overview Queue"}
                    </h2>
                    <p className={styles.subtitle}>
                        {isTC
                            ? "Create, upload candidate spreadsheets, and submit batches for district review."
                            : "Batches registered across districts under your jurisdiction."}
                    </p>
                </div>

                {isTC && (
                    <button
                        className={styles.createBtn}
                        onClick={() => setIsCreateOpen(true)}
                    >
                        + Create New Batch
                    </button>
                )}
            </div>

            {error && <div className={styles.errorAlert}>{error}</div>}

            {loading ? (
                <div className={styles.loadingState}>Loading batches...</div>
            ) : batches.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📁</div>
                    <h3 className={styles.emptyTitle}>No Batches Found</h3>
                    <p className={styles.emptyDesc}>
                        {isTC
                            ? "Get started by creating your first candidate batch for certification."
                            : "No batches currently registered under this jurisdiction."}
                    </p>
                    {isTC && (
                        <button
                            className={styles.createBtn}
                            onClick={() => setIsCreateOpen(true)}
                        >
                            + Create First Batch
                        </button>
                    )}
                </div>
            ) : (
                <div className={styles.tableCard}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Batch Identifier</th>
                                <th>Course Title</th>
                                <th>District</th>
                                <th>Candidates</th>
                                <th>Version</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.map((b) => {
                                const badge = STATUS_BADGES[b.status] || {
                                    label: b.status,
                                    className: styles.statusDraft
                                };
                                return (
                                    <tr key={b.id}>
                                        <td className={styles.idCell}>
                                            <strong>{b.batchNumber}</strong>
                                        </td>
                                        <td className={styles.courseCell}>{b.courseName}</td>
                                        <td>{b.district}</td>
                                        <td>
                                            <span className={styles.countBadge}>
                                                {b.candidateCount}
                                            </span>
                                        </td>
                                        <td>v{b.currentVersion}</td>
                                        <td>
                                            <span className={badge.className}>
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button
                                                className={styles.viewBtn}
                                                onClick={() => onSelectBatch(b.id)}
                                            >
                                                {isTC && (b.status === "DRAFT" || b.status === "RETURNED") ? "Manage / Upload →" : "View Details →"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <CreateBatchModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onCreated={handleCreated}
                defaultDistrict={user.district}
            />
        </div>
    );
};

export default BatchList;
