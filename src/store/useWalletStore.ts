import { create } from 'zustand';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface WalletState {
  connected: boolean;
  publicKey: string | null;
  balance: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  getBalance: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  connected: false,
  publicKey: null,
  balance: 0,
  
  connect: async () => {
    try {
      const { solana } = window as any;

      if (!solana?.isPhantom) {
        alert('Please install Phantom wallet!');
        return;
      }

      const response = await solana.connect();
      const publicKey = response.publicKey.toString();
      
      set({ connected: true, publicKey });
      
      // Get initial balance
      const connection = new Connection('https://api.mainnet-beta.solana.com');
      const balance = await connection.getBalance(new PublicKey(publicKey));
      set({ balance: balance / LAMPORTS_PER_SOL });
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  },

  disconnect: () => {
    const { solana } = window as any;
    if (solana) {
      solana.disconnect();
      set({ connected: false, publicKey: null, balance: 0 });
    }
  },

  getBalance: async () => {
    try {
      const { solana } = window as any;
      if (!solana?.isPhantom || !solana.publicKey) return;

      const connection = new Connection('https://api.mainnet-beta.solana.com');
      const balance = await connection.getBalance(solana.publicKey);
      set({ balance: balance / LAMPORTS_PER_SOL });
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  },
}));