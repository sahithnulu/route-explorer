import { Route, Routes, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthRoute from "./components/AuthRoute";
import MapView from "./components/MapView";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Checks if the user has a valid access token in localStorage
// Used by ProtectedRoute and AuthRoute to determine where to redirect
export const isAuthenticated = () => {
    if (localStorage.getItem('accessToken') !== null) {
        return true;
    }
    else {
        return false;
    }
}

const App = () => {
    return (
        <Routes>
        <Route path="/" element={<ProtectedRoute><MapView /></ProtectedRoute>} />
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default App



