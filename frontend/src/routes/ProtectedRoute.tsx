import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';
import { Spinner } from '@/components/Spinner';

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!session || !profile) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(profile.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}
