import { create } from "zustand";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAccount,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { IDL } from "../idl/token_transfer";

interface WalletState {
  connected: boolean;
  publicKey: string | null;
  balance: number;
  decimals: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  getBalance: () => Promise<void>;
  transferTokens: (
    recipientAddress: string,
    amount: number
  ) => Promise<string | undefined>;
}

const PROGRAM_ID = new PublicKey(
  "9gDDoVVqkiZh14mwAwtXZfoXcLLDHytZU5AvdYnDYt8f"
);
const TOKEN_MINT = "JJHbUZgRxPzUuM7uEP52WQ5cjroTnX5GM65ijuNp4Ko";

const connection = new Connection(clusterApiUrl("devnet"));

export const useWalletStore = create<WalletState>((set) => ({
  connected: false,
  publicKey: null,
  balance: 0,
  decimals: 0,

  connect: async () => {
    try {
      const { solana } = window as any;

      if (!solana?.isPhantom) {
        alert("Please install Phantom wallet!");
        return;
      }

      const response = await solana.connect();
      const publicKey = response.publicKey.toString();

      // Get token mint info to fetch decimals
      const mintInfo = await connection.getParsedAccountInfo(
        new PublicKey(TOKEN_MINT)
      );
      const decimals = (mintInfo.value?.data as any).parsed.info.decimals;

      set({ connected: true, publicKey, decimals });

      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        response.publicKey,
        { mint: new PublicKey(TOKEN_MINT) }
      );

      if (tokenAccounts.value.length > 0) {
        const balance =
          tokenAccounts.value[0].account.data.parsed.info.tokenAmount.amount;
        set({ balance: Number(balance) });
      } else {
        set({ balance: 0 });
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
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
      if (!solana?.isPhantom || !solana.isConnected) return;

      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        solana.publicKey,
        { mint: new PublicKey(TOKEN_MINT) }
      );

      if (tokenAccounts.value.length > 0) {
        const balance =
          tokenAccounts.value[0].account.data.parsed.info.tokenAmount.amount;
        set({ balance: Number(balance) });
      } else {
        set({ balance: 0 });
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      set({ balance: 0 });
    }
  },

  transferTokens: async (recipientAddress: string, amount: number) => {
    try {
      const { solana } = window as any;
      if (!solana?.isPhantom) return;

      // Initialize Anchor program
      const provider = new anchor.AnchorProvider(connection, solana, {
        commitment: "confirmed",
      });
      anchor.setProvider(provider);

      const program = new anchor.Program(
        IDL,
        PROGRAM_ID,
        provider
      );

      // Get token accounts
      const sourceTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(TOKEN_MINT),
        solana.publicKey
      );

      const destinationTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(TOKEN_MINT),
        new PublicKey(recipientAddress)
      );

      // Call your program's transfer instruction
      const tx = await program.methods
        .transferSplTokens(new anchor.BN(amount))
        .accounts({
          from: solana.publicKey,
          fromAta: sourceTokenAccount,
          toAta: destinationTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error("Error transferring tokens:", error);
      throw error;
    }
  },
}));
