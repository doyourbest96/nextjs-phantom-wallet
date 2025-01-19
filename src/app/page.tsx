'use client';

import { useEffect } from 'react';
import { useWalletStore } from '../store/useWalletStore';

export default function Home() {
  const { connected, publicKey, balance, connect, disconnect, getBalance } = useWalletStore();

  useEffect(() => {
    // Check if Phantom is installed
    const { solana } = window as any;
    if (solana?.isPhantom) {
      // Check if already connected
      if (solana.isConnected) {
        connect();
      }
    }
  }, []);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (connected) {
      const interval = setInterval(getBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [connected]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Phantom Wallet Integration</h1>
        
        {!connected ? (
          <button
            onClick={connect}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Connect Phantom Wallet
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Wallet Address:</p>
              <p className="text-sm font-mono break-all">{publicKey}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Balance:</p>
              <p className="text-xl font-bold">{balance.toFixed(4)} SOL</p>
            </div>

            <button
              onClick={disconnect}
              className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </main>
  );
}