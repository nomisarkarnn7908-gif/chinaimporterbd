import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, ExternalLink, ShieldCheck, Truck, Clock, Heart, Share2, Info } from 'lucide-react';
import { formatCurrency, convertRMBtoBDT, cn } from '../lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const mockProduct = {
  id: '1',
  title: 'Xiaomi Smart Band 8 Global Version 1.62" AMOLED Screen 60Hz Blood Oxygen Fitness Tracker',
  image: 'https://picsum.photos/seed/xiaomi/800/800',
  priceRMB: 189,
  priceBDT: convertRMBtoBDT(189),
  sourceUrl: 'https://1688.com/product/1',
  category: 'Electronics',
  stock: 100,
  description: 'The Xiaomi Smart Band 8 features a 1.62" AMOLED display with a 60Hz refresh rate for smooth interactions. It supports over 150 sports modes and provides comprehensive health monitoring including heart rate, SpO2, and sleep tracking. With up to 16 days of battery life and 5ATM water resistance, it is the perfect fitness companion.',
};

export default function ProductDetails() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    toast.success('Added to cart!');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mb-12">
        {/* Image Gallery */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-square rounded-3xl overflow-hidden border border-gray-100 shadow-lg sticky top-24"
          >
            <img
              src={mockProduct.image}
              alt={mockProduct.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>

        {/* Product Info */}
        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                {mockProduct.category}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={12} /> Updated 2 hours ago
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              {mockProduct.title}
            </h1>
          </div>

          <div className="flex items-end gap-4">
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-orange-600">
                {formatCurrency(mockProduct.priceBDT)}
              </span>
              <span className="text-sm text-gray-400">
                ≈ ¥{mockProduct.priceRMB} RMB (Exchange Rate: 1 RMB = 15 BDT)
              </span>
            </div>
            <div className="mb-1 px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-lg border border-green-100">
              In Stock
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
            <Info className="text-blue-600 shrink-0" size={20} />
            <p className="text-xs text-blue-800 leading-relaxed">
              <span className="font-bold">Shipping Note:</span> This product is sourced directly from China. Estimated delivery time to Bangladesh is 12-25 days. Shipping costs will be calculated based on weight at our warehouse.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 hover:bg-gray-50 text-gray-600 font-bold transition-colors"
              >
                -
              </button>
              <span className="px-4 py-2 font-bold text-gray-900 border-x border-gray-200 min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 hover:bg-gray-50 text-gray-600 font-bold transition-colors"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <ShoppingCart size={20} />
              Add to Cart
            </button>
            <button className="p-3 border border-gray-200 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-100 transition-all">
              <Heart size={24} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6">
            <a
              href={mockProduct.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 p-3 bg-gray-50 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all border border-gray-200"
            >
              <ExternalLink size={18} />
              View on 1688
            </a>
            <button className="flex items-center justify-center gap-2 p-3 bg-gray-50 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all border border-gray-200">
              <Share2 size={18} />
              Share
            </button>
          </div>

          <div className="border-t border-gray-100 pt-8 space-y-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <ShieldCheck className="text-orange-600" size={20} />
              <span>100% Quality Assurance & Secure Sourcing</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Truck className="text-orange-600" size={20} />
              <span>Doorstep Delivery across Bangladesh</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Product Description</h2>
        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
          {mockProduct.description}
        </p>
      </div>
    </div>
  );
}
