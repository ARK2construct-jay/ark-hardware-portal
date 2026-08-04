import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Nested inside ProtectedRoute's tree — assumes `user` is already loaded and
// present. Sends non-admins back to the dashboard rather than showing them
// the admin panel (or a scary error) if they type the URL directly.
export default function AdminRoute() {
  const { user } = useAuth();

  if (!user?.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
