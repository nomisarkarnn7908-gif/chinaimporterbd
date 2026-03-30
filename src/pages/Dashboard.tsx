import { useState, useEffect, FormEvent } from 'react';
import { collection, query, where, getDocs, orderBy, addDoc, increment, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { User, Order, WalletTransaction, WithdrawalRequest } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Package, Wallet, Clock, CheckCircle, Truck, XCircle, 
  ChevronRight, CreditCard, ArrowUpRight, ArrowDownLeft, 
  AlertCircle, History, Send, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface DashboardProps {
  user: User;
}

const statusIcons = {
  pending_confirm: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Pending Confirm' },
  confirmed: { icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Confirmed' },
  pending_purchase: { icon: CreditCard, color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Pending Purchase' },
  purchased: { icon: Package, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Purchased' },
  china_warehouse: { icon: Truck, color: 'text-orange-500', bg: 'bg-orange-50', label: 'China Warehouse' },
  bd_warehouse: { icon: Package, color: 'text-teal-500', bg: 'bg-teal-50', label: 'BD Warehouse' },
  out_for_delivery: { icon: Truck, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Out for Delivery' },
  delivered: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Cancelled' },
  stock_out: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Stock Out' },
};

const trackingSteps = [
  { id: 'pending_confirm', label: 'Order Placed' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'purchased', label: 'Purchased' },
  { id: 'bd_warehouse', label: 'BD Warehouse' },
  { id: 'delivered', label: 'Delivered' },
];

export default function Dashboard({ user }: DashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'bkash' | 'nagad' | 'bank'>('bkash');
  const [accountNumber, setAccountNumber] = useState('');

  const fetchData = async () => {
    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      let ordersSnap;
      try {
        ordersSnap = await getDocs(ordersQuery);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
      setOrders(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));

      const transQuery = query(
        collection(db, 'wallet_transactions'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      let transSnap;
      try {
        transSnap = await getDocs(transQuery);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'wallet_transactions');
      }
      setTransactions(transSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletTransaction)));

      const withdrawalsQuery = query(
        collection(db, 'withdrawal_requests'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      let withdrawalsSnap;
      try {
        withdrawalsSnap = await getDocs(withdrawalsQuery);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'withdrawal_requests');
      }
      setWithdrawals(withdrawalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest)));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.uid]);

  const handleWithdrawRequest = async (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (amount > user.walletBalance) {
      toast.error('Insufficient wallet balance');
      return;
    }
    if (amount < 500) {
      toast.error('Minimum withdrawal is 500 BDT');
      return;
    }

    try {
      // 1. Deduct from wallet
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { walletBalance: increment(-amount) });

      // 2. Create withdrawal request
      const request: Omit<WithdrawalRequest, 'id'> = {
        userId: user.uid,
        amount,
        gatewayCharge: 0,
        netAmount: amount,
        method: withdrawMethod,
        accountNumber,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'withdrawal_requests'), request);

      toast.success('Withdrawal request submitted!');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setAccountNumber('');
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit request');
    }
  };

  const getStepStatus = (orderStatus: string, stepId: string) => {
    const statusOrder = ['pending_confirm', 'confirmed', 'pending_purchase', 'purchased', 'china_warehouse', 'bd_warehouse', 'out_for_delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(orderStatus);
    const stepIndex = statusOrder.indexOf(stepId);

    if (currentIndex === -1) return 'pending';
    if (currentIndex >= stepIndex) return 'completed';
    return 'pending';
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 overflow-hidden border-2 border-orange-500 shadow-inner">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-orange-600 font-bold text-2xl">
                {user.displayName?.[0] || 'U'}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{user.displayName || 'User'}</h2>
            <p className="text-xs text-gray-500">{user.email}</p>
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-full uppercase">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Wallet Card */}
        <div className="bg-orange-600 p-6 rounded-3xl shadow-xl shadow-orange-200 text-white flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Wallet size={80} />
          </div>
          <div>
            <p className="text-orange-100 text-xs font-bold uppercase tracking-wider mb-1">Available Balance</p>
            <h3 className="text-3xl font-bold">{formatCurrency(user.walletBalance)}</h3>
          </div>
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="mt-4 flex items-center justify-center gap-2 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-all backdrop-blur-sm"
          >
            <ArrowUpRight size={18} />
            Withdraw Funds
          </button>
        </div>

        {/* Held Balance Card */}
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <AlertCircle size={16} />
              <p className="text-xs font-bold uppercase tracking-wider">Held Balance</p>
            </div>
            <h3 className="text-3xl font-bold text-red-700">{formatCurrency(user.heldBalance || 0)}</h3>
          </div>
          <p className="text-[10px] text-red-500 leading-relaxed mt-2">
            Funds from cancelled or stock-out items. Will be refunded to wallet soon.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Orders List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package className="text-orange-500" />
              Order Tracking
            </h3>
          </div>
          
          <div className="space-y-6">
            {loading ? (
              [1, 2].map(i => <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-3xl"></div>)
            ) : orders.length > 0 ? (
              orders.map((order) => {
                const status = statusIcons[order.orderStatus as keyof typeof statusIcons] || statusIcons.pending_confirm;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", status.bg)}>
                          <status.icon className={status.color} size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</h4>
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                            {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} Items
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase", status.bg, status.color)}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {order.orderStatus !== 'cancelled' && order.orderStatus !== 'stock_out' && (
                      <div className="relative mt-8 mb-4">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 transition-all duration-1000"
                            style={{ 
                              width: `${(trackingSteps.findIndex(s => s.id === order.orderStatus) + 1) / trackingSteps.length * 100}%` 
                            }}
                          />
                        </div>
                        <div className="relative flex justify-between">
                          {trackingSteps.map((step) => {
                            const stepStatus = getStepStatus(order.orderStatus, step.id);
                            return (
                              <div key={step.id} className="flex flex-col items-center">
                                <div className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center z-10 transition-colors duration-500",
                                  stepStatus === 'completed' ? "bg-orange-500 text-white" : "bg-white border-2 border-gray-200 text-gray-300"
                                )}>
                                  {stepStatus === 'completed' ? <CheckCircle size={14} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                                </div>
                                <span className={cn(
                                  "text-[8px] font-bold mt-2 uppercase tracking-tighter",
                                  stepStatus === 'completed' ? "text-orange-600" : "text-gray-400"
                                )}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {order.orderStatus === 'stock_out' && (
                      <div className="bg-red-50 p-4 rounded-2xl flex items-center gap-3 border border-red-100">
                        <AlertCircle className="text-red-500" size={20} />
                        <div>
                          <p className="text-xs font-bold text-red-700">Stock Out Notification</p>
                          <p className="text-[10px] text-red-600">This item is out of stock. Your payment of {formatCurrency(order.paidAmount)} is held for refund.</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center">
                <Package size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-500 font-medium">No orders found. Start sourcing!</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Wallet & Withdrawals */}
        <div className="space-y-8">
          {/* Withdrawal History */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <History className="text-orange-500" />
              Withdrawals
            </h3>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-4">
                  {[1, 2].map(i => <div key={i} className="h-12 bg-gray-50 animate-pulse rounded-xl"></div>)}
                </div>
              ) : withdrawals.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {withdrawals.map((w) => (
                    <div key={w.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-800 uppercase">{w.method}</span>
                        <span className={cn(
                          "text-[8px] font-bold px-2 py-0.5 rounded-full uppercase",
                          w.status === 'completed' ? "bg-green-50 text-green-600" : 
                          w.status === 'cancelled' ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-600"
                        )}>
                          {w.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-gray-400">{new Date(w.createdAt).toLocaleDateString()}</p>
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(w.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Info size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-[10px] text-gray-400">No withdrawal history.</p>
                </div>
              )}
            </div>
          </div>

          {/* Wallet History */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="text-orange-500" />
              Wallet History
            </h3>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 animate-pulse rounded-xl"></div>)}
                </div>
              ) : transactions.length > 0 ? (
                <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {transactions.map((t) => (
                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          t.type === 'credit' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                        )}>
                          {t.type === 'credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-800 leading-tight">{t.description}</p>
                          <p className="text-[8px] text-gray-400 mt-0.5">{new Date(t.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-xs font-bold",
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
                  <p className="text-[10px] text-gray-400">No transactions yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Withdraw Funds</h3>
                  <p className="text-sm text-gray-500">Available: {formatCurrency(user.walletBalance)}</p>
                </div>
                <button onClick={() => setShowWithdrawModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                  <XCircle size={24} />
                </button>
              </div>
              <form onSubmit={handleWithdrawRequest} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount (BDT)</label>
                  <input
                    required
                    type="number"
                    min="500"
                    max={user.walletBalance}
                    placeholder="Min. 500 BDT"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['bkash', 'nagad', 'bank'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setWithdrawMethod(m as any)}
                        className={cn(
                          "py-2 rounded-xl text-xs font-bold border transition-all uppercase",
                          withdrawMethod === m ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-100" : "bg-white border-gray-200 text-gray-500 hover:border-orange-200"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Number</label>
                  <input
                    required
                    type="text"
                    placeholder="Enter your account number"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                  />
                </div>
                <div className="bg-orange-50 p-4 rounded-2xl flex items-start gap-3">
                  <Info className="text-orange-500 shrink-0" size={18} />
                  <p className="text-[10px] text-orange-700 leading-relaxed">
                    Withdrawal requests are processed within 24-48 hours. Gateway charges may apply depending on the method.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={!withdrawAmount || !accountNumber || Number(withdrawAmount) > user.walletBalance}
                  className="w-full py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  Submit Request
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
