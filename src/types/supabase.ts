// This is a placeholder for Supabase database types
// You can generate these types from your Supabase dashboard:
// 1. Go to your Supabase project dashboard
// 2. Navigate to Settings > API
// 3. Under "Generate types", you can generate TypeScript types

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'buyer' | 'seller' | 'both';
          stripe_customer_id: string | null;
          stripe_connect_account_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'buyer' | 'seller' | 'both';
          stripe_customer_id?: string | null;
          stripe_connect_account_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'buyer' | 'seller' | 'both';
          stripe_customer_id?: string | null;
          stripe_connect_account_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      listings: {
        Row: {
          id: string;
          seller_id: string;
          title: string;
          description: string;
          category: string;
          price: number;
          currency: string;
          images: string[];
          status: 'active' | 'inactive' | 'sold';
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          title: string;
          description: string;
          category: string;
          price: number;
          currency?: string;
          images?: string[];
          status?: 'active' | 'inactive' | 'sold';
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          title?: string;
          description?: string;
          category?: string;
          price?: number;
          currency?: string;
          images?: string[];
          status?: 'active' | 'inactive' | 'sold';
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          amount: number;
          currency: string;
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
          stripe_payment_intent_id: string;
          stripe_charge_id: string | null;
          metadata: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          amount: number;
          currency?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
          stripe_payment_intent_id: string;
          stripe_charge_id?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          buyer_id?: string;
          seller_id?: string;
          amount?: number;
          currency?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
          stripe_payment_intent_id?: string;
          stripe_charge_id?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};