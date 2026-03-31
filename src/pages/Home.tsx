import { useState, useEffect } from 'react';
import Banner from '../components/Banner';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';
import { cn } from '../lib/utils';
import { Grid, TrendingUp, Zap, ShieldCheck } from 'lucide-react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase';
import { useSearchParams } from 'react-router-dom';

import { User } from '../types';

interface HomeProps {
  user: User | null;
}

export default function Home({ user }: HomeProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'products'));
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = selectedCategory 
    ? products.filter(p => p.category === selectedCategory)
    : products;

  const clearCategory = () => {
    setSearchParams({});
  };

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
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {selectedCategory ? selectedCategory : 'Trending Products'}
          </h2>
          {selectedCategory && (
            <button 
              onClick={clearCategory}
              className="text-orange-600 font-semibold text-sm hover:underline"
            >
              View All
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-10">Loading products...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
