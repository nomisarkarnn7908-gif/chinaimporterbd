import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const mockCartItems = [
  {
    id: '1',
    title: 'Xiaomi Smart Band 8 Global Version',
    image: 'https://picsum.photos/seed/xiaomi/400/400',
    quantity: 1,
    priceBDT: 2835,
  }
];

export default function Cart() {
  const [items, setItems] = useState(mockCartItems);

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const subtotal = items.reduce((acc, item) => acc + (item.priceBDT * item.quantity), 0);

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={48} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 max-w-xs">Looks like you haven't added anything to your cart yet.</p>
        <Link
          to="/"
          className="px-8 py-3 bg-orange-600 text-white rounded-full font-bold hover:bg-orange-700 transition-all shadow-lg"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
        <ShoppingCart size={32} className="text-orange-600" />
        Shopping Cart
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 group"
              >
                <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                  <img src={item.image} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm md:text-base line-clamp-2 mb-1">{item.title}</h3>
                  <p className="text-orange-600 font-bold">{formatCurrency(item.priceBDT)}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center border border-gray-100 rounded-lg overflow-hidden text-xs">
                      <button className="px-2 py-1 hover:bg-gray-50 text-gray-500">-</button>
                      <span className="px-3 py-1 font-bold text-gray-700 border-x border-gray-100">{item.quantity}</span>
                      <button className="px-2 py-1 hover:bg-gray-50 text-gray-500">+</button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">Calculated at checkout</span>
              </div>
              <div className="border-t border-gray-50 pt-3 flex justify-between text-xl font-bold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>
            <Link
              to="/checkout"
              className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-700 transition-all shadow-lg active:scale-95"
            >
              Proceed to Checkout
              <ArrowRight size={20} />
            </Link>
            <p className="text-[10px] text-gray-400 text-center mt-4">
              Secure checkout powered by SourcingBD
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
