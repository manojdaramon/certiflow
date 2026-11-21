/** React imports */
import React from "react";

/** Styles */
import styles from "./dashboard.module.css";

const Dashboard = ({ user, onLogout }) => {
    const renderRoleSpecificContent = () => {
        switch (user.role) {
            case "TRAINING_CENTRE":
                return (
                    <div className={styles.roleSection}>
                        <div className={styles.welcomeCard}>
                            <div className={styles.welcomeBadge}>Training Centre Portal</div>
                            <h2 className={styles.welcomeTitle}>
                                {user.trainingCentre?.name || "Training Centre Partner"}
                            </h2>
                            <p className={styles.welcomeSubtitle}>
                                Affiliated Centre Code: <strong>{user.trainingCentre?.code || "TC-HYD-001"}</strong> | District: <strong>{user.district || "Hyderabad"}</strong>
                            </p>
                        </div>

                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <div className={styles.statNumber}>0</div>
                                <div className={styles.statLabel}>Active Batches</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statNumber}>0</div>
                                <div className={styles.statLabel}>In Review</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statNumber}>0</div>
                                <div className={styles.statLabel}>Certified Candidates</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statNumber}>0</div>
                                <div className={styles.statLabel}>Returned for Fix</div>
                            </div>
                        </div>

                        <div className={styles.actionsCard}>
                            <h3 className={styles.sectionHeading}>Batch Management Actions</h3>
                            <p className={styles.sectionDesc}>
                                Create a batch and upload candidates from your centre spreadsheet (Phase 3).
                            </p>
                            <div className={styles.buttonGroup}>
                                <button className={styles.primaryBtn} disabled>
                                    + Create New Batch
                                </button>
                                <button className={styles.secondaryBtn} disabled>
                                    Upload Candidate CSV
                                </button>
                            </div>
                            <div className={styles.phaseNotice}>
                                Batch submission and all-or-nothing CSV spreadsheet import will unlock in <strong>Phase 3</strong>.
                            </div>
                        </div>
                    </div>
                );

            case "DISTRICT_OFFICER":
                return (
                    <div className={styles.roleSection}>
                        <div className={styles.welcomeCard}>
                            <div className={styles.welcomeBadge}>District Review Portal</div>
                            <h2 className={styles.welcomeTitle}>{user.district} District Office</h2>
                            <p className={styles.welcomeSubtitle}>
                                Logged in as Officer: <strong>{user.name}</strong> ({user.email})
                            </p>
                        </div>

                        <div className={styles.policyAlert}>
                            <strong>Dual-Officer Consensus Rule:</strong> Every batch submitted within this district requires independent verification and approval from <strong>two different district officers</strong> before advancing.
                        </div>

                        <div className={styles.actionsCard}>
                            <h3 className={styles.sectionHeading}>Pending District Reviews</h3>
                            <p className={styles.sectionDesc}>
                                Batches awaiting first or second district officer approval will appear here.
                            </p>
                            <div className={styles.emptyState}>
                                No batches currently pending district review.
                            </div>
                            <div className={styles.phaseNotice}>
                                Dual-officer approval workflows, concurrency controls, and return-for-fix features will unlock in <strong>Phase 4</strong>.
                            </div>
                        </div>
                    </div>
                );

            case "QUALITY_TEAM":
                return (
                    <div className={styles.roleSection}>
                        <div className={styles.welcomeCard}>
                            <div className={styles.welcomeBadge}>Quality Assurance Portal</div>
                            <h2 className={styles.welcomeTitle}>State Quality Scrutiny Wing</h2>
                            <p className={styles.welcomeSubtitle}>
                                Reviewer: <strong>{user.name}</strong> | Scope: State-Wide Quality Audit
                            </p>
                        </div>

                        <div className={styles.actionsCard}>
                            <h3 className={styles.sectionHeading}>High-Volume Batch Queue</h3>
                            <p className={styles.sectionDesc}>
                                Batches with large candidate numbers are routed here for secondary quality scrutiny before state authorization.
                            </p>
                            <div className={styles.emptyState}>
                                Queue is clear. No high-volume batches pending quality inspection.
                            </div>
                            <div className={styles.phaseNotice}>
                                Quality scrutiny thresholds and approval routing unlock in <strong>Phase 4</strong>.
                            </div>
                        </div>
                    </div>
                );

            case "STATE_OFFICE":
                return (
                    <div className={styles.roleSection}>
                        <div className={styles.welcomeCard}>
                            <div className={styles.welcomeBadge}>State Directorate Portal</div>
                            <h2 className={styles.welcomeTitle}>Pragati Skills Mission Directorate</h2>
                            <p className={styles.welcomeSubtitle}>
                                Executive Administrator: <strong>{user.name}</strong>
                            </p>
                        </div>

                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <div className={styles.statNumber}>0</div>
                                <div className={styles.statLabel}>Awaiting Final Approval</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statNumber}>0</div>
                                <div className={styles.statLabel}>SLA Delayed / Stuck</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statNumber}>0</div>
                                <div className={styles.statLabel}>Total Issued</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statNumber}>0</div>
                                <div className={styles.statLabel}>Revoked / Cancelled</div>
                            </div>
                        </div>

                        <div className={styles.actionsCard}>
                            <h3 className={styles.sectionHeading}>State Executive Controls</h3>
                            <p className={styles.sectionDesc}>
                                Final certificate issuance authority, revocation management, and stuck batch escalation.
                            </p>
                            <div className={styles.phaseNotice}>
                                Certificate issuance, PDF generation, and cancellation management unlock in <strong>Phases 5 & 6</strong>.
                            </div>
                        </div>
                    </div>
                );

            default:
                return <div>Unknown role</div>;
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.headerRow}>
                <div>
                    <h1 className={styles.pageTitle}>Portal Dashboard</h1>
                    <p className={styles.pageSubtitle}>
                        Official Session: <strong>{user.name}</strong> ({user.email})
                    </p>
                </div>
            </div>

            {renderRoleSpecificContent()}
        </div>
    );
};

export default Dashboard;
