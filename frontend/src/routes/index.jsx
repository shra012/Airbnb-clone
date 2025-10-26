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
import OwnerPropertiesPage from '../pages/owner/OwnerPropertiesPage';
import TravelerSearchPage from '../pages/traveler/TravelerSearchPage';
import TravelerPropertyDetailsPage from '../pages/traveler/TravelerPropertyDetailsPage';
import AddPropertyPage from '../pages/owner/AddPropertyPage';
import TravelerDashboardPage from '../pages/traveler/TravelerDashboardPage';
import TravelerBookingsPage from '../pages/traveler/TravelerBookingsPage';
import TravelerFavoritesPage from '../pages/traveler/TravelerFavoritesPage';
import TravelerHistoryPage from '../pages/traveler/TravelerHistoryPage';
import ProfilePage from '../pages/ProfilePage';
import AboutPage from '../pages/AboutPage';
import RequireAuth from './RequireAuth';
import AppErrorBoundary from '../components/AppErrorBoundary';

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <AppErrorBoundary />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'about',
        element: <AboutPage />,
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    errorElement: <AppErrorBoundary />,
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
    errorElement: <AppErrorBoundary />,
    children: [
      {
        path: 'dashboard',
        element: <OwnerDashboardPage />,
      },
      {
        path: 'bookings',
        element: <OwnerBookingsPage />,
      },
      {
        path: 'properties',
        element: <OwnerPropertiesPage />,
      },
      {
        path: 'properties/new',
        element: <AddPropertyPage />,
      },
      {
        path: 'properties/:id/edit',
        element: <AddPropertyPage />,
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
    errorElement: <AppErrorBoundary />,
    children: [
      {
        path: 'dashboard',
        element: <TravelerDashboardPage />,
      },
      {
        path: 'search',
        element: <TravelerSearchPage />,
      },
      {
        path: 'properties/:propertyId',
        element: <TravelerPropertyDetailsPage />,
      },
      {
        path: 'bookings',
        element: <TravelerBookingsPage />,
      },
      {
        path: 'favorites',
        element: <TravelerFavoritesPage />,
      },
      {
        path: 'history',
        element: <TravelerHistoryPage />, 
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
    errorElement: <AppErrorBoundary />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
