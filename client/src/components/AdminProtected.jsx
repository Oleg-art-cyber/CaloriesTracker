// client/src/components/AdminProtected.jsx
import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function AdminProtected({ children }) {
    const { token } = useContext(AuthContext);
    const location = useLocation();

    if (!token) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to so we can send them along after они login.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Decode token to check role (simple client-side check)
    // In a real-world scenario, critical admin actions should always be re-verified on the backend.
    let userRole = 'user'; // Default to 'user' if role is not in token or token is malformed
    try {
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userRole = payload.role || 'user';
        }
    } catch (e) {
        console.error("Error decoding token for admin check:", e);
        // Potentially logout user if token is malformed
        // logout();
        // return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (userRole !== 'admin') {
        // Redirect them to the home page if they are not an admin
        console.warn("AdminProtected: Access denied. User role is not 'admin'.");
        return <Navigate to="/" replace />;
    }

    return children;
}