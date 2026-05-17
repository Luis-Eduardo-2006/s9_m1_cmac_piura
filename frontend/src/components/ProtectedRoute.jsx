import { Navigate } from 'react-router-dom';
import { haySession } from '../services/authService';

export default function ProtectedRoute({ children }) {
  if (!haySession()) return <Navigate to="/login" replace />;
  return children;
}
