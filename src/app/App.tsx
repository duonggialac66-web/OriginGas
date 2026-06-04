import { RouterProvider } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { router } from './routes';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </DataProvider>
    </AuthProvider>
  );
}