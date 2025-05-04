import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { encodeURL, createTransfer } from '@solana/pay';
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
  ): Promise<{ transaction: Transaction; reference: string }> {
    // Create a connection to the Solana network
    const connection = new Connection(config.SOLANA_RPC_URL);

    // Create a new reference (transaction ID)
    const reference = new Uint8Array(16);
    window.crypto.getRandomValues(reference);
    const referencePublicKey = new PublicKey(reference);

    // Convert to string format for database
    const referenceString = referencePublicKey.toBase58();

    // Create a new transaction
    const transaction = new Transaction();

    // Get the merchant public key
    const merchant = new PublicKey(config.MERCHANT_PUBLIC_KEY);

    // Get the buyer public key
    const buyer = new PublicKey(buyerPublicKey);

    // Create transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: buyer,
      toPubkey: merchant,
      lamports: priceSol * LAMPORTS_PER_SOL, // Convert SOL to lamports
    });

    // Add reference to the instruction
    transferInstruction.keys.push({
      pubkey: referencePublicKey,
      isSigner: false,
      isWritable: false,
    });

    // Add instruction to transaction
    transaction.add(transferInstruction);

    // Store pending payment in database
    await paymentService.createPendingPayment({
      reference: referenceString,
      username,
      product_id: productId,
      token_amount: tokenAmount,
      price_sol: priceSol,
    });

    return { transaction, reference: referenceString };
  },

  // Generate URL for Solana Pay QR code if needed
  generatePaymentUrl(
    amount: number,
    reference: PublicKey,
    label: string = 'Six Path Game Store',
    message: string = 'Thanks for your purchase!'
  ): string {
    const merchant = new PublicKey(config.MERCHANT_PUBLIC_KEY);
    const url = encodeURL({
      recipient: merchant,
      amount: new BigNumber(amount),
      reference,
      label,
      message,
    });

    return url.toString();
  },

  async verifyAndFinalizePayment(
    reference: string,
    maxRetries = 3
  ): Promise<boolean> {
    // For retry logic
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount <= maxRetries) {
      try {
        // If this is a retry, add a delay with exponential backoff
        if (retryCount > 0) {
          const delayMs = Math.min(1000 * Math.pow(2, retryCount - 1), 8000); // Max 8 second delay
          console.log(
            `Verification retry attempt ${retryCount}/${maxRetries}, waiting ${delayMs}ms before retry...`
          );
          await this.sleep(delayMs);
        }

        console.log('Starting payment verification for reference:', reference);

        // Get the pending payment from the database
        const pendingPayment = await paymentService.getPendingPayment(
          reference
        );

        if (!pendingPayment) {
          console.error('No pending payment found with reference:', reference);
          return false;
        }

        // Create a connection to the Solana network
        // Use confirmed instead of finalized for faster verification
        const connection = new Connection(config.SOLANA_RPC_URL, 'confirmed');

        // Convert reference to PublicKey
        const referencePublicKey = new PublicKey(reference);

        console.log('Searching for transaction with reference:', reference);

        // Find the transaction with the reference
        const signatureInfo = await connection.getSignaturesForAddress(
          referencePublicKey,
          { limit: 10 } // Increase limit to ensure we find the transaction
        );

        if (signatureInfo.length === 0) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.log('No transaction found yet, retrying...');
            continue;
          }
          console.error(
            'No transaction found with reference after retries:',
            reference
          );
          return false;
        }

        // Get the most recent transaction signature
        const signature = signatureInfo[0].signature;
        console.log('Found transaction signature:', signature);

        // Get the transaction details
        const transaction = await connection.getTransaction(signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });

        // SIMPLIFIED VERIFICATION:
        // 1. Check if we got transaction details
        // 2. Check if transaction was successful (no errors)
        // If both conditions are met, consider the payment verified

        if (!transaction) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.log('Transaction details not available yet, retrying...');
            continue;
          }
          console.error('Could not get transaction details after retries');
          return false;
        }

        // Check if the transaction has an error
        if (transaction.meta?.err) {
          console.error('Transaction failed:', transaction.meta.err);
          return false;
        }

        console.log('Transaction was successful, finalizing payment');

        // Payment is verified, update user's token balance
        await userTokenService.updateUserBalance(
          pendingPayment.username,
          pendingPayment.token_amount
        );

        // Delete the pending payment
        await paymentService.deletePendingPayment(reference);

        console.log('Payment verified and finalized successfully!');
        return true;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(
          `Verification error (attempt ${retryCount + 1}/${maxRetries + 1}):`,
          lastError
        );

        if (retryCount < maxRetries) {
          retryCount++;
          continue;
        }

        console.error('Error verifying payment after maximum retries:', error);
        return false;
      }
    }

    console.error(
      'Verification failed after maximum retries. Last error:',
      lastError
    );
    return false;
  },

  // Helper function to wait/sleep
  async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  // Recover tokens from a transaction that was successful but failed verification
  async recoverPayment(
    username: string,
    reference: string,
    maxRetries = 3
  ): Promise<boolean> {
    // For retry logic
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount <= maxRetries) {
      try {
        // If this is a retry, add a delay with exponential backoff
        if (retryCount > 0) {
          const delayMs = Math.min(1000 * Math.pow(2, retryCount - 1), 8000); // Max 8 second delay
          console.log(
            `Recovery retry attempt ${retryCount}/${maxRetries}, waiting ${delayMs}ms before retry...`
          );
          await this.sleep(delayMs);
        }

        console.log('Starting payment recovery for reference:', reference);

        // Get the pending payment from the database
        const pendingPayment = await paymentService.getPendingPayment(
          reference
        );

        if (!pendingPayment) {
          console.error('No pending payment found with reference:', reference);
          return false;
        }

        // Verify username matches to prevent unauthorized recovery
        if (pendingPayment.username !== username) {
          console.error('Username does not match pending payment');
          return false;
        }

        // Create a connection to the Solana network
        const connection = new Connection(
          config.SOLANA_RPC_URL,
          'confirmed' // Using confirmed for faster results
        );

        // Convert reference to PublicKey
        const referencePublicKey = new PublicKey(reference);

        console.log('Searching for transaction with reference:', reference);

        // Find the transaction with the reference
        const signatureInfo = await connection.getSignaturesForAddress(
          referencePublicKey
        );

        if (signatureInfo.length === 0) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.log('No transaction found yet, retrying...');
            continue;
          }
          console.error(
            'No transaction found with reference after retries:',
            reference
          );
          return false;
        }

        // Get the most recent transaction
        const signature = signatureInfo[0].signature;
        console.log('Found transaction signature:', signature);

        // Get the transaction details
        const transaction = await connection.getTransaction(signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });

        // Check if we have a valid transaction
        if (!transaction) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.log('Transaction details not available yet, retrying...');
            continue;
          }
          console.error('Could not get transaction details after retries');
          return false;
        }

        // Check if the transaction was successful
        if (transaction.meta?.err) {
          console.error('Transaction failed:', transaction.meta.err);
          return false;
        }

        console.log('Transaction was successful, recovering payment');

        // Update user's token balance
        await userTokenService.updateUserBalance(
          pendingPayment.username,
          pendingPayment.token_amount
        );

        // Delete the pending payment
        await paymentService.deletePendingPayment(reference);

        console.log('Payment recovered successfully!');
        return true;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(
          `Recovery error (attempt ${retryCount + 1}/${maxRetries + 1}):`,
          lastError
        );

        if (retryCount < maxRetries) {
          retryCount++;
          continue;
        }

        console.error('Error recovering payment after retries:', error);
        return false;
      }
    }

    console.error(
      'Recovery failed after maximum retries. Last error:',
      lastError
    );
    return false;
  },

  // Check if payment has been confirmed
  async checkPaymentStatus(reference: string): Promise<boolean> {
    try {
      // Get the payment from the database to check if it's already verified
      const payment = await paymentService.getPaymentByReference(reference);

      // If payment exists and is verified, return true
      if (payment && payment.verified_at) {
        return true;
      }

      // Otherwise, payment exists but not verified yet
      return false;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  },
};
