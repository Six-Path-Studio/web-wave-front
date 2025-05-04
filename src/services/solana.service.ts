
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { createTransaction } from '@solana/pay';
import BigNumber from 'bignumber.js';
import { config } from '../config/env';
import { paymentService, userTokenService } from './supabase.service';

export const solanaService = {
  async createPaymentTransaction(
    username: string,
    productId: number,
    tokenAmount: number,
    priceSol: number,
    buyerPublicKey: string
  ): Promise<{ transaction: Transaction, reference: string }> {
    // Create a connection to the Solana network
    const connection = new Connection(config.SOLANA_RPC_URL);
    
    // Create a new reference (transaction ID)
    const reference = new Uint8Array(16);
    window.crypto.getRandomValues(reference);
    const referencePublicKey = new PublicKey(reference);
    
    // Convert to string format for database
    const referenceString = referencePublicKey.toBase58();
    
    // Create a payment transaction
    const merchant = new PublicKey(config.MERCHANT_PUBLIC_KEY);
    const amount = new BigNumber(priceSol);
    const buyer = new PublicKey(buyerPublicKey);
    
    // Create the transaction
    const transaction = await createTransaction(
      connection,
      buyer,
      merchant,
      amount,
      { reference: referencePublicKey }
    );
    
    // Store pending payment in database
    await paymentService.createPendingPayment({
      reference: referenceString,
      username,
      product_id: productId,
      token_amount: tokenAmount,
      price_sol: priceSol
    });
    
    return { transaction, reference: referenceString };
  },
  
  async verifyAndFinalizePayment(reference: string): Promise<boolean> {
    try {
      // Get the pending payment from the database
      const pendingPayment = await paymentService.getPendingPayment(reference);
      
      if (!pendingPayment) {
        console.error('No pending payment found with reference:', reference);
        return false;
      }
      
      // Create a connection to the Solana network
      const connection = new Connection(config.SOLANA_RPC_URL);
      
      // Convert reference to PublicKey
      const referencePublicKey = new PublicKey(reference);
      
      // Get merchant public key
      const merchant = new PublicKey(config.MERCHANT_PUBLIC_KEY);
      
      // Find the transaction with the reference
      const signatureInfo = await connection.getSignaturesForAddress(referencePublicKey);
      
      if (signatureInfo.length === 0) {
        console.error('No transaction found with reference:', reference);
        return false;
      }
      
      // Get the most recent transaction
      const signature = signatureInfo[0].signature;
      
      // Get the transaction details
      const transaction = await connection.getTransaction(signature);
      
      if (!transaction) {
        console.error('Could not get transaction details');
        return false;
      }
      
      // Check if the transaction was successful
      if (transaction.meta?.err) {
        console.error('Transaction failed:', transaction.meta.err);
        return false;
      }
      
      // Verify the transaction included a transfer to the merchant
      const transferFound = transaction.meta?.postTokenBalances?.some(
        (balance) => balance.owner === merchant.toBase58()
      );
      
      if (!transferFound) {
        console.error('No transfer to merchant found in transaction');
        return false;
      }
      
      // Payment is verified, update user's token balance
      await userTokenService.updateUserBalance(
        pendingPayment.username,
        pendingPayment.token_amount
      );
      
      // Delete the pending payment
      await paymentService.deletePendingPayment(reference);
      
      return true;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }
};
