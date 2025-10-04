import { Outlet } from 'react-router-dom';
import AppHeader from '../components/AppHeader';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-base-100">
      <AppHeader />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
