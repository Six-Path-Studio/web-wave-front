
import React from 'react';

interface PaymentMethodProps {
  name: string;
  icon: string;
  isPopular?: boolean;
  onClick: () => void;
  isSelected?: boolean;
}

const PaymentMethod: React.FC<PaymentMethodProps> = ({
  name,
  icon,
  isPopular = false,
  onClick,
  isSelected = false
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer p-4 rounded-lg transition-all
        ${isSelected ? 'bg-sixpath-green-dark border-2 border-sixpath-gold' : 'bg-sixpath-dark-light border border-sixpath-green'}`}
    >
      {isPopular && (
        <div className="absolute -top-2 left-0 right-0 flex justify-center">
          <span className="bg-sixpath-gold text-sixpath-dark px-2 py-0.5 text-xs rounded-full uppercase font-bold">
            Popular
          </span>
        </div>
      )}
      
      <div className="flex flex-col items-center">
        <div className="text-white text-3xl mb-2">{icon}</div>
        <div className="text-white font-medium">{name}</div>
      </div>
    </div>
  );
};

export default PaymentMethod;
