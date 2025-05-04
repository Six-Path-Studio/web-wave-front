
import React, { useState } from 'react';
import Logo from '../components/Logo';
import CoinPackage from '../components/CoinPackage';
import PaymentMethod from '../components/PaymentMethod';
import { toast } from '@/hooks/use-toast';

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
  
  // Define the coin packages
  const coinPackages = [
    { id: 1, amount: 300, price: 'N2,900' },
    { id: 2, amount: 300, price: 'N2,900', isPopular: true },
    { id: 3, amount: 300, price: 'N2,900' },
    { id: 4, amount: 300, price: 'N2,900' },
    { id: 5, amount: 300, price: 'N2,900' },
    { id: 6, amount: 300, price: 'N2,500' },
    { id: 7, amount: 300, price: 'N2,900' },
    { id: 8, amount: 300, price: 'N2,900' },
    { id: 9, amount: 300, price: 'N2,900' },
    { id: 10, amount: 300, price: 'N2,900' },
    { id: 11, amount: 300, price: 'N2,500' },
    { id: 12, amount: 300, price: 'N2,900' },
    { id: 13, amount: 300, price: 'N2,900' },
    { id: 14, amount: 300, price: 'N2,900' },
    { id: 15, amount: 300, price: 'N2,900' },
  ];
  
  // Define payment methods
  const paymentMethods = [
    { id: 'solana1', name: 'Solana', icon: 'Ṣ', isPopular: true },
    { id: 'solana2', name: 'Solana', icon: 'Ṣ' },
  ];
  
  // Handle next step
  const handleNextStep = () => {
    if (currentStep === 1 && !username) {
      toast({
        title: "Username Required",
        description: "Please enter your username to continue.",
        variant: "destructive"
      });
      return;
    }
    
    if (currentStep === 2 && selectedPackage === null) {
      toast({
        title: "Package Required",
        description: "Please select a coin package to continue.",
        variant: "destructive"
      });
      return;
    }
    
    if (currentStep === 3 && !selectedPayment) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method to continue.",
        variant: "destructive"
      });
      return;
    }
    
    if (currentStep === 4) {
      if (!email) {
        toast({
          title: "Email Required",
          description: "Please enter your email address to continue.",
          variant: "destructive"
        });
        return;
      }
      
      if (!termsAccepted) {
        toast({
          title: "Terms Required",
          description: "Please accept the terms to continue.",
          variant: "destructive"
        });
        return;
      }
      
      // Process payment
      toast({
        title: "Purchase Successful!",
        description: "Your GVT coins have been added to your account.",
      });
      
      // Reset form
      setUsername('');
      setSelectedPackage(null);
      setSelectedPayment(null);
      setEmail('');
      setTermsAccepted(false);
      setCurrentStep(1);
      return;
    }
    
    setCurrentStep((prev) => (prev + 1) as Step);
  };

  return (
    <div className="min-h-screen flex flex-col bg-sixpath-dark text-white p-4">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <Logo />
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center">
        {/* Banner Section */}
        <div className="w-full max-w-4xl mb-8 rounded-lg green-gradient p-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold uppercase mb-4 tracking-wider">
            Welcome to Six Path Studio Store
          </h1>
          <p className="text-lg mb-6">
            Get Exclusive Access To Coins And Upgrades For All<br/>
            Our Mobile Games
          </p>
          
          <div className="flex justify-center">
            <button className="sixpath-button">Shop</button>
          </div>
        </div>
        
        {/* Steps Section */}
        <div className="w-full max-w-3xl">
          {/* Username Section - Step 1 */}
          <div className="mb-12">
            <h2 className="text-center text-3xl font-bold mb-6">L.T AHMED</h2>
            
            <div className="mb-2">
              <span className="text-sixpath-green">1. Enter your Username on L.T Ahmed</span>
            </div>
            
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="sixpath-input w-full"
              disabled={currentStep !== 1}
            />
          </div>
          
          {/* Divider */}
          {currentStep >= 2 && <hr className="border-sixpath-dark-light mb-12" />}
          
          {/* Product Selection - Step 2 */}
          {currentStep >= 2 && (
            <div className="mb-12">
              <div className="mb-4">
                <span className="text-sixpath-green">2. Choose a product</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {coinPackages.map((pkg) => (
                  <CoinPackage
                    key={pkg.id}
                    amount={pkg.amount}
                    price={pkg.price}
                    isPopular={pkg.isPopular}
                    isSelected={selectedPackage === pkg.id}
                    onClick={() => currentStep === 2 && setSelectedPackage(pkg.id)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Divider */}
          {currentStep >= 3 && <hr className="border-sixpath-dark-light mb-12" />}
          
          {/* Payment Method Selection - Step 3 */}
          {currentStep >= 3 && (
            <div className="mb-12">
              <div className="mb-4">
                <span className="text-sixpath-green">3. SELECT A PAYMENT METHOD</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {paymentMethods.map((method) => (
                  <PaymentMethod
                    key={method.id}
                    name={method.name}
                    icon={method.icon}
                    isPopular={method.isPopular}
                    isSelected={selectedPayment === method.id}
                    onClick={() => currentStep === 3 && setSelectedPayment(method.id)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Divider */}
          {currentStep >= 4 && <hr className="border-sixpath-dark-light mb-12" />}
          
          {/* User Details - Step 4 */}
          {currentStep >= 4 && (
            <div className="mb-12">
              <div className="mb-4">
                <span className="text-sixpath-green">4. ENTER YOUR DETAILS</span>
              </div>
              
              <div className="mb-6">
                <p className="text-sm mb-2 text-center">
                  Please enter a valid E-mail address to receive receipt of your payment
                </p>
                <input
                  type="email"
                  placeholder="E-mail address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="sixpath-input w-full"
                />
              </div>
              
              <div className="mb-6">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 mr-2"
                  />
                  <span className="text-xs text-gray-300">
                    By clicking this box, you agree to the terms and conditions by maximum X-2 Payments and abide by Six Path Studio Mobile Store's exclusions, limitations, features, pricing, systems and promotions. Don't buy random items or anything during the transition of information.
                  </span>
                </label>
              </div>
            </div>
          )}
          
          {/* Action Button */}
          <div className="flex justify-center">
            <button 
              onClick={handleNextStep}
              className="sixpath-button"
            >
              {currentStep === 4 ? 'BUY NOW' : 'CONTINUE'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
