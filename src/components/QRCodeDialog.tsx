import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { solanaService } from '@/services/solana.service';

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentUrl: string;
  amount: number;
  username: string;
  reference: string;
  onSuccess: () => void;
}

const QRCodeDialog: React.FC<QRCodeDialogProps> = ({
  open,
  onOpenChange,
  paymentUrl,
  amount,
  username,
  reference,
  onSuccess,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationInterval, setVerificationInterval] =
    useState<NodeJS.Timeout | null>(null);

  // Copy payment URL to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentUrl);
    toast({
      title: 'URL Copied',
      description: 'Payment URL copied to clipboard',
      variant: 'default',
    });
  };

  // Start polling for payment verification when QR code is displayed
  useEffect(() => {
    if (open && reference) {
      // Start polling for verification every 3 seconds
      const interval = setInterval(async () => {
        try {
          const isVerified = await solanaService.checkPaymentStatus(reference);
          if (isVerified) {
            clearInterval(interval);
            toast({
              title: 'Payment Successful!',
              description: 'Your payment has been confirmed',
              variant: 'success',
            });
            onSuccess();
            onOpenChange(false);
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      }, 3000);

      setVerificationInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [open, reference, onSuccess, onOpenChange]);

  // Stop polling when dialog closes
  useEffect(() => {
    if (!open && verificationInterval) {
      clearInterval(verificationInterval);
    }
  }, [open, verificationInterval]);

  // Verify payment manually
  const verifyPayment = async () => {
    setIsVerifying(true);
    try {
      const isVerified = await solanaService.verifyAndFinalizePayment(
        reference,
        3
      );

      if (isVerified) {
        toast({
          title: 'Payment Verified!',
          description: 'Your tokens have been credited to your account',
          variant: 'success',
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: 'Verification Failed',
          description:
            'Payment not found or not confirmed yet. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Verification Error',
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='bg-sixpath-dark border-sixpath-green text-white max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-sixpath-gold'>
            Scan QR Code to Pay
          </DialogTitle>
          <DialogDescription className='text-sixpath-green'>
            Scan this code with your Solana Pay compatible wallet to pay{' '}
            {amount} SOL
          </DialogDescription>
        </DialogHeader>

        <div className='flex justify-center p-4 bg-white rounded-lg'>
          <QRCodeSVG value={paymentUrl} size={256} />
        </div>

        <div className='text-center text-sm text-sixpath-green'>
          Open your mobile wallet app to scan this QR code
        </div>

        <DialogFooter className='flex flex-col sm:flex-row gap-2'>
          <Button
            className='sixpath-button w-full sm:w-auto'
            onClick={copyToClipboard}
          >
            Copy URL
          </Button>
          <Button
            className='sixpath-button w-full sm:w-auto'
            onClick={verifyPayment}
            disabled={isVerifying}
          >
            {isVerifying ? 'Verifying...' : 'Verify Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeDialog;
