import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, doc, updateDoc, increment, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Order, User, WalletTransaction } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { Search, Filter, CheckCircle, XCircle, ExternalLink, Eye, Wallet, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Admin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { orderStatus: status });
      toast.success(`Order status updated to ${status}`);
      fetchOrders();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
    }
  };

  const handleVerifyPayment = async (order: Order) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), { paymentStatus: 'verified' });
      toast.success('Payment verified successfully!');
      fetchOrders();
    } catch (error) {
      console.error(error);
      toast.error('Failed to verify payment');
    }
  };

  const handleRefundToWallet = async (order: Order) => {
    if (!confirm(`Are you sure you want to refund ${formatCurrency(order.paidAmount)} to user's wallet?`)) return;

    try {
      // 1. Update user wallet
      const userRef = doc(db, 'users', order.userId);
      await updateDoc(userRef, { walletBalance: increment(order.paidAmount) });

      // 2. Add transaction record
      const trans: Omit<WalletTransaction, 'id'> = {
        userId: order.userId,
        amount: order.paidAmount,
        type: 'credit',
        description: `Refund for Order #${order.id.slice(-6).toUpperCase()}`,
        timestamp: new Date().toISOString(),
      };
      await addDoc(collection(db, 'wallet_transactions'), trans);

      // 3. Update order status
      await updateDoc(doc(db, 'orders', order.id), { orderStatus: 'cancelled', paymentStatus: 'failed' });

      toast.success('Refunded to wallet successfully!');
      fetchOrders();
    } catch (error) {
      console.error(error);
      toast.error('Failed to process refund');
    }
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management System</h1>
          <p className="text-sm text-gray-500">Manage customer orders, verify payments, and update statuses.</p>
        </div>
        <button 
          onClick={fetchOrders}
          className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: orders.length, color: 'bg-blue-50 text-blue-600' },
          { label: 'Pending Payment', value: orders.filter(o => o.paymentStatus === 'pending').length, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'In Transit', value: orders.filter(o => ['purchased', 'in_china_warehouse', 'in_bd_warehouse'].includes(o.orderStatus)).length, color: 'bg-purple-50 text-purple-600' },
          { label: 'Completed', value: orders.filter(o => o.orderStatus === 'delivered').length, color: 'bg-green-50 text-green-600' },
        ].map((stat, i) => (
          <div key={i} className={cn("p-4 rounded-2xl", stat.color)}>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by Order ID, User ID, or Transaction ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">
          <Filter size={20} />
          Filters
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4 h-16 bg-gray-50/50"></td>
                  </tr>
                ))
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">#{order.id.slice(-6).toUpperCase()}</span>
                        <span className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {order.items.slice(0, 3).map((item, i) => (
                          <img key={i} src={item.image} className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                        <span className="text-[10px] text-gray-400">Paid: {formatCurrency(order.paidAmount)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                        order.paymentStatus === 'verified' ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
                      )}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        className="text-xs font-bold bg-transparent border-none focus:ring-0 cursor-pointer text-gray-700"
                      >
                        <option value="pending">Pending</option>
                        <option value="purchased">Purchased</option>
                        <option value="in_china_warehouse">In China</option>
                        <option value="in_bd_warehouse">In BD</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.paymentStatus === 'pending' && (
                          <button
                            onClick={() => handleVerifyPayment(order)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Verify Payment"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleRefundToWallet(order)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Refund to Wallet"
                        >
                          <Wallet size={18} />
                        </button>
                        <a
                          href={order.items[0].sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Open Sourcing Link"
                        >
                          <ExternalLink size={18} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No orders found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
