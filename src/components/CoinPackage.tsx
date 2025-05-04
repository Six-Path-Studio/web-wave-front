
import React from 'react';

interface CoinPackageProps {
  price: string;
  amount: number;
  isPopular?: boolean;
  onClick: () => void;
  isSelected?: boolean;
}

const CoinPackage: React.FC<CoinPackageProps> = ({ 
  price, 
  amount, 
  isPopular = false,
  onClick,
  isSelected = false
}) => {
  return (
    <div 
      onClick={onClick}
      className={`relative w-full flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-all
        ${isSelected ? 'bg-sixpath-green-dark border-2 border-sixpath-gold' : 'bg-sixpath-dark-light border border-sixpath-green'}`}
    >
      {isPopular && (
        <div className="absolute -top-2 left-0 right-0 flex justify-center">
          <span className="bg-sixpath-gold text-sixpath-dark px-2 py-0.5 text-xs rounded-full uppercase font-bold">
            Popular
          </span>
        </div>
      )}
      
      <div className="w-16 h-16 rounded-full flex items-center justify-center bg-sixpath-gold mb-2">
        <span className="text-sixpath-dark font-bold text-sm">GVT</span>
      </div>
      
      <div className="text-white font-bold text-xl">{amount}</div>
      <div className="text-sixpath-green font-bold">{price}</div>
    </div>
  );
};

export default CoinPackage;
