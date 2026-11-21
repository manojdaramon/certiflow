/** React imports */
import { useEffect, useState, useRef } from "react";

/** Services */
import {
    fetchBatchDetails,
    uploadCandidatesCSV,
    addCandidateManually,
    submitBatchForApproval
} from "../../services/batches.js";
import { submitDecision, fetchBatchHistory } from "../../services/approvals.js";

/** Styles */
import styles from "./batch-detail.module.css";

const STATUS_CONFIG = {
    DRAFT: { label: "Draft", className: styles.statusDraft },
    SUBMITTED: { label: "Submitted", className: styles.statusSubmitted },
    UNDER_DISTRICT_REVIEW: { label: "Under District Review", className: styles.statusReview },
    UNDER_QUALITY_REVIEW: { label: "Under Quality Review", className: styles.statusReview },
    UNDER_STATE_REVIEW: { label: "Under State Review", className: styles.statusReview },
    APPROVED: { label: "Approved & Certified", className: styles.statusApproved },
    REJECTED: { label: "Rejected", className: styles.statusRejected },
    RETURNED: { label: "Returned for Correction", className: styles.statusReturned }
};

const BatchDetail = ({ batchId, onBack, user }) => {
    const [batch, setBatch] = useState(null);
    const [history, setHistory] = useState({ approvals: [], auditLogs: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // CSV Upload state
    const [uploading, setUploading] = useState(false);
    const [uploadErrors, setUploadErrors] = useState([]);
    const fileInputRef = useRef(null);

    // Manual Candidate form state
    const [showManualForm, setShowManualForm] = useState(false);
    const [manualForm, setManualForm] = useState({
        fullName: "",
        nationalId: "",
        phone: "",
        email: "",
        grade: "A",
        completionDate: new Date().toISOString().split("T")[0]
    });
    const [submittingManual, setSubmittingManual] = useState(false);

    // Batch submission state
    const [submittingBatch, setSubmittingBatch] = useState(false);

    // Officer Decision state
    const [decisionMode, setDecisionMode] = useState(null); // 'RETURN' | 'REJECT' | null
    const [decisionReason, setDecisionReason] = useState("");
    const [submittingDecision, setSubmittingDecision] = useState(false);

    const loadDetails = async () => {
        try {
            setLoading(true);
            const [data, hist] = await Promise.all([
                fetchBatchDetails(batchId),
                fetchBatchHistory(batchId).catch(() => ({ approvals: [], auditLogs: [] }))
            ]);
            setBatch(data);
            setHistory(hist);
        } catch (err) {
            setError(err.message || "Failed to load batch details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDetails();
    }, [batchId]);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError("");
        setSuccessMsg("");
        setUploadErrors([]);
        setUploading(true);

        try {
            const result = await uploadCandidatesCSV(batchId, file);
            setSuccessMsg(`Spreadsheet verified successfully! Imported ${result.importedCount} candidate(s).`);
            await loadDetails();
        } catch (err) {
            setError(err.message || "Failed to upload spreadsheet.");
            if (err.errors && Array.isArray(err.errors)) {
                setUploadErrors(err.errors);
            }
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const downloadSampleCSV = (includeBadRows = false) => {
        let csvContent = "Full Name,National ID,Phone,Email,Grade,Completion Date\n";
        if (includeBadRows) {
            csvContent += "Ramesh Kumar,AADHAAR-8801,9849012345,ramesh@example.com,A,2026-05-15\n";
            csvContent += "Sita Devi,AADHAAR-8802,12345,sita@example.com,B,2026-05-15\n"; // Bad phone number
            csvContent += "Kiran Rao,AADHAAR-8803,9849033333,invalid-email,Pass,2026-05-15\n"; // Bad email
            csvContent += "Anil Reddy,AADHAAR-8801,9849044444,anil@example.com,A,2026-05-15\n"; // Duplicate national ID
        } else {
            csvContent += "Ramesh Kumar,AADHAAR-9001,9849012345,ramesh.k@example.com,A,2026-05-15\n";
            csvContent += "Sita Devi,AADHAAR-9002,9849023456,sita.d@example.com,A+,2026-05-15\n";
            csvContent += "Kiran Rao,AADHAAR-9003,9849034567,kiran.r@example.com,Pass,2026-05-15\n";
            csvContent += "Priya Sharma,AADHAAR-9004,9849045678,priya.s@example.com,Distinction,2026-05-15\n";
            csvContent += "Mohammed Ali,AADHAAR-9005,9849056789,m.ali@example.com,A,2026-05-15\n";
        }

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", includeBadRows ? "sample_with_errors.csv" : "valid_candidates_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");

        try {
            setSubmittingManual(true);
            await addCandidateManually(batchId, manualForm);
            setSuccessMsg(`Candidate '${manualForm.fullName}' registered successfully.`);
            setManualForm({
                fullName: "",
                nationalId: "",
                phone: "",
                email: "",
                grade: "A",
                completionDate: new Date().toISOString().split("T")[0]
            });
            setShowManualForm(false);
            await loadDetails();
        } catch (err) {
            setError(err.message || "Failed to add candidate");
        } finally {
            setSubmittingManual(false);
        }
    };

    const handleSubmitForApproval = async () => {
        if (!window.confirm("Are you sure you want to submit this batch for District Officer review?")) {
            return;
        }

        setError("");
        setSuccessMsg("");
        setSubmittingBatch(true);

        try {
            await submitBatchForApproval(batchId);
            setSuccessMsg("Batch successfully submitted to the District Office for approval!");
            await loadDetails();
        } catch (err) {
            setError(err.message || "Failed to submit batch");
        } finally {
            setSubmittingBatch(false);
        }
    };

    // Reviewer Decision Handler
    const handleDecision = async (decision, reasonText = "") => {
        setError("");
        setSuccessMsg("");
        setSubmittingDecision(true);

        try {
            const res = await submitDecision(batchId, decision, reasonText);
            setSuccessMsg(res.message || `Decision recorded: ${decision}`);
            setDecisionMode(null);
            setDecisionReason("");
            await loadDetails();
        } catch (err) {
            setError(err.message || "Failed to process approval decision");
        } finally {
            setSubmittingDecision(false);
        }
    };

    if (loading) {
        return <div className={styles.loadingContainer}>Loading batch details...</div>;
    }

    if (!batch) {
        return (
            <div className={styles.errorContainer}>
                <p>{error || "Batch not found"}</p>
                <button className={styles.backBtn} onClick={onBack}>Back to Batches</button>
            </div>
        );
    }

    const isEditable = (batch.status === "DRAFT" || batch.status === "RETURNED") && user.role === "TRAINING_CENTRE";
    const statusCfg = STATUS_CONFIG[batch.status] || { label: batch.status, className: styles.statusDraft };

    // Approval stage eligibility
    const isDistrictStage = batch.status === "UNDER_DISTRICT_REVIEW" && user.role === "DISTRICT_OFFICER" && user.district === batch.district;
    const isQualityStage = batch.status === "UNDER_QUALITY_REVIEW" && user.role === "QUALITY_TEAM";
    const isStateStage = batch.status === "UNDER_STATE_REVIEW" && user.role === "STATE_OFFICE";
    const canReview = isDistrictStage || isQualityStage || isStateStage;

    // District specific checks
    const currentVersionApprovals = (batch.approvals || []).filter(
        (a) => a.submissionVersion === batch.currentVersion && a.decision === "APPROVED"
    );
    const hasAlreadyApproved = currentVersionApprovals.some((a) => a.officerId === user.id);

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <button className={styles.backBtn} onClick={onBack}>
                    ← Back to Batches
                </button>
                <div className={styles.actionButtons}>
                    {isEditable && (
                        <button
                            className={styles.submitBatchBtn}
                            onClick={handleSubmitForApproval}
                            disabled={submittingBatch || batch.candidateCount === 0}
                            title={batch.candidateCount === 0 ? "Add candidates before submitting" : "Submit to District Office"}
                        >
                            {submittingBatch ? "Submitting..." : batch.status === "RETURNED" ? "Resubmit Corrected Batch →" : "Submit Batch for Approval →"}
                        </button>
                    )}
                </div>
            </div>

            {error && <div className={styles.errorAlert}>{error}</div>}
            {successMsg && <div className={styles.successAlert}>{successMsg}</div>}

            {/* Batch Overview Header Card */}
            <div className={styles.headerCard}>
                <div className={styles.headerMain}>
                    <div>
                        <div className={styles.batchMeta}>
                            <span className={statusCfg.className}>{statusCfg.label}</span>
                            <span className={styles.versionBadge}>Submission Version {batch.currentVersion}</span>
                            <span className={styles.districtBadge}>{batch.district} District</span>
                        </div>
                        <h1 className={styles.batchTitle}>{batch.courseName}</h1>
                        <p className={styles.batchNumber}>Batch ID: <strong>{batch.batchNumber}</strong></p>
                    </div>

                    <div className={styles.centreMeta}>
                        <div className={styles.metaLabel}>Training Centre:</div>
                        <div className={styles.centreName}>{batch.trainingCentre?.name}</div>
                        <div className={styles.centreCode}>Code: {batch.trainingCentre?.code}</div>
                    </div>
                </div>

                <div className={styles.headerStats}>
                    <div className={styles.statBox}>
                        <span className={styles.statVal}>{batch.candidateCount}</span>
                        <span className={styles.statTxt}>Registered Candidates</span>
                    </div>
                    <div className={styles.statBox}>
                        <span className={styles.statVal}>
                            {batch.submittedAt ? new Date(batch.submittedAt).toLocaleDateString() : "Not Submitted"}
                        </span>
                        <span className={styles.statTxt}>Submission Date</span>
                    </div>
                    <div className={styles.statBox}>
                        <span className={styles.statVal}>
                            {batch.approvedAt ? new Date(batch.approvedAt).toLocaleDateString() : "Pending Final"}
                        </span>
                        <span className={styles.statTxt}>Certification Date</span>
                    </div>
                </div>
            </div>

            {/* Official Review & Decision Action Panel */}
            {canReview && (
                <div className={styles.reviewPanel}>
                    <div className={styles.reviewHeader}>
                        <div>
                            <span className={styles.reviewTag}>Official Action Required</span>
                            <h2 className={styles.reviewTitle}>
                                {isDistrictStage && `District Office Review (${user.district} District)`}
                                {isQualityStage && "Quality Assurance Scrutiny"}
                                {isStateStage && "State Directorate Final Authorization"}
                            </h2>
                        </div>

                        {isDistrictStage && (
                            <div className={styles.districtProgress}>
                                <span className={styles.progressLabel}>Dual-Officer Consensus:</span>
                                <span className={currentVersionApprovals.length === 1 ? styles.progressCountWarn : styles.progressCount}>
                                    {currentVersionApprovals.length} of 2 Approvals Recorded
                                </span>
                            </div>
                        )}
                    </div>

                    {isDistrictStage && currentVersionApprovals.length === 1 && (
                        <div className={styles.officerNotice}>
                            First Approval provided by: <strong>{currentVersionApprovals[0].officer?.name}</strong>. A second, different district officer must evaluate this batch to advance it.
                        </div>
                    )}

                    {hasAlreadyApproved && isDistrictStage ? (
                        <div className={styles.alreadyApprovedNotice}>
                            ✓ You have already submitted an approval for Submission Version {batch.currentVersion}. In compliance with the dual-officer rule, a second district officer is required.
                        </div>
                    ) : (
                        <div className={styles.decisionControls}>
                            {decisionMode === null ? (
                                <div className={styles.decisionButtons}>
                                    <button
                                        type="button"
                                        className={styles.approveBtn}
                                        onClick={() => handleDecision("APPROVED")}
                                        disabled={submittingDecision}
                                    >
                                        ✓ Approve Batch
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.returnBtn}
                                        onClick={() => setDecisionMode("RETURN")}
                                        disabled={submittingDecision}
                                    >
                                        ↩ Return for Correction
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.rejectBtn}
                                        onClick={() => setDecisionMode("REJECT")}
                                        disabled={submittingDecision}
                                    >
                                        ✕ Reject Batch
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.reasonBox}>
                                    <label className={styles.reasonLabel}>
                                        Mandatory Reason for {decisionMode === "RETURN" ? "Returning to Training Centre" : "Rejecting Batch"} *
                                    </label>
                                    <textarea
                                        className={styles.reasonTextarea}
                                        placeholder="Please provide specific, clear feedback on what is wrong and what needs correction..."
                                        rows={3}
                                        value={decisionReason}
                                        onChange={(e) => setDecisionReason(e.target.value)}
                                        disabled={submittingDecision}
                                        required
                                    />
                                    <div className={styles.reasonActions}>
                                        <button
                                            type="button"
                                            className={styles.cancelBtn}
                                            onClick={() => {
                                                setDecisionMode(null);
                                                setDecisionReason("");
                                            }}
                                            disabled={submittingDecision}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className={decisionMode === "RETURN" ? styles.confirmReturnBtn : styles.confirmRejectBtn}
                                            onClick={() => handleDecision(decisionMode === "RETURN" ? "RETURNED" : "REJECTED", decisionReason)}
                                            disabled={submittingDecision || !decisionReason.trim()}
                                        >
                                            {submittingDecision ? "Submitting..." : decisionMode === "RETURN" ? "Confirm Return for Correction" : "Confirm Rejection"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Candidate Management Tools (Only in DRAFT or RETURNED mode for Training Centre) */}
            {isEditable && (
                <div className={styles.toolsGrid}>
                    {/* CSV Upload Tool */}
                    <div className={styles.toolCard}>
                        <div className={styles.toolHeader}>
                            <h3 className={styles.toolTitle}>Candidate Spreadsheet (CSV) Upload</h3>
                            <div className={styles.templateLinks}>
                                <button
                                    type="button"
                                    className={styles.linkBtn}
                                    onClick={() => downloadSampleCSV(false)}
                                >
                                    📥 Download Valid Template
                                </button>
                                <button
                                    type="button"
                                    className={styles.linkBtnSecondary}
                                    onClick={() => downloadSampleCSV(true)}
                                    title="Download a test CSV with deliberate invalid rows to verify all-or-nothing rollback"
                                >
                                    ⚠️ Sample with Bad Rows
                                </button>
                            </div>
                        </div>

                        <p className={styles.toolDesc}>
                            Upload candidate spreadsheets (.csv). The system enforces <strong>strict all-or-nothing validation</strong>: if any single row has invalid data, the entire upload is safely rejected with clear row-level error reports.
                        </p>

                        <div className={styles.uploadArea}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                className={styles.fileInput}
                                id="csvFile"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                            <label htmlFor="csvFile" className={styles.uploadLabel}>
                                {uploading ? "Validating & Importing..." : "📁 Select or Drop CSV File"}
                            </label>
                        </div>

                        {/* Row-Level Errors Report */}
                        {uploadErrors.length > 0 && (
                            <div className={styles.errorsContainer}>
                                <div className={styles.errorsHeader}>
                                    <strong>Validation Failed ({uploadErrors.length} Errors Found)</strong>
                                    <span>All-or-Nothing Rule: No candidates were saved.</span>
                                </div>
                                <div className={styles.tableScroll}>
                                    <table className={styles.errorTable}>
                                        <thead>
                                            <tr>
                                                <th>Row</th>
                                                <th>Column</th>
                                                <th>Entered Value</th>
                                                <th>Error Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {uploadErrors.map((err, idx) => (
                                                <tr key={idx}>
                                                    <td className={styles.errRow}>Row {err.row}</td>
                                                    <td className={styles.errCol}>{err.column}</td>
                                                    <td className={styles.errVal}>{err.value || "—"}</td>
                                                    <td className={styles.errReason}>{err.message}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Manual Candidate Registration */}
                    <div className={styles.toolCard}>
                        <div className={styles.toolHeader}>
                            <h3 className={styles.toolTitle}>Manual Candidate Entry</h3>
                            <button
                                type="button"
                                className={styles.secondaryBtn}
                                onClick={() => setShowManualForm(!showManualForm)}
                            >
                                {showManualForm ? "Hide Form" : "+ Register Single Candidate"}
                            </button>
                        </div>
                        <p className={styles.toolDesc}>
                            Add individual passed candidates manually one at a time.
                        </p>

                        {showManualForm && (
                            <form className={styles.manualForm} onSubmit={handleManualSubmit}>
                                <div className={styles.formRow}>
                                    <div className={styles.inputGroup}>
                                        <label>Full Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={manualForm.fullName}
                                            onChange={(e) => setManualForm({ ...manualForm, fullName: e.target.value })}
                                            placeholder="Candidate's legal name"
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>National ID / Aadhaar *</label>
                                        <input
                                            type="text"
                                            required
                                            value={manualForm.nationalId}
                                            onChange={(e) => setManualForm({ ...manualForm, nationalId: e.target.value })}
                                            placeholder="e.g. AADHAAR-1234"
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.inputGroup}>
                                        <label>10-Digit Mobile / WhatsApp *</label>
                                        <input
                                            type="tel"
                                            required
                                            value={manualForm.phone}
                                            onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                                            placeholder="e.g. 9849012345"
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            value={manualForm.email}
                                            onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                                            placeholder="candidate@example.com"
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.inputGroup}>
                                        <label>Grade / Result *</label>
                                        <select
                                            value={manualForm.grade}
                                            onChange={(e) => setManualForm({ ...manualForm, grade: e.target.value })}
                                        >
                                            <option value="Distinction">Distinction</option>
                                            <option value="A">Grade A</option>
                                            <option value="B">Grade B</option>
                                            <option value="Pass">Pass</option>
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Passing Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={manualForm.completionDate}
                                            onChange={(e) => setManualForm({ ...manualForm, completionDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className={styles.primaryBtn} disabled={submittingManual}>
                                    {submittingManual ? "Saving..." : "Save Candidate"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Candidates Table */}
            <div className={styles.candidatesCard}>
                <div className={styles.candidatesHeader}>
                    <div>
                        <h2 className={styles.sectionTitle}>Registered Candidates ({batch.candidates?.length || 0})</h2>
                        <p className={styles.sectionSubtitle}>
                            Candidates included in this certification batch submission.
                        </p>
                    </div>
                </div>

                {batch.candidates && batch.candidates.length > 0 ? (
                    <div className={styles.tableScroll}>
                        <table className={styles.candidateTable}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Candidate Name</th>
                                    <th>National ID / Aadhaar</th>
                                    <th>Phone / WhatsApp</th>
                                    <th>Email</th>
                                    <th>Grade</th>
                                    <th>Passing Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batch.candidates.map((c, idx) => (
                                    <tr key={c.id}>
                                        <td>{idx + 1}</td>
                                        <td className={styles.nameCell}><strong>{c.fullName}</strong></td>
                                        <td><span className={styles.idBadge}>{c.nationalId}</span></td>
                                        <td>{c.phone}</td>
                                        <td>{c.email || "—"}</td>
                                        <td><span className={styles.gradeBadge}>{c.grade}</span></td>
                                        <td>{new Date(c.completionDate).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className={styles.emptyCandidates}>
                        <p>No candidates added to this batch yet.</p>
                        {isEditable && (
                            <span className={styles.emptyHelp}>
                                Use the CSV Spreadsheet Upload tool above to import candidates from your centre records.
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Immutable Decision History & Audit Trail */}
            <div className={styles.auditCard}>
                <div className={styles.auditHeader}>
                    <div>
                        <h2 className={styles.sectionTitle}>Decision History & Traceable Audit Trail</h2>
                        <p className={styles.sectionSubtitle}>
                            Immutable record of every officer review, approval, return, and version transition.
                        </p>
                    </div>
                </div>

                {history.auditLogs && history.auditLogs.length > 0 ? (
                    <div className={styles.timeline}>
                        {history.auditLogs.map((log) => (
                            <div key={log.id} className={styles.timelineItem}>
                                <div className={styles.timelineDot}></div>
                                <div className={styles.timelineContent}>
                                    <div className={styles.timelineMeta}>
                                        <span className={styles.actionBadge}>{log.action}</span>
                                        <span className={styles.logVersion}>Version {log.submissionVersion || 1}</span>
                                        <span className={styles.logDate}>{new Date(log.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className={styles.actorLine}>
                                        Officer / Actor: <strong>{log.actor?.name || log.actorEmail}</strong> ({log.actorRole})
                                    </div>
                                    {log.reason && (
                                        <div className={styles.logReason}>
                                            "{log.reason}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyCandidates}>No audit events recorded yet.</div>
                )}
            </div>
        </div>
    );
};

export default BatchDetail;
