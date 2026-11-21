/** React imports */
import { useEffect, useState } from "react";

/** Layout & Features */
import AppLayout from "./components/layout/AppLayout.jsx";
import Login from "./features/auth/Login.jsx";
import Dashboard from "./features/dashboard/Dashboard.jsx";

/** Services */
import { fetchCurrentUser, logout, getStoredUser } from "./services/auth.js";

const App = () => {
    const [user, setUser] = useState(getStoredUser());
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("batches");

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
                backgroundColor: "#0f172a",
                color: "#94a3b8",
                fontSize: "0.95rem",
                fontFamily: "sans-serif"
            }}>
                Loading Pragati Skills Mission Portal...
            </div>
        );
    }

    if (!user) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <AppLayout
            user={user}
            onLogout={handleLogout}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
        >
            <Dashboard user={user} activeTab={activeTab} />
        </AppLayout>
    );
};

export default App;
