
import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const SolanaWalletButton: React.FC = () => {
  const { publicKey, wallet, disconnect, select, wallets, connecting } = useWallet();
  
  const connectWallet = () => {
    if (!wallet) {
      // If no wallet is selected, select the first one
      if (wallets.length > 0) {
        select(wallets[0].adapter.name);
      }
    }
  };
  
  const formatPublicKey = (key: string): string => {
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

  return (
    <button
      onClick={publicKey ? disconnect : connectWallet}
      className="sixpath-button bg-sixpath-gold text-sixpath-dark hover:bg-sixpath-green hover:text-white"
    >
      {connecting ? (
        <span>Connecting...</span>
      ) : publicKey ? (
        <span>Disconnect ({formatPublicKey(publicKey.toBase58())})</span>
      ) : (
        <span>Connect Wallet</span>
      )}
    </button>
  );
};

export default SolanaWalletButton;
