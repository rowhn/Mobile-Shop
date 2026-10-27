import { Navigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui';
import { useAuth } from '../../context/Auth.jsx';

/** Wrap any route that needs a signed-in user (optionally a staff role). */
export default function RequireAuth({ children, staff, admin }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  if ((admin && user.role !== 'admin') || (staff && user.role === 'customer')) {
    return (
      <div className="container py-5 my-5 text-center">
        <h1 className="page-title">Access denied</h1>
        <p className="text-muted mt-2">You do not have permission to view this page.</p>
        <Button to="/" className="mt-4">Go home</Button>
      </div>
    );
  }
  return children;
}
