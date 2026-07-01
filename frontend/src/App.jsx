import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import BancaPage from './pages/BancaPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SimuladorPage from './pages/SimuladorPage';
import SolicitarCreditoPage from './pages/SolicitarCreditoPage';
import MisSolicitudesPage from './pages/MisSolicitudesPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/banca" element={<BancaPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/simulador" element={<SimuladorPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/solicitar-credito" element={
          <ProtectedRoute>
            <SolicitarCreditoPage />
          </ProtectedRoute>
        } />
        <Route path="/mis-solicitudes" element={
          <ProtectedRoute>
            <MisSolicitudesPage />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
