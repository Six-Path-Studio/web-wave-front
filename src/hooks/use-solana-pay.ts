
import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
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
      
      console.log('Transaction created:', transaction);
      console.log('Reference:', reference);
      
      // Send the transaction
      const signature = await sendTransaction(transaction, connection);
      console.log('Transaction sent, signature:', signature);
      
      // Wait for confirmation
      toast({
        title: "Processing Payment",
        description: "Please wait while your transaction is being processed...",
      });
      
      const confirmation = await connection.confirmTransaction(signature);
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed: ' + confirmation.value.err.toString());
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
  
  // Generate a payment URL for QR codes if needed
  const generatePaymentUrl = (amount: number, label?: string, message?: string) => {
    if (!publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to generate a payment URL.",
        variant: "destructive" 
      });
      return null;
    }
    
    // Generate a reference
    const reference = new Uint8Array(16);
    window.crypto.getRandomValues(reference);
    const referencePublicKey = new PublicKey(reference);
    
    // Generate URL
    return solanaService.generatePaymentUrl(amount, referencePublicKey, label, message);
  };
  
  return {
    initializePayment,
    generatePaymentUrl,
    isProcessing,
    paymentStatus,
    resetStatus: () => setPaymentStatus('idle')
  };
}
