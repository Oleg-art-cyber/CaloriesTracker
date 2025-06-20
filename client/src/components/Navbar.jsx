// client/src/components/Navbar.jsx
// Navbar component: Displays the main navigation bar with links for authenticated users, including admin-only links if the user has the 'admin' role.
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

/**
 * Navbar component for site navigation
 * Shows links based on authentication and user role (admin)
 */
export default function Navbar() {
    const { token, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Extract user role from JWT token if available
    let userRole = null;
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userRole = payload.role;
        } catch (e) {
            console.error("Navbar: Error decoding token:", e);
            userRole = null;
        }
    }

    /**
     * Handles user logout and redirects to login page
     */
    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsMobileMenuOpen(false);
    };

    const linkClass = ({ isActive }) =>
        isActive ? 'text-blue-400 font-semibold px-3 py-2 rounded-md text-sm'
            : 'text-gray-300 hover:text-blue-300 px-3 py-2 rounded-md text-sm';

    const mobileLinkClass = ({ isActive }) =>
        isActive ? 'text-blue-400 font-semibold block px-3 py-2 rounded-md text-base'
            : 'text-gray-300 hover:text-blue-300 block px-3 py-2 rounded-md text-base';

    return (
        <header className="bg-gray-800 text-white shadow-md">
            <nav className="container mx-auto px-4 sm:px-6 py-3">
                <div className="flex justify-between items-center">
                    <Link to="/" className="text-xl font-bold hover:text-gray-200">
                        CaloriesTracker
                    </Link>

                    {token && (
                        <>
                            {/* Mobile menu button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                aria-expanded="false"
                            >
                                <span className="sr-only">Open main menu</span>
                                <FontAwesomeIcon 
                                    icon={isMobileMenuOpen ? faTimes : faBars} 
                                    className="h-6 w-6"
                                />
                            </button>

                            {/* Desktop menu */}
                            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
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

                                {/* Admin-only link */}
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

                            {/* Mobile menu */}
                            <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden absolute top-16 left-0 right-0 bg-gray-800 shadow-lg z-50`}>
                                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                                    <NavLink to="/diary" className={mobileLinkClass} end onClick={() => setIsMobileMenuOpen(false)}>
                                        Diary
                                    </NavLink>
                                    <NavLink to="/my-recipes" className={mobileLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                                        My Recipes
                                    </NavLink>
                                    <NavLink to="/products" className={mobileLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                                        Products
                                    </NavLink>
                                    <NavLink to="/exercises" className={mobileLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                                        Exercises
                                    </NavLink>
                                    <NavLink to="/statistics" className={mobileLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                                        Statistics
                                    </NavLink>
                                    <NavLink to="/achievements" className={mobileLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                                        Achievements
                                    </NavLink>
                                    <NavLink to="/profile" className={mobileLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                                        Profile
                                    </NavLink>

                                    {/* Admin-only link */}
                                    {userRole === 'admin' && (
                                        <NavLink to="/admin/statistics" className={mobileLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                                            Admin Stats
                                        </NavLink>
                                    )}

                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-base font-medium"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}