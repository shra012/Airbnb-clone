import { RouterProvider } from 'react-router-dom';
import router from './routes';
import NotificationsToaster from './components/NotificationsToaster';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <NotificationsToaster />
    </>
  );
}
