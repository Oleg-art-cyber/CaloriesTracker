// client/src/components/AdminProtected.jsx
import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * AdminProtected
 * Restricts access to child components unless the user has an 'admin' role.
 * Redirects to login if not authenticated, or to home if not an admin.
 */
export default function AdminProtected({ children }) {
    const { token } = useContext(AuthContext);
    const location = useLocation();

    // Redirect to login if no token is found
    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Attempt to decode token and extract user role
    let userRole = 'user'; // Default role
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userRole = payload.role || 'user';
    } catch (e) {
        console.error("AdminProtected: Failed to decode token.", e);
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Redirect to homepage if user is not an admin
    if (userRole !== 'admin') {
        console.warn("AdminProtected: Access denied. User is not an admin.");
        return <Navigate to="/" replace />;
    }

    // Render protected content
    return children;
}
