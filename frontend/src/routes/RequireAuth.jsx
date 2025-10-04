import { Navigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import { useCurrentUser } from '../hooks/useAuth';

export default function RequireAuth({ children, roles }) {
  const {
    data: user,
    isLoading,
  } = useCurrentUser({
    suspense: false,
  });

  if (isLoading) {
    return <LoadingScreen fullScreen />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}
