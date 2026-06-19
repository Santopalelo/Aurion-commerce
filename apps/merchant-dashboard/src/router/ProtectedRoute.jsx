import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

/**
 * Protected Route Wrapper
 *
 * Redirects unauthenticated users to /login
 * Preserves the attempted URL so user is redirected back after login
 */
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;