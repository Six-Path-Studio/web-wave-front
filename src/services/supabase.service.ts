
import { supabase } from '../config/env';
import { Product, PendingPayment, UserToken } from '../types/database.types';

export const productService = {
  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*');
    
    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
    
    return data || [];
  },
  
  async getProductById(id: number): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching product with id ${id}:`, error);
      throw error;
    }
    
    return data;
  }
};

export const paymentService = {
  async createPendingPayment(payment: Omit<PendingPayment, 'created_at'>): Promise<PendingPayment> {
    const { data, error } = await supabase
      .from('pending_payments')
      .insert(payment)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating pending payment:', error);
      throw error;
    }
    
    return data;
  },
  
  async getPendingPayment(reference: string): Promise<PendingPayment | null> {
    const { data, error } = await supabase
      .from('pending_payments')
      .select('*')
      .eq('reference', reference)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error(`Error fetching pending payment with reference ${reference}:`, error);
      throw error;
    }
    
    return data;
  },
  
  async deletePendingPayment(reference: string): Promise<void> {
    const { error } = await supabase
      .from('pending_payments')
      .delete()
      .eq('reference', reference);
    
    if (error) {
      console.error(`Error deleting pending payment with reference ${reference}:`, error);
      throw error;
    }
  }
};

export const userTokenService = {
  async getUserBalance(username: string): Promise<number> {
    const { data, error } = await supabase
      .from('user_tokens')
      .select('balance')
      .eq('username', username)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error(`Error fetching balance for user ${username}:`, error);
      throw error;
    }
    
    return data?.balance || 0;
  },
  
  async updateUserBalance(username: string, amount: number): Promise<void> {
    // First, check if user exists
    const { data: existingUser } = await supabase
      .from('user_tokens')
      .select('username')
      .eq('username', username)
      .single();
    
    if (existingUser) {
      // Update existing user
      const { error } = await supabase.rpc('increment_user_balance', { 
        p_username: username, 
        p_amount: amount 
      });
      
      if (error) {
        console.error(`Error updating balance for user ${username}:`, error);
        throw error;
      }
    } else {
      // Create new user with initial balance
      const { error } = await supabase
        .from('user_tokens')
        .insert({ username, balance: amount });
      
      if (error) {
        console.error(`Error creating user token record for ${username}:`, error);
        throw error;
      }
    }
  }
};
