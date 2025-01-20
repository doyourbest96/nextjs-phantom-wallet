import { create } from "zustand";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getAccount,
} from "@solana/spl-token";
import IDLJson from "../idl/token_transfer.json";

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
  "4qH7mhLjuhMCKzYCXPLq4RFkzbvETghuh7oFAQjgTM4h"
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

      const { decimals } = useWalletStore.getState();

      const provider = new anchor.AnchorProvider(connection, solana, {
        commitment: "confirmed",
      });
      anchor.setProvider(provider);

      const program = new anchor.Program(
        IDLJson as anchor.Idl,
        PROGRAM_ID,
        provider
      );
      const recipientKey = new PublicKey(recipientAddress);

      // Get ATAs
      const sourceTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        solana.publicKey,
        true,
        TOKEN_2022_PROGRAM_ID
      );

      const destinationTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        recipientKey,
        true,
        TOKEN_2022_PROGRAM_ID
      );

      let transaction = new anchor.web3.Transaction();

      // Get the latest blockhash
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("finalized");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = solana.publicKey;

      // Check if destination ATA exists
      const destinationAccount = await connection.getAccountInfo(
        destinationTokenAccount
      );
      if (!destinationAccount) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            solana.publicKey,
            destinationTokenAccount,
            recipientKey,
            TOKEN_MINT
          )
        );
      }

      // Add transfer instruction
      const transferIx = await program.methods
        .transferToken2022(new anchor.BN(amount * Math.pow(10, decimals)))
        .accounts({
          from: solana.publicKey,
          fromAta: sourceTokenAccount,
          toAta: destinationTokenAccount,
          mint: TOKEN_MINT,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .instruction();

      transaction.add(transferIx);

      // Add retry logic with timeout
      const tx = await provider.sendAndConfirm(transaction, [], {
        maxRetries: 5,
        skipPreflight: false,
      });

      return tx;
    } catch (error: any) {
      console.error("Transaction details:", error);
      if (error?.logs) {
        console.error("Transaction logs:", error.logs());
      }
      throw error;
    }
  },
}));
