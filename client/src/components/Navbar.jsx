// client/src/components/Navbar.jsx
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { NavLink, Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
    const { token, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // --- ИСПРАВЛЕНИЕ ЗДЕСЬ: Объявляем и инициализируем userRole ---
    let userRole = null; // Initialize to null or a default non-admin role

    if (token) {
        try {
            // Decode the token to get the payload
            // The payload structure depends on what you put in it when signing the JWT on the server
            // Common fields are 'id' or 'userId', and 'role'
            const payload = JSON.parse(atob(token.split('.')[1]));
            userRole = payload.role; // Assign role if token exists and payload has 'role'
        } catch (e) {
            console.error("Navbar: Error decoding token:", e);
            // If token is malformed or decoding fails, userRole remains null (or its initial value)
            // Optionally, you could trigger logout here if the token is clearly invalid
            // logout();
            // navigate('/login');
            userRole = null;
        }
    }
    // --- КОНЕЦ ИСПРАВЛЕНИЯ ---


    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const linkClass = ({ isActive }) =>
        isActive ? 'text-blue-400 font-semibold px-3 py-2 rounded-md text-sm'
            : 'text-gray-300 hover:text-blue-300 px-3 py-2 rounded-md text-sm';

    return (
        <header className="bg-gray-800 text-white shadow-md">
            <nav className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
                <Link to="/" className="text-xl font-bold hover:text-gray-200">
                    CaloriesTracker
                </Link>

                {token && (
                    <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4">
                        <NavLink to="/diary" className={linkClass} end>
                            Diary
                        </NavLink>
                        <NavLink to="/my-recipes" className={linkClass}>
                            My Recipes
                        </NavLink>
                        <NavLink to="/products" className={linkClass}>
                            Products
                        </NavLink>
                        <NavLink to="/exercises" className={linkClass}>
                            Exercises
                        </NavLink>
                        <NavLink to="/statistics" className={linkClass}>
                            Statistics
                        </NavLink>
                        <NavLink to="/achievements" className={linkClass}>
                            Achievements
                        </NavLink>
                        <NavLink to="/profile" className={linkClass}>
                            Profile
                        </NavLink>

                        {/* Admin-only link: Now userRole is defined */}
                        {userRole === 'admin' && (
                            <NavLink to="/admin/statistics" className={linkClass}>
                                Admin Stats
                            </NavLink>
                        )}

                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </nav>
        </header>
    );
}