    import React from "react";
    import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
    import { onAuthStateChanged } from "firebase/auth";
    import { auth } from "./config/firebaseConfig"; 
    import { getCookie } from './util/cookie';

    import Login from "./login";
    import Dashboard from "./Dashboard";
    import UserManagement from "./UserManagement";
    import ContactManagement from "./ContactManagement";
    import VisitorRegister from "./VisitorRegister";
    import Navbar from "./component/Navbar"; 
    import PreRegistration from "./PreRegistration";
    import VisitorHistory from "./VisitorHistory";
    import Employee from "./Employee";

    const ProtectedRoute = ({ element ,allowedRoles }) => {
        const [user, setUser] = React.useState(null);
        const [loading, setLoading] = React.useState(true);
        const [role, setRole] = React.useState(null);
        const location = useLocation();

        React.useEffect(() => {
            const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                setUser(currentUser);
                setLoading(false);
            });
            return unsubscribe;
        }, []);
    
        React.useEffect(() => {
            const userRoleFromCookie = getCookie('role');
            setRole(userRoleFromCookie);
        }, []);

        if (loading) {
            return <div>Loading...</div>;
        }

        if (!user) {
            return <Navigate to="/login" state={{ from: location }} replace />;
        }
    
        if (!allowedRoles.includes(role)) {
            return <Navigate to="/dashboard" replace />;
        }
    
        return element;
        
    };

    function AppWithNavbar() {
        const location = useLocation();
    
        return (
            <>
                {location.pathname !== "/login" && <Navbar />}
                <div className="content">
                    <Routes>
                        <Route path="/" element={<Navigate to="/login" />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} allowedRoles={["admin", "staff", "companyadmin"]} />} />
                        <Route path="/UserManagement" element={<ProtectedRoute element={<UserManagement />} allowedRoles={["admin"]} />} />
                        <Route path="/ContactManagement" element={<ProtectedRoute element={<ContactManagement />} allowedRoles={["admin", "companyadmin"]} />} />
                        <Route path="/VisitorRegister" element={<ProtectedRoute element={<VisitorRegister />} allowedRoles={["admin", "staff"]} />} />
                        <Route path="/PreRegistration" element={<ProtectedRoute element={<PreRegistration />} allowedRoles={["admin", "companyadmin"]} />} />
                        <Route path="/VisitorHistory" element={<ProtectedRoute element={<VisitorHistory />} allowedRoles={["admin", "staff", "companyadmin"]} />} />
                        <Route path="/Employee" element={<ProtectedRoute element={<Employee />} allowedRoles={["admin", "staff"]} />} />
                    </Routes>
                </div>
            </>
        );
    }

    function App() {
        return (
            <Router>
                <AppWithNavbar />
            </Router>
            
        );
    }

    export default App;





