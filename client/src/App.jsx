import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login     from './pages/Login';
import Products  from './pages/Products';
import { useContext } from 'react';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<Protected><Products /></Protected>} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

/* ---- simple guard ---- */
function Protected({ children }) {
    const { token } = useContext(AuthContext);
    return token ? children : <Navigate to="/login" replace />;
}
