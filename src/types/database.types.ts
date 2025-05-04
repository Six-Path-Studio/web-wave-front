
export interface Product {
  id: number;
  name: string;
  token_amount: number;
  price_sol: number;
}

export interface PendingPayment {
  reference: string;
  username: string;
  product_id: number;
  token_amount: number;
  price_sol: number;
  created_at: string;
}

export interface UserToken {
  username: string;
  balance: number;
  updated_at: string;
}
