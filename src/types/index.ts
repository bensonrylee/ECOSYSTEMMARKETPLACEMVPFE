// User types
export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  role: 'buyer' | 'seller' | 'both';
  stripeCustomerId?: string;
  stripeConnectAccountId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Service/Product listing types
export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  images: string[];
  status: 'active' | 'inactive' | 'sold';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Transaction types
export interface Transaction {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  stripePaymentIntentId: string;
  stripeChargeId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Review types
export interface Review {
  id: string;
  transactionId: string;
  reviewerId: string;
  reviewedUserId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Chat/Message types
export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readBy: string[];
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Cart types
export interface CartItem {
  listingId: string;
  quantity: number;
  addedAt: Date;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: Date;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'message' | 'review' | 'payment' | 'system';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}