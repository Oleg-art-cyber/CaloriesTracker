// client/src/components/Navbar.jsx
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { NavLink, Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
    const { token, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const linkClass = ({ isActive }) =>
        isActive ? 'text-blue-400 font-semibold' : 'hover:text-blue-300';

    return (
        <header className="bg-gray-800 text-white px-4 sm:px-6 py-3 flex justify-between items-center">
            <Link to="/" className="text-lg font-bold">
                CaloriesTracker
            </Link>

            {token && (
                <nav className="flex gap-x-3 sm:gap-x-4 items-center">
                    <NavLink to="/diary" className={linkClass} end> {/* Changed from "/" to "/diary" for explicitness */}
                        Diary
                    </NavLink>
                    <NavLink to="/my-recipes" className={linkClass}> {/* <-- NEW LINK */}
                        My Recipes
                    </NavLink>
                    <NavLink to="/products" className={linkClass}>
                        Products
                    </NavLink>
                    <NavLink to="/exercises" className={linkClass}>
                        Exercises
                    </NavLink>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-md text-sm"
                    >
                        Logout
                    </button>
                </nav>
            )}
        </header>
    );
}