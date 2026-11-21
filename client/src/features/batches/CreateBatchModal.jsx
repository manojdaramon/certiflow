/** React imports */
import { useState } from "react";

/** Services */
import { createBatch } from "../../services/batches.js";

/** Styles */
import styles from "./create-batch.module.css";

const CreateBatchModal = ({ isOpen, onClose, onCreated, defaultDistrict }) => {
    const [courseName, setCourseName] = useState("");
    const [district, setDistrict] = useState(defaultDistrict || "Hyderabad");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!courseName.trim()) {
            setError("Course name is required.");
            return;
        }

        try {
            setLoading(true);
            const created = await createBatch(courseName.trim(), district);
            onCreated(created);
            onClose();
        } catch (err) {
            setError(err.message || "Failed to create batch");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Create New Skilling Batch</h2>
                    <button className={styles.closeBtn} onClick={onClose} disabled={loading}>
                        ✕
                    </button>
                </div>

                <p className={styles.modalDesc}>
                    Initialize a new batch in draft status. Once created, you can upload candidates from your centre spreadsheet or register them manually.
                </p>

                {error && <div className={styles.errorAlert}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="courseName">
                            Course / Qualification Title *
                        </label>
                        <input
                            id="courseName"
                            type="text"
                            className={styles.input}
                            placeholder="e.g. Solar PV Installation & Maintenance Technician"
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="district">
                            Assigned District
                        </label>
                        <input
                            id="district"
                            type="text"
                            className={styles.input}
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            disabled
                        />
                    </div>

                    <div className={styles.modalActions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? "Creating Batch..." : "Create Batch"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateBatchModal;
