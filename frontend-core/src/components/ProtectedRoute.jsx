import { Navigate } from 'react-router-dom';
import { haySession } from '../services/auth';

export default function ProtectedRoute({ children }) {
  if (!haySession()) return <Navigate to="/login" replace />;
  return children;
}
