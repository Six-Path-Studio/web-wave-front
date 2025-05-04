
import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { solanaService } from '../services/solana.service';
import { productService } from '../services/supabase.service';
import { toast } from '@/hooks/use-toast';

export function useSolanaPay() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  
  const initializePayment = async (username: string, productId: number) => {
    if (!publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your Solana wallet to continue.",
        variant: "destructive"
      });
      return null;
    }
    
    setIsProcessing(true);
    setPaymentStatus('processing');
    
    try {
      // Get product details
      const product = await productService.getProductById(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Create a payment transaction
      const { transaction, reference } = await solanaService.createPaymentTransaction(
        username,
        product.id,
        product.token_amount,
        product.price_sol,
        publicKey.toBase58()
      );
      
      // Send the transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature);
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }
      
      // Verify payment on backend
      const success = await solanaService.verifyAndFinalizePayment(reference);
      
      if (success) {
        setPaymentStatus('success');
        toast({
          title: "Payment Successful!",
          description: `${product.token_amount} tokens have been added to your account.`,
        });
      } else {
        throw new Error('Payment verification failed');
      }
      
      return success;
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      toast({
        title: "Payment Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };
  
  return {
    initializePayment,
    isProcessing,
    paymentStatus,
    resetStatus: () => setPaymentStatus('idle')
  };
}
