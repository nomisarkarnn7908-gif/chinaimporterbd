import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Footer() {
  const [footerData, setFooterData] = useState({
    brandName: 'SourcingPro BD',
    brandDescription: 'The most trusted medium for direct product import from China for Bangladeshi buyers. We provide 100% payment security and fast delivery.',
    whatsappNumber: 'your-whatsapp-number'
  });

  useEffect(() => {
    const fetchFooter = async () => {
      const footerSnap = await getDoc(doc(db, 'settings', 'footer'));
      if (footerSnap.exists()) {
        setFooterData(footerSnap.data() as any);
      }
    };
    fetchFooter();
  }, []);

  return (
    <footer className="bg-white border-t border-gray-200 pt-12 pb-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Brand */}
        <div>
          <h3 className="font-bold text-xl text-gray-900 mb-4">{footerData.brandName.split(' ')[0]}<span className="text-orange-600">{footerData.brandName.split(' ')[1]}</span></h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            {footerData.brandDescription}
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Important Links</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link to="/about" className="hover:text-orange-600">About Us</Link></li>
            <li><Link to="/shipping" className="hover:text-orange-600">Shipping Policy</Link></li>
            <li><Link to="/refund" className="hover:text-orange-600">Refund Policy</Link></li>
            <li><Link to="/terms" className="hover:text-orange-600">Terms & Conditions</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Support</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link to="/help" className="hover:text-orange-600">Help Center</Link></li>
            <li><Link to="/tracking" className="hover:text-orange-600">Order Tracking</Link></li>
            <li><Link to="/payments" className="hover:text-orange-600">Payment Methods</Link></li>
            <li><Link to="/contact" className="hover:text-orange-600">Contact Us</Link></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Newsletter</h4>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Your Email" 
              className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-400 border-t border-gray-100 pt-6">
        © 2026 {footerData.brandName}. All rights reserved.
      </div>

      {/* Live Chat Button */}
      <a 
        href={`https://wa.me/${footerData.whatsappNumber}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 p-4 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-all z-50"
      >
        <MessageCircle size={24} />
      </a>
    </footer>
  );
}
