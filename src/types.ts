export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  walletBalance: number;
  role: 'admin' | 'user';
  phoneNumber?: string;
}

export interface Product {
  id: string;
  title: string;
  image: string;
  priceRMB: number;
  priceBDT: number;
  sourceUrl: string;
  category: string;
  stock: number;
}

export interface OrderItem {
  productId: string;
  title: string;
  image: string;
  quantity: number;
  priceBDT: number;
  sourceUrl: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: 'bkash' | 'nagad' | 'bank';
  paymentStatus: 'pending' | 'verified' | 'failed';
  orderStatus: 'pending' | 'purchased' | 'in_china_warehouse' | 'in_bd_warehouse' | 'out_for_delivery' | 'delivered' | 'cancelled';
  transactionId?: string;
  screenshotUrl?: string;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  timestamp: string;
}
