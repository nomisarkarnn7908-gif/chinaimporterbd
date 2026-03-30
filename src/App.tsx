import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from './types';

// Pages (to be created)
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Login from './pages/Login';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const existingUser = userDoc.data() as User;
          // Force admin role for the specific email if not already set
          if (firebaseUser.email === 'nomisarkarnn7908@gmail.com' && existingUser.role !== 'admin') {
            const updatedUser = { ...existingUser, role: 'admin' as const };
            await setDoc(doc(db, 'users', firebaseUser.uid), updatedUser);
            setUser(updatedUser);
          } else {
            setUser(existingUser);
          }
        } else {
          // Create new user profile
          const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            walletBalance: 0,
            heldBalance: 0,
            role: firebaseUser.email === 'nomisarkarnn7908@gmail.com' ? 'admin' : 'user',
            phoneNumber: '', // Will be updated during registration
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header user={user} />
        <div className="flex flex-1 pt-16">
          <Sidebar user={user} />
          <main className="flex-1 p-4 md:p-6 ml-0 md:ml-64 transition-all duration-300">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout user={user} />} />
              <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
              <Route path="/admin" element={user?.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </main>
        </div>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}
