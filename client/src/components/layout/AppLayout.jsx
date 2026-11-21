/** React imports */
import { useState } from "react";

/** Components */
import Sidebar from "./Sidebar.jsx";

/** Styles */
import styles from "./app-layout.module.css";

const AppLayout = ({ user, onLogout, children, activeTab, onSelectTab }) => {
    return (
        <div className={styles.layoutWrapper}>
            <Sidebar
                user={user}
                onLogout={onLogout}
                activeTab={activeTab}
                onSelectTab={onSelectTab}
            />
            <div className={styles.mainWrapper}>
                <header className={styles.topBar}>
                    <div className={styles.breadCrumb}>
                        <span className={styles.portalPill}>Official Portal</span>
                        <span className={styles.separator}>/</span>
                        <span className={styles.currentSection}>
                            Batches & Certification Workflow
                        </span>
                    </div>

                    <div className={styles.topRight}>
                        <span className={styles.roleChip}>
                            {user.role.replace(/_/g, " ")}
                        </span>
                        {user.district && (
                            <span className={styles.districtChip}>
                                {user.district}
                            </span>
                        )}
                    </div>
                </header>

                <main className={styles.contentArea}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
