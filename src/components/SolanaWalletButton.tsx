
import React from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { config } from '../config/env';

const SolanaWalletButton: React.FC = () => {
  const { publicKey, wallet, disconnect, select, wallets, connecting } = useWallet();
  const { connection } = useConnection();
  
  // Determine if we're using devnet based on RPC URL
  const isDevnet = config.SOLANA_RPC_URL.includes('devnet');
  
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
    <div className="flex flex-col items-center">
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
      {isDevnet && (
        <span className="mt-1 text-xs text-sixpath-gold bg-sixpath-dark px-2 py-0.5 rounded">Devnet</span>
      )}
    </div>
  );
};

export default SolanaWalletButton;
