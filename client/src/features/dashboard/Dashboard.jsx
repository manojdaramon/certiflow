/** React imports */
import { useState } from "react";

/** Features */
import BatchList from "../batches/BatchList.jsx";
import BatchDetail from "../batches/BatchDetail.jsx";

/** Styles */
import styles from "./dashboard.module.css";

const Dashboard = ({ user, activeTab = "batches" }) => {
    const [selectedBatchId, setSelectedBatchId] = useState(null);

    if (selectedBatchId) {
        return (
            <div className={styles.workspace}>
                <BatchDetail
                    batchId={selectedBatchId}
                    onBack={() => setSelectedBatchId(null)}
                    user={user}
                />
            </div>
        );
    }

    const renderRoleHeader = () => {
        switch (user.role) {
            case "TRAINING_CENTRE":
                return (
                    <div className={styles.entityCard}>
                        <div className={styles.entityDetails}>
                            <div className={styles.entityTag}>Accredited Training Centre</div>
                            <h1 className={styles.entityName}>
                                {user.trainingCentre?.name || "Apex Skill Academy - Hyderabad"}
                            </h1>
                            <div className={styles.entityMeta}>
                                <span>Centre Code: <strong>{user.trainingCentre?.code || "TC-HYD-001"}</strong></span>
                                <span className={styles.dot}>•</span>
                                <span>District: <strong>{user.district || "Hyderabad"}</strong></span>
                                <span className={styles.dot}>•</span>
                                <span>Authorised Person: <strong>{user.name}</strong></span>
                            </div>
                        </div>
                    </div>
                );

            case "DISTRICT_OFFICER":
                return (
                    <div className={styles.entityCard}>
                        <div className={styles.entityDetails}>
                            <div className={styles.entityTag}>District Regulatory Office</div>
                            <h1 className={styles.entityName}>{user.district} District Verification Cell</h1>
                            <div className={styles.entityMeta}>
                                <span>Review Officer: <strong>{user.name}</strong> ({user.email})</span>
                                <span className={styles.dot}>•</span>
                                <span>Jurisdiction: <strong>{user.district} District</strong></span>
                            </div>
                        </div>
                        <div className={styles.policyNotice}>
                            <strong>Consensus Requirement:</strong> 2 distinct district officers must independently approve each batch.
                        </div>
                    </div>
                );

            case "QUALITY_TEAM":
                return (
                    <div className={styles.entityCard}>
                        <div className={styles.entityDetails}>
                            <div className={styles.entityTag}>Quality Assurance & Audit</div>
                            <h1 className={styles.entityName}>State Quality Scrutiny Directorate</h1>
                            <div className={styles.entityMeta}>
                                <span>Auditor: <strong>{user.name}</strong></span>
                                <span className={styles.dot}>•</span>
                                <span>Audit Scope: <strong>High-Volume Candidate Batches (&gt; 25)</strong></span>
                            </div>
                        </div>
                    </div>
                );

            case "STATE_OFFICE":
                return (
                    <div className={styles.entityCard}>
                        <div className={styles.entityDetails}>
                            <div className={styles.entityTag}>State Directorate Executive</div>
                            <h1 className={styles.entityName}>Pragati Skills Mission — Directorate</h1>
                            <div className={styles.entityMeta}>
                                <span>Executive Administrator: <strong>{user.name}</strong></span>
                                <span className={styles.dot}>•</span>
                                <span>Authority: <strong>Final Certificate Issuance & Revocation</strong></span>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={styles.workspace}>
            {renderRoleHeader()}

            <div className={styles.sectionArea}>
                <BatchList user={user} onSelectBatch={setSelectedBatchId} />
            </div>
        </div>
    );
};

export default Dashboard;
