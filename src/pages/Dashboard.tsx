import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Order, WalletTransaction } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { Package, Wallet, Clock, CheckCircle, Truck, XCircle, ChevronRight, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardProps {
  user: User;
}

const statusIcons = {
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Pending' },
  purchased: { icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Purchased' },
  in_china_warehouse: { icon: Package, color: 'text-purple-500', bg: 'bg-purple-50', label: 'In China' },
  in_bd_warehouse: { icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'In BD' },
  out_for_delivery: { icon: Truck, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Out for Delivery' },
  delivered: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Cancelled' },
};

export default function Dashboard({ user }: DashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const ordersSnap = await getDocs(ordersQuery);
        setOrders(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));

        const transQuery = query(
          collection(db, 'wallet_transactions'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        const transSnap = await getDocs(transQuery);
        setTransactions(transSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletTransaction)));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.uid]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* Profile Card */}
        <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 overflow-hidden border-2 border-orange-500">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-orange-600 font-bold text-2xl">
                {user.displayName?.[0] || 'U'}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.displayName || 'User'}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-full uppercase">
              {user.role}
            </span>
          </div>
        </div>

        {/* Wallet Card */}
        <div className="flex-1 bg-orange-600 p-6 rounded-2xl shadow-lg text-white flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-sm font-medium mb-1">Wallet Balance</p>
            <h3 className="text-3xl font-bold">{formatCurrency(user.walletBalance)}</h3>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Wallet size={28} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Orders List */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
            <button className="text-orange-600 text-sm font-semibold hover:underline">View All</button>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl"></div>)
            ) : orders.length > 0 ? (
              orders.map((order) => {
                const status = statusIcons[order.orderStatus as keyof typeof statusIcons];
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", status.bg)}>
                        <status.icon className={status.color} size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Order #{order.id.slice(-6).toUpperCase()}</h4>
                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase", status.bg, status.color)}>
                            {status.label}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 group-hover:text-orange-500 transition-colors" />
                  </motion.div>
                );
              })
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No orders found. Start shopping!</p>
              </div>
            )}
          </div>
        </div>

        {/* Wallet Transactions */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Wallet History</h3>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 animate-pulse rounded-lg"></div>)}
              </div>
            ) : transactions.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {transactions.map((t) => (
                  <div key={t.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{t.description}</p>
                      <p className="text-[10px] text-gray-400">{new Date(t.timestamp).toLocaleString()}</p>
                    </div>
                    <span className={cn(
                      "text-sm font-bold",
                      t.type === 'credit' ? "text-green-600" : "text-red-600"
                    )}>
                      {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Wallet size={32} className="mx-auto text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">No transactions yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
