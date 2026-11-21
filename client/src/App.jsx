/** React imports */
import { useEffect, useState } from "react";

/** Layout & Features */
import Navbar from "./components/layout/Navbar.jsx";
import Login from "./features/auth/Login.jsx";
import Dashboard from "./features/dashboard/Dashboard.jsx";

/** Services */
import { fetchCurrentUser, logout, getStoredUser } from "./services/auth.js";

const App = () => {
    const [user, setUser] = useState(getStoredUser());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifySession = async () => {
            const currentUser = await fetchCurrentUser();
            setUser(currentUser);
            setLoading(false);
        };
        verifySession();
    }, []);

    const handleLoginSuccess = (authenticatedUser) => {
        setUser(authenticatedUser);
    };

    const handleLogout = () => {
        logout();
        setUser(null);
    };

    if (loading) {
        return (
            <div style={{
                display: "flex",
                height: "100vh",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "var(--color-bg-main)",
                color: "var(--color-text-muted)",
                fontSize: "0.95rem"
            }}>
                Loading Pragati Skills Mission Portal...
            </div>
        );
    }

    return (
        <div>
            <Navbar user={user} onLogout={handleLogout} />
            <main>
                {user ? (
                    <Dashboard user={user} onLogout={handleLogout} />
                ) : (
                    <Login onLoginSuccess={handleLoginSuccess} />
                )}
            </main>
        </div>
    );
};

export default App;
