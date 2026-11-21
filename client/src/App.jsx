/** React imports */
import { useEffect, useState } from "react";

/** Services */
import { fetchHealth } from "./services/api.js";

/** Styles */
import styles from "./App.module.css";

const App = () => {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkBackend = async () => {
            setLoading(true);
            const res = await fetchHealth();
            setHealth(res);
            setLoading(false);
        };
        checkBackend();
    }, []);

    return (
        <div className={styles.appContainer}>
            <header className={styles.header}>
                <div className={styles.brand}>
                    <span className={styles.logoBadge}>CF</span>
                    <div>
                        <h1 className={styles.title}>CertiFlow</h1>
                        <p className={styles.subtitle}>Skilling Certificate Issuance Platform</p>
                    </div>
                </div>
                <div className={styles.envTag}>Phase 1 — Project Setup</div>
            </header>

            <main className={styles.main}>
                <section className={styles.card}>
                    <h2 className={styles.cardTitle}>System & Environment Status</h2>
                    <p className={styles.cardDesc}>
                        Verifying connection between React Vite frontend and Node.js Express backend.
                    </p>

                    <div className={styles.statusBox}>
                        <div className={styles.statusRow}>
                            <span className={styles.statusLabel}>Frontend:</span>
                            <span className={styles.statusBadgeSuccess}>Active (Port 3000)</span>
                        </div>
                        <div className={styles.statusRow}>
                            <span className={styles.statusLabel}>Backend Service:</span>
                            {loading ? (
                                <span className={styles.statusBadgePending}>Checking...</span>
                            ) : health?.success ? (
                                <span className={styles.statusBadgeSuccess}>Connected (Port 5000)</span>
                            ) : (
                                <span className={styles.statusBadgeError}>Disconnected</span>
                            )}
                        </div>
                        <div className={styles.statusRow}>
                            <span className={styles.statusLabel}>Database (PostgreSQL):</span>
                            {health?.services?.database === "connected" ? (
                                <span className={styles.statusBadgeSuccess}>Connected</span>
                            ) : (
                                <span className={styles.statusBadgePending}>Awaiting DB initialization</span>
                            )}
                        </div>
                        <div className={styles.statusRow}>
                            <span className={styles.statusLabel}>Cache & Queue (Redis):</span>
                            {health?.services?.redis === "connected" ? (
                                <span className={styles.statusBadgeSuccess}>Connected</span>
                            ) : (
                                <span className={styles.statusBadgePending}>Awaiting Redis initialization</span>
                            )}
                        </div>
                    </div>
                </section>

                <section className={styles.card}>
                    <h2 className={styles.cardTitle}>Demo Personas (Pragati Skills Mission)</h2>
                    <div className={styles.personasGrid}>
                        <div className={styles.personaCard}>
                            <div className={styles.personaRole}>Training Centre</div>
                            <div className={styles.personaName}>Anika</div>
                            <p className={styles.personaDesc}>Uploads candidate batches via CSV and submits for approval.</p>
                        </div>
                        <div className={styles.personaCard}>
                            <div className={styles.personaRole}>District Officer</div>
                            <div className={styles.personaName}>Dev & Meera</div>
                            <p className={styles.personaDesc}>Reviews district batches. Requires 2 distinct officer approvals.</p>
                        </div>
                        <div className={styles.personaCard}>
                            <div className={styles.personaRole}>Quality Team</div>
                            <div className={styles.personaName}>Neha</div>
                            <p className={styles.personaDesc}>Performs additional quality checks on large batches.</p>
                        </div>
                        <div className={styles.personaCard}>
                            <div className={styles.personaRole}>State Office</div>
                            <div className={styles.personaName}>Farah</div>
                            <p className={styles.personaDesc}>Final approval, handles escalations, and certificate revocation.</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default App;
