import { Outlet, Navigate } from 'react-router-dom';
import { User } from '../types';

interface AdminLayoutProps {
  user: User | null;
}

export default function AdminLayout({ user }: AdminLayoutProps) {
  console.log('AdminLayout rendered, user:', user);
  if (user?.role !== 'admin') {
    console.log('Redirecting to /');
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
