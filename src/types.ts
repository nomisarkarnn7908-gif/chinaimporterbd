export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  walletBalance: number;
  heldBalance: number;
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
  orderStatus: 'pending_confirm' | 'confirmed' | 'pending_purchase' | 'purchased' | 'china_warehouse' | 'bd_warehouse' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'stock_out';
  transactionId?: string;
  screenshotUrl?: string;
  createdAt: string;
  invoiceUrl?: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  timestamp: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  gatewayCharge: number;
  netAmount: number;
  method: 'bkash' | 'nagad' | 'bank';
  accountNumber: string;
  status: 'pending' | 'completed' | 'cancelled';
  transactionId?: string;
  createdAt: string;
  processedAt?: string;
}
