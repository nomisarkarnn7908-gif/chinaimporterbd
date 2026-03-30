import { Home, Package, Heart, Wallet, ShieldCheck, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { User } from '../types';

const categories = [
  { name: 'Electronics', icon: '📱' },
  { name: 'Fashion', icon: '👕' },
  { name: 'Home & Kitchen', icon: '🍳' },
  { name: 'Beauty', icon: '💄' },
  { name: 'Toys', icon: '🧸' },
  { name: 'Automotive', icon: '🚗' },
];

const menuItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'My Orders', path: '/dashboard', icon: Package },
  { name: 'Wishlist', path: '/wishlist', icon: Heart },
  { name: 'Wallet', path: '/wallet', icon: Wallet },
];

export default function Sidebar({ user }: { user: User | null }) {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed top-16 bottom-0 left-0 overflow-y-auto z-40">
      <div className="p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Main Menu</h3>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                location.pathname === item.path
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-orange-600"
              )}
            >
              <item.icon size={20} className={cn(
                "transition-colors",
                location.pathname === item.path ? "text-orange-600" : "text-gray-400 group-hover:text-orange-600"
              )} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="mt-8">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Categories</h3>
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.name}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-orange-600 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{cat.icon}</span>
                  {cat.name}
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-orange-400" />
              </button>
            ))}
          </div>
        </div>

        {user?.role === 'admin' && (
          <div className="mt-auto pt-8">
            <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              <ShieldCheck size={16} />
              Admin Panel
            </div>
            <nav className="space-y-1">
              {[
                { name: 'Pending Confirm', tab: 'pending_confirm' },
                { name: 'Confirmed', tab: 'confirmed' },
                { name: 'Pending Purchase', tab: 'pending_purchase' },
                { name: 'BD Warehouse', tab: 'bd_warehouse' },
                { name: 'Refunds/Stock Out', tab: 'refunds' },
                { name: 'Withdrawals', tab: 'withdrawals' },
                { name: 'Sourcing', tab: 'sourcing' },
              ].map((subItem) => {
                const path = `/admin?tab=${subItem.tab}`;
                const isActive = location.pathname === '/admin' && location.search.includes(`tab=${subItem.tab}`);
                return (
                  <Link
                    key={subItem.tab}
                    to={path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                      isActive
                        ? "bg-orange-50 text-orange-600"
                        : "text-gray-500 hover:bg-gray-50 hover:text-orange-600"
                    )}
                  >
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isActive ? "bg-orange-600" : "bg-gray-300"
                    )} />
                    {subItem.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </aside>
  );
}
