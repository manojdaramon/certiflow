/** React imports */
import React from "react";

/** Styles */
import styles from "./navbar.module.css";

const ROLE_LABELS = {
    TRAINING_CENTRE: "Training Centre",
    DISTRICT_OFFICER: "District Officer",
    QUALITY_TEAM: "Quality Assurance",
    STATE_OFFICE: "State Directorate"
};

const Navbar = ({ user, onLogout }) => {
    return (
        <header className={styles.navbar}>
            <div className={styles.navContainer}>
                <div className={styles.brand}>
                    <div className={styles.logoBadge}>CF</div>
                    <div>
                        <div className={styles.brandTitle}>Pragati Skills Mission</div>
                        <div className={styles.brandSubtitle}>CertiFlow — Certificate Issuance & Verification</div>
                    </div>
                </div>

                {user && (
                    <div className={styles.userSection}>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{user.name}</span>
                            <div className={styles.userMeta}>
                                <span className={styles.roleBadge}>{ROLE_LABELS[user.role] || user.role}</span>
                                {user.district && <span className={styles.districtBadge}>{user.district} District</span>}
                                {user.trainingCentre && (
                                    <span className={styles.tcBadge}>{user.trainingCentre.code}</span>
                                )}
                            </div>
                        </div>
                        <button className={styles.logoutBtn} onClick={onLogout} title="Sign Out">
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Navbar;
