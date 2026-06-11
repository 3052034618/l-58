import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Layout from '@/components/layout/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Application from '@/pages/Application';
import Assets from '@/pages/Assets';
import Approval from '@/pages/Approval';
import Valuation from '@/pages/Valuation';
import Archive from '@/pages/Archive';

function ProtectedRoute() {
  const { user } = useAuthStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'applications',
            element: <Application />,
          },
          {
            path: 'assets',
            element: <Assets />,
          },
          {
            path: 'approvals',
            element: <Approval />,
          },
          {
            path: 'valuations',
            element: <Valuation />,
          },
          {
            path: 'archive',
            element: <Archive />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

export { router, RouterProvider };
