import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { solanaService } from "../services/solana.service";
import { productService } from "../services/supabase.service";
import { toast } from "@/hooks/use-toast";

export function useSolanaPay() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [lastPaymentReference, setLastPaymentReference] = useState<
    string | null
  >(null);

  const initializePayment = async (
    username: string,
    productId: number,
  ): Promise<string> => {
    if (!publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your Solana wallet to continue.",
        variant: "destructive",
      });
      throw new Error("Wallet not connected");
    }

    setIsProcessing(true);
    setPaymentStatus("processing");
    setLastPaymentReference(null);

    try {
      // Get product details
      const product = await productService.getProductById(productId);

      if (!product) {
        throw new Error("Product not found");
      }

      // Create a payment transaction
      const { transaction, reference } = await solanaService
        .createPaymentTransaction(
          username,
          product.id,
          product.token_amount,
          product.price_sol,
          publicKey.toBase58(),
        );

      console.log("Transaction created:", transaction);
      console.log("Reference:", reference);

      // Save the reference for potential recovery
      setLastPaymentReference(reference);

      // Send the transaction
      const signature = await sendTransaction(transaction, connection);
      console.log("Transaction sent, signature:", signature);

      // Wait for confirmation with finalized commitment
      toast({
        title: "Processing Payment",
        description:
          "Please wait while your transaction is being finalized (this may take 15-30 seconds)...",
        variant: "warning", // Using warning variant for processing state
      });

      // Use finalized commitment for maximum reliability
      const confirmation = await connection.confirmTransaction(
        signature,
        "finalized", // Wait for full finalization instead of just confirmation
      );

      if (confirmation.value.err) {
        throw new Error(
          "Transaction failed: " + confirmation.value.err.toString(),
        );
      }

      // Verify payment on backend with retry logic
      toast({
        title: "Verifying Payment",
        description: "Verifying your transaction. This may take a moment...",
        variant: "warning",
      });

      // Call verifyAndFinalizePayment with 3 retries
      const success = await solanaService.verifyAndFinalizePayment(
        reference,
        3,
      );

      if (success) {
        setPaymentStatus("success");
        toast({
          title: "Payment Successful!",
          description:
            `${product.token_amount} tokens have been added to your account.`,
          variant: "success", // Using success variant for successful payments
        });
        return reference;
      } else {
        // Payment verification failed, but transaction might be successful
        throw new Error(
          "Payment verification failed. Your SOL may have been deducted. You can try to recover your payment.",
        );
      }
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus("error");
      toast({
        title: "Payment Failed",
        description: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Recover a failed payment
  const recoverPayment = async (
    username: string,
    reference: string,
  ): Promise<boolean> => {
    if (!reference) {
      toast({
        title: "Recovery Failed",
        description: "No payment reference found to recover.",
        variant: "destructive",
      });
      return false;
    }

    setIsProcessing(true);

    try {
      toast({
        title: "Attempting Recovery",
        description:
          "Checking for your successful transaction. This may take a few moments...",
        variant: "warning",
      });

      // Pass maxRetries=3 to allow multiple attempts with exponential backoff
      const success = await solanaService.recoverPayment(
        username,
        reference,
        3,
      );

      if (success) {
        setPaymentStatus("success");
        toast({
          title: "Recovery Successful!",
          description: "Your tokens have been credited to your account.",
          variant: "success",
        });
        return true;
      } else {
        toast({
          title: "Recovery Failed",
          description:
            "Could not verify your transaction after multiple attempts. Please try again in a few moments.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Recovery error:", error);
      toast({
        title: "Recovery Failed",
        description: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate a payment URL for QR codes if needed
  const generatePaymentUrl = (
    amount: number,
    label?: string,
    message?: string,
  ) => {
    if (!publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to generate a payment URL.",
        variant: "destructive",
      });
      return null;
    }

    // Generate a reference
    const reference = new Uint8Array(16);
    window.crypto.getRandomValues(reference);
    const referencePublicKey = new PublicKey(reference);

    // Generate URL
    return solanaService.generatePaymentUrl(
      amount,
      referencePublicKey,
      label,
      message,
    );
  };

  return {
    initializePayment,
    generatePaymentUrl,
    recoverPayment,
    isProcessing,
    paymentStatus,
    lastPaymentReference,
    resetStatus: () => setPaymentStatus("idle"),
  };
}
