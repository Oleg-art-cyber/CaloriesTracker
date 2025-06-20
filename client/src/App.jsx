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
import Footer from './components/Footer';
import AchievementsPage from './pages/AchievementsPage.jsx';
import StatisticsPage from './pages/StatisticsPage.jsx';
import AdminStatisticsPage from './pages/AdminStatisticsPage.jsx';
import AdminProtected from './components/AdminProtected.jsx';
import { useContext } from 'react';


export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <div className="flex flex-col min-h-screen bg-gray-100">
                    <Navbar />
                    <main className="flex-grow container mx-auto mt-4 px-2 sm:px-4 pb-8">
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />

                            {/* Protected Routes (for regular authenticated users) */}
                            <Route path="/" element={<Protected><Diary /></Protected>} />
                            <Route path="/diary" element={<Protected><Diary /></Protected>} />
                            <Route path="/my-recipes" element={<Protected><MyRecipes /></Protected>} />
                            <Route path="/products" element={<Protected><Products /></Protected>} />
                            <Route path="/exercises" element={<Protected><Exercises /></Protected>} />
                            <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
                            <Route path="/achievements" element={<Protected><AchievementsPage /></Protected>} />
                            <Route path="/statistics" element={<Protected><StatisticsPage /></Protected>} />


                            {/* Admin Only Route */}
                            <Route
                                path="/admin/statistics"
                                element={
                                    <AdminProtected> {/* This component handles role check and redirection */}
                                        <AdminStatisticsPage />
                                    </AdminProtected>
                                }
                            />

                            {/* Fallback for unmatched routes */}
                            <Route path="*" element={<NavigateToAppropriate />} />
                        </Routes>
                    </main>
                    <Footer />
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}

// General protected route component
function Protected({ children }) {
    const { token } = useContext(AuthContext);
    return token ? children : <Navigate to="/login" replace />;
}

// Fallback navigation component
function NavigateToAppropriate() {
    const { token } = useContext(AuthContext);
    return token ? <Navigate to="/diary" replace /> : <Navigate to="/login" replace />;
}