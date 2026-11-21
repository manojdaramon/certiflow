/** React imports */
import React from "react";

/** Styles */
import styles from "./sidebar.module.css";

const ROLE_LABELS = {
    TRAINING_CENTRE: "Training Centre Partner",
    DISTRICT_OFFICER: "District Review Officer",
    QUALITY_TEAM: "Quality Assurance Wing",
    STATE_OFFICE: "State Directorate"
};

const Sidebar = ({ user, onLogout, activeTab, onSelectTab }) => {
    const initials = user.name
        ? user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()
        : "U";

    const navItems = [
        { id: "batches", label: "Batches & Workflow", icon: "📁" }
    ];

    return (
        <aside className={styles.sidebar}>
            {/* Top Brand */}
            <div className={styles.brandBox}>
                <div className={styles.emblemBadge}>PSM</div>
                <div className={styles.brandTexts}>
                    <div className={styles.portalTitle}>Pragati Skills Mission</div>
                    <div className={styles.portalSubtitle}>CertiFlow Management Portal</div>
                </div>
            </div>

            {/* Role & Scope Indicator */}
            <div className={styles.scopeBox}>
                <div className={styles.scopeRole}>{ROLE_LABELS[user.role] || user.role}</div>
                <div className={styles.scopeDetail}>
                    {user.district && <span>Jurisdiction: <strong>{user.district}</strong></span>}
                    {user.trainingCentre && (
                        <span>Centre: <strong>{user.trainingCentre.code}</strong></span>
                    )}
                </div>
            </div>

            {/* Navigation Links */}
            <nav className={styles.navMenu}>
                <div className={styles.navHeader}>MAIN WORKSPACE</div>
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            className={isActive ? styles.navItemActive : styles.navItem}
                            onClick={() => onSelectTab(item.id)}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span className={styles.navLabel}>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom User Profile Section */}
            <div className={styles.footer}>
                <div className={styles.userCard}>
                    <div className={styles.avatar}>{initials}</div>
                    <div className={styles.userDetails}>
                        <div className={styles.userName}>{user.name}</div>
                        <div className={styles.userEmail}>{user.email}</div>
                    </div>
                </div>
                <button className={styles.logoutBtn} onClick={onLogout}>
                    <span className={styles.logoutIcon}>⎋</span>
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
