// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import Exercises from './pages/Exercises';
import Diary from './pages/Diary';
import MyRecipes from './pages/MyRecipes';
import ProfilePage from './pages/Profile.jsx';
import Navbar from './components/Navbar';
import AchievementsPage from './pages/AchievementsPage.jsx';
import Footer from './components/Footer';
import { useContext } from 'react';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                {/*
                  Wrap Navbar, main content, and Footer in a flex container
                  that takes at least the full viewport height and arranges items in a column.
                */}
                <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900"> {/* Base background for the app */}
                    <Navbar />
                    <main className="flex-grow container mx-auto mt-4 px-2 sm:px-4 pb-8"> {/* flex-grow allows main to take available space */}
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />

                            {/* Protected Routes */}
                            <Route path="/" element={<Protected><Diary /></Protected>} />
                            <Route path="/diary" element={<Protected><Diary /></Protected>} />
                            <Route path="/my-recipes" element={<Protected><MyRecipes /></Protected>} />
                            <Route path="/products" element={<Protected><Products /></Protected>} />
                            <Route path="/exercises" element={<Protected><Exercises /></Protected>} />
                            <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
                            <Route path="/achievements" element={<Protected><AchievementsPage /></Protected>} />

                            {/* Fallback for unmatched routes */}
                            <Route path="*" element={<NavigateToAppropriate />} />
                        </Routes>
                    </main>
                    <Footer /> {/* Footer is outside main, but inside the flex container */}
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}

function Protected({ children }) {
    const { token } = useContext(AuthContext);
    return token ? children : <Navigate to="/login" replace />;
}

function NavigateToAppropriate() {
    const { token } = useContext(AuthContext);
    return token ? <Navigate to="/diary" replace /> : <Navigate to="/login" replace />;
}