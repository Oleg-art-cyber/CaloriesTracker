// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login     from './pages/Login';
import Register  from './pages/Register';
import Products  from './pages/Products';
import Exercises from './pages/Exercises';
import Diary     from './pages/Diary';     // Assuming Diary is the main page now
import MyRecipes from './pages/MyRecipes'; // <-- NEW
import Navbar from './components/Navbar';
import ProfilePage from './pages/Profile';
import { useContext } from 'react';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Navbar />
                <main className="container mx-auto mt-4 px-2 sm:px-4">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Protected Routes */}
                        <Route path="/" element={<Protected><Diary /></Protected>} />
                        <Route path="/diary" element={<Protected><Diary /></Protected>} />
                        <Route path="/products" element={<Protected><Products /></Protected>} />
                        <Route path="/exercises" element={<Protected><Exercises /></Protected>} />
                        <Route path="/my-recipes" element={<Protected><MyRecipes /></Protected>} />
                        <Route path="/profile" element={<Protected><ProfilePage /></Protected>}/>
                        <Route path="*" element={<NavigateToAppropriate />} />

                    </Routes>
                </main>
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