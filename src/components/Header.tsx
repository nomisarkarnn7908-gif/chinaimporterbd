import { Search, ShoppingCart, User as UserIcon, LogOut, Image as ImageIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { User } from '../types';
import { cn } from '../lib/utils';

interface HeaderProps {
  user: User | null;
}

export default function Header({ user }: HeaderProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center px-4 md:px-8 shadow-sm">
      <div className="flex items-center gap-2 md:gap-4 w-full max-w-7xl mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
          <span className="hidden md:block font-bold text-xl text-gray-900 tracking-tight">Sourcing<span className="text-orange-600">BD</span></span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-4 md:mx-8 relative">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search products by title or paste 1688 link..."
              className="w-full h-10 pl-4 pr-12 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
            <div className="absolute right-2 flex items-center gap-2">
              <button className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors">
                <ImageIcon size={20} />
              </button>
              <button className="p-1.5 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors">
                <Search size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 md:gap-6 shrink-0">
          <Link to="/cart" className="relative p-2 text-gray-600 hover:text-orange-600 transition-colors">
            <ShoppingCart size={24} />
            <span className="absolute top-0 right-0 bg-orange-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">0</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-300 group-hover:border-orange-500 transition-all">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-600">
                      <UserIcon size={16} />
                    </div>
                  )}
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700 group-hover:text-orange-600 transition-colors">
                  {user.displayName || 'My Account'}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-all shadow-md active:scale-95"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
