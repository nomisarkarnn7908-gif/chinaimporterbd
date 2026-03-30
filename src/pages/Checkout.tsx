import React, { useState } from 'react';
import { User, OrderItem, Order } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CreditCard, Upload, CheckCircle, ShieldCheck, Info } from 'lucide-react';

interface CheckoutProps {
  user: User | null;
}

const mockCartItems: OrderItem[] = [
  {
    productId: '1',
    title: 'Xiaomi Smart Band 8 Global Version',
    image: 'https://picsum.photos/seed/xiaomi/400/400',
    quantity: 1,
    priceBDT: 2835,
    sourceUrl: 'https://1688.com/product/1',
  }
];

export default function Checkout({ user }: CheckoutProps) {
  const navigate = useNavigate();
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'bank'>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const subtotal = mockCartItems.reduce((acc, item) => acc + (item.priceBDT * item.quantity), 0);
  const shippingCost = 500; // Estimated
  const total = subtotal + shippingCost;
  const amountToPay = paymentType === 'full' ? total : Math.ceil(total * 0.7);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to place an order');
      return;
    }
    if (!transactionId) {
      toast.error('Please enter Transaction ID');
      return;
    }

    setSubmitting(true);
    try {
      const order: Omit<Order, 'id'> = {
        userId: user.uid,
        items: mockCartItems,
        totalAmount: total,
        paidAmount: amountToPay,
        balanceAmount: total - amountToPay,
        paymentMethod,
        paymentStatus: 'pending',
        orderStatus: 'pending',
        transactionId,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'orders'), order);
      toast.success('Payment Submitted Successfully! Admin will verify soon.');
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Order Summary & Payment Type */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-4 mb-6">
              {mockCartItems.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <img src={item.image} className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-1">{item.title}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity} x {formatCurrency(item.priceBDT)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-50 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping (Est.)</span>
                <span>{formatCurrency(shippingCost)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Choose Payment Plan</h3>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => setPaymentType('full')}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  paymentType === 'full' ? "border-orange-500 bg-orange-50" : "border-gray-100 hover:border-orange-200"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-900">100% Full Payment</span>
                  {paymentType === 'full' && <CheckCircle size={20} className="text-orange-600" />}
                </div>
                <p className="text-xs text-gray-500">Pay the full amount now for faster processing.</p>
                <p className="mt-2 font-bold text-orange-600">{formatCurrency(total)}</p>
              </button>

              <button
                onClick={() => setPaymentType('partial')}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  paymentType === 'partial' ? "border-orange-500 bg-orange-50" : "border-gray-100 hover:border-orange-200"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-900">70% Partial Payment</span>
                  {paymentType === 'partial' && <CheckCircle size={20} className="text-orange-600" />}
                </div>
                <p className="text-xs text-gray-500">Pay 70% now, balance when product reaches BD.</p>
                <p className="mt-2 font-bold text-orange-600">{formatCurrency(Math.ceil(total * 0.7))}</p>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Payment Method & Verification */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h3>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { id: 'bkash', name: 'bKash', color: 'bg-[#D12053]' },
                { id: 'nagad', name: 'Nagad', color: 'bg-[#F7941D]' },
                { id: 'bank', name: 'Bank', color: 'bg-[#006747]' },
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                    paymentMethod === method.id ? "border-orange-500 bg-orange-50" : "border-gray-100"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[10px]", method.color)}>
                    {method.name[0]}
                  </div>
                  <span className="text-xs font-bold text-gray-700">{method.name}</span>
                </button>
              ))}
            </div>

            <div className="bg-blue-50 p-4 rounded-xl mb-6 flex gap-3">
              <Info className="text-blue-600 shrink-0" size={20} />
              <div className="text-xs text-blue-800">
                <p className="font-bold mb-1">Payment Instructions:</p>
                <p>Please send <span className="font-bold">{formatCurrency(amountToPay)}</span> to our {paymentMethod} number: <span className="font-bold">017XXXXXXXX</span>. Use "Order" as reference.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Transaction ID</label>
                <input
                  type="text"
                  required
                  placeholder="Enter Transaction ID"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Payment Screenshot (Optional)</label>
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                  />
                  <div className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 group-hover:border-orange-500 group-hover:text-orange-500 transition-all">
                    <Upload size={24} className="mb-1" />
                    <span className="text-xs font-medium">{screenshot ? screenshot.name : 'Upload Screenshot'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-lg hover:bg-orange-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <ShieldCheck size={24} />
                Submit Payment
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
