import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const banners = [
  {
    id: 1,
    image: 'https://picsum.photos/seed/sourcing1/1200/400',
    title: 'Direct Sourcing from 1688',
    subtitle: 'Lowest prices, highest quality. We handle everything from China to BD.',
    color: 'bg-orange-600',
  },
  {
    id: 2,
    image: 'https://picsum.photos/seed/sourcing2/1200/400',
    title: 'Fast & Secure Delivery',
    subtitle: 'Air & Sea shipping options available. Real-time order tracking.',
    color: 'bg-red-600',
  },
  {
    id: 3,
    image: 'https://picsum.photos/seed/sourcing3/1200/400',
    title: 'Trusted by 10,000+ Customers',
    subtitle: 'Secure payments via bKash, Nagad, and Bank Transfer.',
    color: 'bg-blue-600',
  },
];

export default function Banner() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((c) => (c + 1) % banners.length);
  const prev = () => setCurrent((c) => (c - 1 + banners.length) % banners.length);

  return (
    <div className="relative w-full h-[200px] md:h-[400px] rounded-2xl overflow-hidden shadow-xl mb-8 group">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <img
            src={banners[current].image}
            alt={banners[current].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center px-8 md:px-16 text-white">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-5xl font-bold mb-2 md:mb-4 max-w-xl"
            >
              {banners[current].title}
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm md:text-xl text-gray-200 max-w-lg"
            >
              {banners[current].subtitle}
            </motion.p>
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 md:mt-8 w-fit px-6 py-2 md:px-8 md:py-3 bg-orange-600 text-white rounded-full font-bold hover:bg-orange-700 transition-all shadow-lg active:scale-95"
            >
              Shop Now
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronRight size={24} />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              current === i ? "bg-orange-600 w-6" : "bg-white/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}
