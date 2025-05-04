import React, { useState, useEffect } from 'react';
import Logo from '../components/Logo';
import CoinPackage from '../components/CoinPackage';
import PaymentMethod from '../components/PaymentMethod';
import SolanaWalletButton from '../components/SolanaWalletButton';
import QRCodeDialog from '@/components/QRCodeDialog';
import { toast } from '@/hooks/use-toast';
import { useSolanaPay } from '@/hooks/use-solana-pay';
import { productService, paymentService } from '@/services/supabase.service';
import { solanaService } from '@/services/solana.service';
import { Product } from '@/types/database.types';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

// Define the step type
type Step = 1 | 2 | 3 | 4;

const Index = () => {
  // State
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [username, setUsername] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Get the Solana wallet and connection
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  // Get the Solana payment hook
  const {
    initializePayment,
    isProcessing,
    paymentStatus,
    resetStatus,
    lastPaymentReference,
    recoverPayment,
  } = useSolanaPay();

  // Fetch products from Supabase when component mounts
  useEffect(() => {
    async function fetchProducts() {
      try {
        const fetchedProducts = await productService.getAllProducts();
        setProducts(fetchedProducts);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          title: 'Error Loading Products',
          description: 'Failed to load coin packages. Please try again later.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Handle payment processing
  const handlePayment = async () => {
    if (!username) {
      toast({
        title: 'Username Required',
        description: 'Please enter your username to continue.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedPackage === null) {
      toast({
        title: 'Package Required',
        description: 'Please select a coin package to continue.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Find the selected product
      const product = products.find((p) => p.id === selectedPackage);
      if (!product) {
        throw new Error('Selected product not found');
      }

      // Check wallet balance
      if (publicKey) {
        const balance = await connection.getBalance(publicKey);
        if (balance < product.price_sol * LAMPORTS_PER_SOL) {
          toast({
            title: 'Insufficient Balance',
            description:
              'Your wallet balance is insufficient for this purchase.',
            variant: 'destructive',
          });
          return;
        }
      }

      // Initialize payment
      const success = await initializePayment(username, product.id);

      if (success) {
        // Reset form after successful payment
        setUsername('');
        setSelectedPackage(null);
        setSelectedPayment(null);
        setEmail('');
        setTermsAccepted(false);
        setCurrentStep(1);
        resetStatus();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Error',
        description:
          error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // Handle payment with QR code
  const handleQrCodePayment = async () => {
    if (!username) {
      toast({
        title: 'Username Required',
        description: 'Please enter your username to continue.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedPackage === null) {
      toast({
        title: 'Package Required',
        description: 'Please select a coin package to continue.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Find the selected product
      const product = products.find((p) => p.id === selectedPackage);
      if (!product) {
        throw new Error('Selected product not found');
      }

      // Generate a reference for the payment
      const reference = new Uint8Array(16);
      window.crypto.getRandomValues(reference);
      const referencePublicKey = new PublicKey(reference);
      const referenceString = referencePublicKey.toBase58();

      // Store pending payment in database
      await paymentService.createPendingPayment({
        reference: referenceString,
        username,
        product_id: product.id,
        token_amount: product.token_amount,
        price_sol: product.price_sol,
      });

      // Generate payment URL
      const url = solanaService.generatePaymentUrl(
        product.price_sol,
        referencePublicKey,
        'Six Path Game Store',
        `Purchase ${product.token_amount} tokens`
      );

      // Set payment details for QR code dialog
      setPaymentUrl(url);
      setPaymentReference(referenceString);
      setPaymentAmount(product.price_sol);

      // Open QR code dialog
      setQrDialogOpen(true);
    } catch (error) {
      console.error('QR code payment error:', error);
      toast({
        title: 'Payment Error',
        description:
          error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // Handle payment success from QR code
  const handleQrPaymentSuccess = () => {
    toast({
      title: 'Payment Successful!',
      description: 'Your tokens have been added to your account.',
      variant: 'success',
    });

    // Reset form after successful payment
    setUsername('');
    setSelectedPackage(null);
    setSelectedPayment(null);
    setEmail('');
    setTermsAccepted(false);
    setCurrentStep(1);
    resetStatus();
  };

  // Define payment methods including QR code option
  const paymentMethods = [
    {
      id: 'wallet',
      name: 'Wallet',
      icon: '👛',
      isPopular: true,
      isConnected: !!publicKey,
    },
    {
      id: 'qr-code',
      name: 'QR Code',
      icon: '📱',
      isPopular: false,
    },
  ];

  // Handle next step
  const handleNextStep = () => {
    if (currentStep === 1 && !username) {
      toast({
        title: 'Username Required',
        description: 'Please enter your username to continue.',
        variant: 'destructive',
      });
      return;
    }

    if (currentStep === 2 && selectedPackage === null) {
      toast({
        title: 'Package Required',
        description: 'Please select a coin package to continue.',
        variant: 'destructive',
      });
      return;
    }

    if (currentStep === 3 && !selectedPayment) {
      toast({
        title: 'Payment Method Required',
        description: 'Please select a payment method to continue.',
        variant: 'destructive',
      });
      return;
    }

    if (currentStep === 4) {
      if (!email) {
        toast({
          title: 'Email Required',
          description: 'Please enter your email address to continue.',
          variant: 'destructive',
        });
        return;
      }

      if (!termsAccepted) {
        toast({
          title: 'Terms Required',
          description: 'Please accept the terms to continue.',
          variant: 'destructive',
        });
        return;
      }

      // Process payment based on selected method
      if (selectedPayment === 'wallet') {
        handlePayment();
      } else if (selectedPayment === 'qr-code') {
        handleQrCodePayment();
      }
      return;
    }

    setCurrentStep((prev) => (prev + 1) as Step);
  };

  return (
    <div className='min-h-screen flex flex-col bg-sixpath-dark text-white p-4'>
      {/* Header */}
      <header className='flex justify-between items-center mb-6'>
        <Logo />
        <SolanaWalletButton />
      </header>

      {/* Main Content */}
      <main className='flex-1 flex flex-col items-center'>
        {/* Banner Section */}
        <div className='w-full max-w-4xl mb-8 rounded-lg green-gradient p-8 text-center'>
          <h1 className='text-4xl sm:text-5xl font-bold uppercase mb-4 tracking-wider'>
            Welcome to Six Path Studio Store
          </h1>
          <p className='text-lg mb-6'>
            Get Exclusive Access To Coins And Upgrades For All
            <br />
            Our Mobile Games
          </p>

          <div className='flex justify-center'>
            <button className='sixpath-button'>Shop</button>
          </div>
        </div>

        {/* Steps Section */}
        <div className='w-full max-w-3xl'>
          {/* Username Section - Step 1 */}
          <div className='mb-12'>
            <h2 className='text-center text-3xl font-bold mb-6'>L.T AHMED</h2>

            <div className='mb-2'>
              <span className='text-sixpath-green'>
                1. Enter your Username on L.T Ahmed
              </span>
            </div>

            <input
              type='text'
              placeholder='Username'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className='sixpath-input w-full'
              disabled={currentStep !== 1}
            />
          </div>

          {/* Divider */}
          {currentStep >= 2 && (
            <hr className='border-sixpath-dark-light mb-12' />
          )}

          {/* Product Selection - Step 2 */}
          {currentStep >= 2 && (
            <div className='mb-12'>
              <div className='mb-4'>
                <span className='text-sixpath-green'>2. Choose a product</span>
              </div>

              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3'>
                {isLoading ? (
                  <p className='text-center col-span-full'>
                    Loading products...
                  </p>
                ) : products.length === 0 ? (
                  <p className='text-center col-span-full'>
                    No products available
                  </p>
                ) : (
                  products.map((product) => (
                    <CoinPackage
                      key={product.id}
                      amount={product.token_amount}
                      price={`${product.price_sol} SOL`}
                      isPopular={product.id === 2} // Example: Set the second product as popular
                      isSelected={selectedPackage === product.id}
                      onClick={() =>
                        currentStep === 2 && setSelectedPackage(product.id)
                      }
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Divider */}
          {currentStep >= 3 && (
            <hr className='border-sixpath-dark-light mb-12' />
          )}

          {/* Payment Method Selection - Step 3 */}
          {currentStep >= 3 && (
            <div className='mb-12'>
              <div className='mb-4'>
                <span className='text-sixpath-green'>
                  3. SELECT A PAYMENT METHOD
                </span>
              </div>

              <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                {paymentMethods.map((method) => (
                  <PaymentMethod
                    key={method.id}
                    name={method.name}
                    icon={method.icon}
                    isPopular={method.isPopular}
                    isSelected={selectedPayment === method.id}
                    onClick={() =>
                      currentStep === 3 && setSelectedPayment(method.id)
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {currentStep >= 4 && (
            <hr className='border-sixpath-dark-light mb-12' />
          )}

          {/* User Details - Step 4 */}
          {currentStep >= 4 && (
            <div className='mb-12'>
              <div className='mb-4'>
                <span className='text-sixpath-green'>
                  4. ENTER YOUR DETAILS
                </span>
              </div>

              <div className='mb-6'>
                <p className='text-sm mb-2 text-center'>
                  Please enter a valid E-mail address to receive receipt of your
                  payment
                </p>
                <input
                  type='email'
                  placeholder='E-mail address'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='sixpath-input w-full'
                />
              </div>

              <div className='mb-6'>
                <label className='flex items-start'>
                  <input
                    type='checkbox'
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className='mt-1 mr-2'
                  />
                  <span className='text-xs text-gray-300'>
                    By clicking this box, you agree to the terms and conditions
                    by maximum X-2 Payments and abide by Six Path Studio Mobile
                    Store's exclusions, limitations, features, pricing, systems
                    and promotions. Don't buy random items or anything during
                    the transition of information.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className='flex flex-col items-center'>
            {isProcessing && (
              <div className='mb-4 text-sixpath-gold animate-pulse'>
                Processing payment... Please confirm in your wallet
              </div>
            )}

            {paymentStatus === 'error' && (
              <div className='mb-4 text-red-500'>
                Payment failed. Please try again or choose a different payment
                method.
              </div>
            )}

            <button
              onClick={handleNextStep}
              className={`sixpath-button ${
                isProcessing ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={isProcessing}
            >
              {isProcessing
                ? 'PROCESSING...'
                : currentStep === 4
                ? 'BUY NOW'
                : 'CONTINUE'}
            </button>

            {paymentStatus === 'error' && lastPaymentReference && (
              <button
                onClick={() =>
                  username &&
                  lastPaymentReference &&
                  recoverPayment(username, lastPaymentReference)
                }
                className='sixpath-button mt-4 bg-sixpath-gold text-sixpath-dark'
              >
                TRY TO RECOVER PAYMENT
              </button>
            )}
          </div>
        </div>
      </main>

      {/* QR Code Dialog */}
      <QRCodeDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        paymentUrl={paymentUrl}
        amount={paymentAmount}
        username={username}
        reference={paymentReference}
        onSuccess={handleQrPaymentSuccess}
      />
    </div>
  );
};

export default Index;
