import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import TravelerDashboardLayout from '../layouts/TravelerDashboardLayout';
import PublicLayout from '../layouts/PublicLayout';
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import LandingPage from '../pages/landing/LandingPage';
import OwnerDashboardPage from '../pages/owner/OwnerDashboardPage';
import OwnerBookingsPage from '../pages/owner/OwnerBookingsPage';
import TravelerDashboardPage from '../pages/traveler/TravelerDashboardPage';
import TravelerBookingsPage from '../pages/traveler/TravelerBookingsPage';
import TravelerFavoritesPage from '../pages/traveler/TravelerFavoritesPage';
import ProfilePage from '../pages/ProfilePage';
import RequireAuth from './RequireAuth';

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'signup',
        element: <SignupPage />,
      },
    ],
  },
  {
    path: '/owner',
    element: (
      <RequireAuth roles={['OWNER']}>
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [
      {
        path: 'dashboard',
        element: <OwnerDashboardPage />,
      },
      {
        path: 'bookings',
        element: <OwnerBookingsPage />,
      },
    ],
  },
  {
    path: '/traveler',
    element: (
      <RequireAuth roles={['TRAVELER']}>
        <TravelerDashboardLayout />
      </RequireAuth>
    ),
    children: [
      {
        path: 'dashboard',
        element: <TravelerDashboardPage />,
      },
      {
        path: 'bookings',
        element: <TravelerBookingsPage />,
      },
      {
        path: 'favorites',
        element: <TravelerFavoritesPage />,
      },
    ],
  },
  {
    path: '/profile',
    element: (
      <RequireAuth roles={['OWNER', 'TRAVELER']}>
        <ProfilePage />
      </RequireAuth>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
