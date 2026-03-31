import React, { useState, useEffect, FormEvent } from 'react';
import { collection, query, getDocs, orderBy, doc, updateDoc, increment, addDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Order, User, WalletTransaction, WithdrawalRequest, Product } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Search, Filter, CheckCircle, ExternalLink, Eye, Wallet, 
  RefreshCw, FileText, Plus, AlertCircle, Trash2, Package, LogOut
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { useSearchParams, useNavigate } from 'react-router-dom';

export default function Admin() {
  console.log('Admin component rendered');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = (searchParams.get('tab') as any) || 'pending_confirm';
  const [activeTab, setActiveTab] = useState<'pending_confirm' | 'confirmed' | 'pending_purchase' | 'bd_warehouse' | 'withdrawals' | 'sourcing' | 'refunds' | 'products' | 'footer' | 'pages'>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [footerData, setFooterData] = useState({
    brandName: 'SourcingPro BD',
    brandDescription: 'The most trusted medium for direct product import from China for Bangladeshi buyers. We provide 100% payment security and fast delivery.',
    whatsappNumber: 'your-whatsapp-number'
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as any);
    setSearchParams({ tab });
  };
  
  // Refund Form State
  const [refundData, setRefundData] = useState({
    amount: 0,
    gatewayCharge: 0,
    transactionId: '',
  });

  // Sourcing Form State
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    image: '',
    priceRMB: 0,
    priceBDT: 0,
    sourceUrl: '',
    category: 'Electronics',
    stock: 100,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const ordersQ = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      let ordersSnap;
      try {
        ordersSnap = await getDocs(ordersQ);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
      setOrders(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));

      const withdrawalsQ = query(collection(db, 'withdrawal_requests'), orderBy('createdAt', 'desc'));
      let withdrawalsSnap;
      try {
        withdrawalsSnap = await getDocs(withdrawalsQ);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'withdrawal_requests');
      }
      setWithdrawals(withdrawalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest)));

      const productsSnap = await getDocs(collection(db, 'products'));
      setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      
      // Fetch Footer Settings
      const footerSnap = await getDoc(doc(db, 'settings', 'footer'));
      if (footerSnap.exists()) {
        setFooterData(footerSnap.data() as any);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusUpdate = async (orderId: string, status: Order['orderStatus']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { orderStatus: status });
      toast.success(`Order status updated to ${status}`);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
    }
  };

  const handleVerifyPayment = async (order: Order) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), { paymentStatus: 'verified' });
      toast.success('Payment verified successfully!');
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to verify payment');
    }
  };

  const handleStockOut = async (order: Order) => {
    setShowConfirmModal({
      isOpen: true,
      title: 'Mark as Stock Out?',
      message: 'This will hold the paid amount for refund.',
      onConfirm: async () => {
        try {
          const userRef = doc(db, 'users', order.userId);
          await updateDoc(userRef, { 
            heldBalance: increment(order.paidAmount) 
          });

          await updateDoc(doc(db, 'orders', order.id), { 
            orderStatus: 'stock_out',
            paymentStatus: 'failed'
          });

          toast.success('Order marked as Stock Out. Funds are now held.');
          fetchData();
        } catch (error) {
          console.error(error);
          toast.error('Failed to process stock out');
        }
        setShowConfirmModal({ ...showConfirmModal, isOpen: false });
      }
    });
  };

  const handleRefundToWallet = async (order: Order) => {
    setShowConfirmModal({
      isOpen: true,
      title: 'Refund to Wallet?',
      message: `Refund ${formatCurrency(order.paidAmount)} to user's wallet?`,
      onConfirm: async () => {
        try {
          const userRef = doc(db, 'users', order.userId);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.data() as User;

          const updates: any = { walletBalance: increment(order.paidAmount) };
          if (order.orderStatus === 'stock_out' || order.orderStatus === 'cancelled') {
            if (userData.heldBalance >= order.paidAmount) {
              updates.heldBalance = increment(-order.paidAmount);
            }
          }

          await updateDoc(userRef, updates);

          const trans: Omit<WalletTransaction, 'id'> = {
            userId: order.userId,
            amount: order.paidAmount,
            type: 'credit',
            description: `Refund for Order #${order.id.slice(-6).toUpperCase()}`,
            timestamp: new Date().toISOString(),
          };
          await addDoc(collection(db, 'wallet_transactions'), trans);

          await updateDoc(doc(db, 'orders', order.id), { orderStatus: 'cancelled' });

          toast.success('Refunded to wallet successfully!');
          fetchData();
        } catch (error) {
          console.error(error);
          toast.error('Failed to process refund');
        }
        setShowConfirmModal({ ...showConfirmModal, isOpen: false });
      }
    });
  };

  const handleProcessWithdrawal = async () => {
    if (!selectedWithdrawal) return;
    try {
      await updateDoc(doc(db, 'withdrawal_requests', selectedWithdrawal.id), {
        status: 'completed',
        transactionId: refundData.transactionId,
        gatewayCharge: refundData.gatewayCharge,
        processedAt: new Date().toISOString(),
      });

      toast.success('Withdrawal processed successfully!');
      setShowRefundModal(false);
      setSelectedWithdrawal(null);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to process withdrawal');
    }
  };

  const handleCancelWithdrawal = async (withdrawal: WithdrawalRequest) => {
    setShowConfirmModal({
      isOpen: true,
      title: 'Cancel Withdrawal?',
      message: 'Cancel this withdrawal request? Funds will return to wallet.',
      onConfirm: async () => {
        try {
          const userRef = doc(db, 'users', withdrawal.userId);
          await updateDoc(userRef, { walletBalance: increment(withdrawal.amount) });

          await updateDoc(doc(db, 'withdrawal_requests', withdrawal.id), {
            status: 'cancelled',
            processedAt: new Date().toISOString(),
          });

          toast.success('Withdrawal cancelled and funds returned to wallet.');
          fetchData();
        } catch (error) {
          console.error(error);
          toast.error('Failed to cancel withdrawal');
        }
        setShowConfirmModal({ ...showConfirmModal, isOpen: false });
      }
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'products'), newProduct);
      toast.success('Product added successfully!');
      setNewProduct({
        title: '',
        description: '',
        image: '',
        priceRMB: 0,
        priceBDT: 0,
        sourceUrl: '',
        category: 'Electronics',
        stock: 100,
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to add product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setShowConfirmModal({
      isOpen: true,
      title: 'Delete Product?',
      message: 'Are you sure you want to delete this product?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'products', productId));
          toast.success('Product deleted successfully!');
          fetchData();
        } catch (error) {
          console.error(error);
          toast.error('Failed to delete product');
        }
        setShowConfirmModal({ ...showConfirmModal, isOpen: false });
      }
    });
  };

  const handleUpdateFooter = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'settings', 'footer'), footerData);
      toast.success('Footer updated successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update footer');
    }
  };

  const handleMakeInvoice = (order: Order) => {
    toast.info(`Generating invoice for Order #${order.id.slice(-6).toUpperCase()}...`);
    setTimeout(() => {
      toast.success('Invoice generated successfully!');
    }, 1500);
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeTab === 'pending_confirm') return o.orderStatus === 'pending_confirm';
    if (activeTab === 'confirmed') return o.orderStatus === 'confirmed';
    if (activeTab === 'pending_purchase') return o.orderStatus === 'pending_purchase';
    if (activeTab === 'bd_warehouse') return o.orderStatus === 'bd_warehouse';
    if (activeTab === 'refunds') return o.orderStatus === 'stock_out' || o.orderStatus === 'cancelled';
    
    return true;
  });

  const tabs = [
    { id: 'pending_confirm', label: 'Pending Confirm', icon: AlertCircle },
    { id: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { id: 'pending_purchase', label: 'Pending Purchase', icon: RefreshCw },
    { id: 'bd_warehouse', label: 'BD Warehouse', icon: Package },
    { id: 'refunds', label: 'Refunds/Stock Out', icon: Wallet },
    { id: 'withdrawals', label: 'Withdrawals', icon: ExternalLink },
    { id: 'sourcing', label: 'Add Product', icon: Plus },
    { id: 'products', label: 'Manage Products', icon: Package },
    { id: 'footer', label: 'Footer Settings', icon: FileText },
    { id: 'pages', label: 'Page Content', icon: FileText },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20 flex gap-8">
      {/* Sidebar Navigation */}
      <div className="w-64 shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 sticky top-20">
          <h2 className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Control Center</h2>
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button 
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "w-full px-4 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-3",
                  activeTab === tab.id 
                    ? "bg-orange-500 text-white shadow-md" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-orange-600"
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 px-2">
            <button 
              onClick={fetchData}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold text-gray-500 hover:text-orange-500 transition-colors"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh Data
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 py-2 mt-2 text-sm font-bold text-red-500 hover:text-red-600 transition-colors"
            >
              <LogOut size={16} />
              Exit Admin Panel
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {tabs.find(t => t.id === activeTab)?.label || 'Admin Control Center'}
          </h1>
          <p className="text-sm text-gray-500">Manage your business operations efficiently.</p>
        </div>

        {(activeTab === 'pending_confirm' || activeTab === 'pending_purchase' || activeTab === 'bd_warehouse' || activeTab === 'refunds') && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Pending Confirm', value: orders.filter(o => o.orderStatus === 'pending_confirm').length, color: 'bg-yellow-50 text-yellow-600' },
                { label: 'Pending Purchase', value: orders.filter(o => o.orderStatus === 'pending_purchase').length, color: 'bg-blue-50 text-blue-600' },
                { label: 'Held Balance', value: orders.filter(o => o.orderStatus === 'stock_out').length, color: 'bg-red-50 text-red-600' },
                { label: 'Delivered', value: orders.filter(o => o.orderStatus === 'delivered').length, color: 'bg-green-50 text-green-600' },
              ].map((stat, i) => (
                <div key={i} className={cn("p-4 rounded-2xl", stat.color)}>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search orders..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Order</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Payment</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      [1, 2, 3].map(i => <tr key={i} className="animate-pulse h-20 bg-gray-50/50"></tr>)
                    ) : filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                              {order.items.slice(0, 2).map((item, i) => (
                                <img key={i} src={item.image} className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" />
                              ))}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">#{order.id.slice(-6).toUpperCase()}</p>
                              <p className="text-[10px] text-gray-400">{formatCurrency(order.totalAmount)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                order.paymentStatus === 'verified' ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
                              )}>
                                {order.paymentStatus}
                              </span>
                              {order.screenshotUrl && (
                                <button 
                                  onClick={() => window.open(order.screenshotUrl, '_blank')}
                                  className="text-blue-500 hover:text-blue-600"
                                  title="View Screenshot"
                                >
                                  <Eye size={14} />
                                </button>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1">{order.transactionId || 'No TXID'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={order.orderStatus}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value as any)}
                            className="text-xs font-bold bg-gray-50 border-none rounded-lg px-2 py-1 focus:ring-0 cursor-pointer text-gray-700"
                          >
                            <option value="pending_confirm">Pending Confirm</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="pending_purchase">Pending Purchase</option>
                            <option value="purchased">Purchased</option>
                            <option value="china_warehouse">China Warehouse</option>
                            <option value="bd_warehouse">BD Warehouse</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="stock_out">Stock Out</option>
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
                            {order.orderStatus === 'pending_confirm' && (
                              <button
                                onClick={() => handleStockOut(order)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Stock Out"
                              >
                                <AlertCircle size={18} />
                              </button>
                            )}
                            {(order.orderStatus === 'stock_out' || order.orderStatus === 'cancelled') && (
                              <button
                                onClick={() => handleRefundToWallet(order)}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Refund to Wallet"
                              >
                                <Wallet size={18} />
                              </button>
                            )}
                            {order.orderStatus === 'bd_warehouse' && (
                              <button
                                onClick={() => handleMakeInvoice(order)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Make Invoice"
                              >
                                <FileText size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Price (BDT)</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={product.image} alt={product.title} className="w-10 h-10 rounded-lg object-cover" />
                          <span className="text-sm font-bold text-gray-900">{product.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(product.priceBDT)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{product.stock}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">User</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {withdrawals.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No withdrawal requests.</td></tr>
                  ) : withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{w.userId.slice(0, 8)}...</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatCurrency(w.amount)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-700 uppercase">{w.method}</span>
                          <span className="text-[10px] text-gray-400">{w.accountNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                          w.status === 'completed' ? "bg-green-50 text-green-600" : 
                          w.status === 'cancelled' ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-600"
                        )}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {w.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(w);
                                setRefundData({ amount: w.amount, gatewayCharge: 0, transactionId: '' });
                                setShowRefundModal(true);
                              }}
                              className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors"
                            >
                              Process
                            </button>
                            <button
                              onClick={() => handleCancelWithdrawal(w)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Cancel Request"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'sourcing' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Plus className="text-orange-500" />
                Link 1688/Alibaba Product
              </h2>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Title</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    value={newProduct.title}
                    onChange={e => setNewProduct({...newProduct, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Description</label>
                  <textarea
                    required
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    value={newProduct.description}
                    onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price (RMB)</label>
                    <input
                      required
                      type="number"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                      value={newProduct.priceRMB}
                      onChange={e => setNewProduct({...newProduct, priceRMB: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price (BDT)</label>
                    <input
                      required
                      type="number"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                      value={newProduct.priceBDT}
                      onChange={e => setNewProduct({...newProduct, priceBDT: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                  <select
                    required
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Home & Kitchen">Home & Kitchen</option>
                    <option value="Beauty">Beauty</option>
                    <option value="Toys">Toys</option>
                    <option value="Automotive">Automotive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Image</label>
                  <input
                    required
                    type="file"
                    accept="image/*"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    onChange={handleImageChange}
                  />
                  {newProduct.image && <img src={newProduct.image} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded-lg" />}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Source URL (1688/Alibaba)</label>
                  <input
                    required
                    type="url"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    value={newProduct.sourceUrl}
                    onChange={e => setNewProduct({...newProduct, sourceUrl: e.target.value})}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
                >
                  Add to Site
                </button>
              </form>
            </div>
            
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
              <h3 className="text-orange-800 font-bold mb-4">Sourcing Instructions</h3>
              <ul className="space-y-3 text-sm text-orange-700">
                <li className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-orange-200 flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                  Find a product on 1688.com or Alibaba.com
                </li>
                <li className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-orange-200 flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                  Copy the image URL and product link
                </li>
                <li className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-orange-200 flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                  Calculate BDT price (RMB * Rate + Profit)
                </li>
                <li className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-orange-200 flex items-center justify-center text-[10px] font-bold shrink-0">4</div>
                  Fill the form and click "Add to Site"
                </li>
              </ul>
            </div>
          </div>
        )}
        {activeTab === 'footer' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Footer Settings</h2>
            <form onSubmit={handleUpdateFooter} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Brand Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                  value={footerData.brandName}
                  onChange={e => setFooterData({...footerData, brandName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Brand Description</label>
                <textarea
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                  value={footerData.brandDescription}
                  onChange={e => setFooterData({...footerData, brandDescription: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                  value={footerData.whatsappNumber}
                  onChange={e => setFooterData({...footerData, whatsappNumber: e.target.value})}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
              >
                Save Footer Settings
              </button>
            </form>
          </div>
        )}
        {activeTab === 'pages' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Page Content</h2>
            <p className="text-sm text-gray-500 mb-4">Select a page to edit its content.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['About', 'Shipping', 'Refund', 'Terms', 'Help', 'Tracking', 'Payments', 'Contact'].map(page => (
                <div key={page} className="p-4 border border-gray-200 rounded-xl flex justify-between items-center">
                  <span>{page} Policy</span>
                  <div className="flex gap-2">
                    <button 
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                      onClick={() => navigate(`/admin/edit-page/${page}`)}
                    >
                      Edit
                    </button>
                    <button 
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                      onClick={() => alert(`Delete ${page}`)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showConfirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{showConfirmModal.title}</h3>
                <p className="text-sm text-gray-500 mb-6">{showConfirmModal.message}</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowConfirmModal({ ...showConfirmModal, isOpen: false })}
                    className="flex-1 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={showConfirmModal.onConfirm}
                    className="flex-1 py-2 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-all"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {showRefundModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Process Withdrawal</h3>
                <p className="text-sm text-gray-500">Enter payment details to complete the refund.</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount to Pay</label>
                  <input
                    type="number"
                    readOnly
                    className="w-full px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 text-gray-500"
                    value={refundData.amount}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gateway Charge (BDT)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    value={refundData.gatewayCharge}
                    onChange={e => setRefundData({...refundData, gatewayCharge: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Transaction ID</label>
                  <input
                    type="text"
                    placeholder="Enter payment TXID"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    value={refundData.transactionId}
                    onChange={e => setRefundData({...refundData, transactionId: e.target.value})}
                  />
                </div>
                <div className="bg-blue-50 p-4 rounded-xl">
                  <p className="text-xs text-blue-700 font-medium">
                    Net Amount: <span className="font-bold">{formatCurrency(refundData.amount - refundData.gatewayCharge)}</span>
                  </p>
                </div>
              </div>
              <div className="p-6 bg-gray-50 flex gap-3">
                <button 
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleProcessWithdrawal}
                  disabled={!refundData.transactionId}
                  className="flex-1 py-3 bg-green-500 text-white text-sm font-bold rounded-xl hover:bg-green-600 transition-all disabled:opacity-50"
                >
                  Submit Payment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
