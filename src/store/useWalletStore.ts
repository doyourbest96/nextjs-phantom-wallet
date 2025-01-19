import { create } from "zustand";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getAccount,
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
  "51W7Ur2CJvDqsd8M5EUGKVPxg9LLegs1cuuCtJKwHREx"
);
const TOKEN_MINT = new PublicKey("JJHbUZgRxPzUuM7uEP52WQ5cjroTnX5GM65ijuNp4Ko");

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
      const mintInfo = await connection.getParsedAccountInfo(TOKEN_MINT);
      const decimals = (mintInfo.value?.data as any).parsed.info.decimals;

      set({ connected: true, publicKey, decimals });

      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        response.publicKey,
        { mint: TOKEN_MINT }
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
        { mint: TOKEN_MINT }
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

      const provider = new anchor.AnchorProvider(connection, solana, {
        commitment: "confirmed",
      });
      anchor.setProvider(provider);

      const program = new anchor.Program(IDL, PROGRAM_ID, provider);

      // Create separate transaction for ATA creation
      const ataTransaction = new anchor.web3.Transaction();

      const sourceTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        solana.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const destinationTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        new PublicKey(recipientAddress),
        false,
        TOKEN_2022_PROGRAM_ID
      );

      // Check and create ATA if needed
      try {
        await getAccount(connection, destinationTokenAccount);
      } catch {
        const createAtaIx = createAssociatedTokenAccountInstruction(
          solana.publicKey,
          destinationTokenAccount,
          new PublicKey(recipientAddress),
          TOKEN_MINT,
          TOKEN_2022_PROGRAM_ID
        );
        await provider.sendAndConfirm(ataTransaction.add(createAtaIx));
      }

      // Create separate transaction for token transfer
      const transferTransaction = new anchor.web3.Transaction();
      const transferIx = await program.methods
        .transferSplTokens(new anchor.BN(amount))
        .accounts({
          from: solana.publicKey,
          fromAta: sourceTokenAccount,
          toAta: destinationTokenAccount,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .instruction();

      transferTransaction.add(transferIx);

      const tx = await provider.sendAndConfirm(transferTransaction);
      return tx;
    } catch (error) {
      console.error("Transaction details:", error);
      throw error;
    }
  },
}));
