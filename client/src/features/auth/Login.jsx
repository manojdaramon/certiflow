/** React imports */
import { useState } from "react";

/** Services */
import { login } from "../../services/auth.js";

/** Styles */
import styles from "./login.module.css";

const DEMO_PERSONAS = [
    {
        name: "Anika Sharma",
        email: "anika@pragati.gov.in",
        role: "Training Centre",
        sub: "Apex Skill Academy (Hyderabad)"
    },
    {
        name: "Dev Patel",
        email: "dev@pragati.gov.in",
        role: "District Officer",
        sub: "Hyderabad (Officer 1)"
    },
    {
        name: "Meera Sen",
        email: "meera@pragati.gov.in",
        role: "District Officer",
        sub: "Hyderabad (Officer 2)"
    },
    {
        name: "Kabir Das",
        email: "kabir@pragati.gov.in",
        role: "District Officer",
        sub: "Warangal (Officer)"
    },
    {
        name: "Neha Joshi",
        email: "neha@pragati.gov.in",
        role: "Quality Team",
        sub: "State Scrutiny Wing"
    },
    {
        name: "Farah Khan",
        email: "farah@pragati.gov.in",
        role: "State Office",
        sub: "Directorate & Final Approver"
    }
];

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please enter both email and password.");
            return;
        }

        try {
            setLoading(true);
            const user = await login(email, password);
            onLoginSuccess(user);
        } catch (err) {
            setError(err.message || "Invalid credentials. Please verify your email and password.");
        } finally {
            setLoading(false);
        }
    };

    const handleQuickFill = (personaEmail) => {
        setEmail(personaEmail);
        setPassword("Password123!");
        setError("");
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginBox}>
                <div className={styles.header}>
                    <div className={styles.emblem}>PSM</div>
                    <h2 className={styles.title}>Pragati Skills Mission</h2>
                    <p className={styles.subtitle}>Official Skilling Certificate Issuance & Administration Portal</p>
                </div>

                {error && <div className={styles.errorAlert}>{error}</div>}

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="email">
                            Official Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            className={styles.input}
                            placeholder="officer@pragati.gov.in"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            className={styles.input}
                            placeholder="••••••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? "Authenticating..." : "Sign In to Portal"}
                    </button>
                </form>

                <div className={styles.demoSection}>
                    <div className={styles.demoHeader}>
                        <span className={styles.demoLine}></span>
                        <span className={styles.demoTitle}>Quick-Fill Demo Credentials</span>
                        <span className={styles.demoLine}></span>
                    </div>
                    <p className={styles.demoHelp}>Click any profile below to populate credentials:</p>
                    <div className={styles.personaGrid}>
                        {DEMO_PERSONAS.map((p) => (
                            <button
                                key={p.email}
                                type="button"
                                className={styles.personaBtn}
                                onClick={() => handleQuickFill(p.email)}
                            >
                                <span className={styles.personaRole}>{p.role}</span>
                                <span className={styles.personaName}>{p.name}</span>
                                <span className={styles.personaSub}>{p.sub}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
