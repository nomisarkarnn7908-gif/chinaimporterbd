import Banner from '../components/Banner';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';
import { convertRMBtoBDT, cn } from '../lib/utils';
import { Grid, TrendingUp, Zap, ShieldCheck } from 'lucide-react';

const mockProducts: Product[] = [
  {
    id: '1',
    title: 'Xiaomi Smart Band 8 Global Version 1.62" AMOLED Screen 60Hz Blood Oxygen Fitness Tracker',
    image: 'https://picsum.photos/seed/xiaomi/400/400',
    priceRMB: 189,
    priceBDT: convertRMBtoBDT(189),
    sourceUrl: 'https://1688.com/product/1',
    category: 'Electronics',
    stock: 100,
  },
  {
    id: '2',
    title: 'Luxury Men\'s Automatic Skeleton Watch Waterproof Stainless Steel Mechanical Wristwatch',
    image: 'https://picsum.photos/seed/watch/400/400',
    priceRMB: 250,
    priceBDT: convertRMBtoBDT(250),
    sourceUrl: 'https://1688.com/product/2',
    category: 'Fashion',
    stock: 50,
  },
  {
    id: '3',
    title: 'Portable Electric Fruit Juicer USB Rechargeable Smoothie Blender 400ml Mini Juicer Cup',
    image: 'https://picsum.photos/seed/juicer/400/400',
    priceRMB: 45,
    priceBDT: convertRMBtoBDT(45),
    sourceUrl: 'https://1688.com/product/3',
    category: 'Home & Kitchen',
    stock: 200,
  },
  {
    id: '4',
    title: 'Wireless Bluetooth Earbuds Noise Cancelling Headphones with Charging Case for iPhone Android',
    image: 'https://picsum.photos/seed/earbuds/400/400',
    priceRMB: 75,
    priceBDT: convertRMBtoBDT(75),
    sourceUrl: 'https://1688.com/product/4',
    category: 'Electronics',
    stock: 150,
  },
  {
    id: '5',
    title: 'Women\'s Crossbody Bag Designer Leather Handbag Small Square Shoulder Bag for Ladies',
    image: 'https://picsum.photos/seed/bag/400/400',
    priceRMB: 120,
    priceBDT: convertRMBtoBDT(120),
    sourceUrl: 'https://1688.com/product/5',
    category: 'Fashion',
    stock: 80,
  },
  {
    id: '6',
    title: 'Smart LED Strip Lights RGB 5050 with Remote Control Bluetooth App Sync for Room Decor',
    image: 'https://picsum.photos/seed/led/400/400',
    priceRMB: 35,
    priceBDT: convertRMBtoBDT(35),
    sourceUrl: 'https://1688.com/product/6',
    category: 'Home & Kitchen',
    stock: 300,
  },
];

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto">
      <Banner />

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { icon: Zap, title: 'Fast Sourcing', desc: 'Direct from 1688', color: 'text-yellow-500', bg: 'bg-yellow-50' },
          { icon: ShieldCheck, title: 'Secure Payment', desc: 'bKash/Nagad/Bank', color: 'text-green-500', bg: 'bg-green-50' },
          { icon: TrendingUp, title: 'Low Cost', desc: 'Wholesale Prices', color: 'text-blue-500', bg: 'bg-blue-50' },
          { icon: Grid, title: 'Huge Variety', desc: 'Millions of Products', color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map((feature, i) => (
          <div key={i} className={cn("p-4 rounded-xl flex flex-col items-center text-center", feature.bg)}>
            <feature.icon className={cn("mb-2", feature.color)} size={32} />
            <h4 className="font-bold text-gray-900 text-sm">{feature.title}</h4>
            <p className="text-xs text-gray-500">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* Product Grid */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Trending Products</h2>
          <button className="text-orange-600 font-semibold text-sm hover:underline">View All</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {mockProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
