import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import BandejaPage from './pages/BandejaPage';
import DetallePage from './pages/DetallePage';
import RecuperacionesPage from './pages/RecuperacionesPage';
import MoraDetallePage from './pages/MoraDetallePage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><BandejaPage /></ProtectedRoute>} />
        <Route path="/solicitud/:cod" element={<ProtectedRoute><DetallePage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/recuperaciones" element={<ProtectedRoute><RecuperacionesPage /></ProtectedRoute>} />
        <Route path="/mora/:cod" element={<ProtectedRoute><MoraDetallePage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
