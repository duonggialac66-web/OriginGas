import { createBrowserRouter, Navigate } from 'react-router';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { EmployeePage } from './pages/EmployeePage';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'admin' | 'employee' }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/employee'} replace />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute role="admin">
        <AdminPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/employee',
    element: (
      <ProtectedRoute role="employee">
        <EmployeePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
