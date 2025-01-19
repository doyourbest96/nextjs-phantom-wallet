"use client";

import { useEffect, useState } from "react";
import { useWalletStore } from "../store/useWalletStore";
import {
  Wallet,
  Coins,
  Send,
  LogOut,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function Home() {
  const {
    connected,
    publicKey,
    balance,
    decimals,
    connect,
    disconnect,
    getBalance,
    transferTokens,
  } = useWalletStore();

  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [transferStatus, setTransferStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [transferError, setTransferError] = useState("");

  useEffect(() => {
    const { solana } = window as any;
    if (solana?.isPhantom) {
      if (solana.isConnected) {
        connect();
      }
    }
  }, []);

  useEffect(() => {
    if (connected) {
      getBalance();
      const interval = setInterval(getBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [connected, getBalance]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferStatus("loading");
    setTransferError("");

    try {
      const tx = await transferTokens(recipientAddress, Number(amount));
      setTransferStatus("success");
      setRecipientAddress("");
      setAmount("");
      console.log("Transfer successful:", tx);
    } catch (error) {
      setTransferStatus("error");
      setTransferError((error as Error).message);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-center mb-6 flex items-center justify-center">
            <Wallet className="w-6 h-6 mr-2" />
            Token Transfer
          </h1>
          {!connected ? (
            <button
              onClick={connect}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 flex items-center justify-center"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Connect Phantom Wallet
            </button>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                <label className="text-sm text-gray-600 flex items-center">
                  <Wallet className="w-4 h-4 mr-2" />
                  Wallet Address
                </label>
                <p className="text-sm font-mono break-all">{publicKey}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                <label className="text-sm text-gray-600 flex items-center">
                  <Coins className="w-4 h-4 mr-2" />
                  Token Balance
                </label>
                <p className="text-2xl font-bold">
                  {(balance / Math.pow(10, decimals)).toLocaleString()}
                </p>
              </div>

              <form onSubmit={handleTransfer} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="recipient"
                    className="text-sm font-medium text-gray-700 flex items-center"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Recipient Address
                  </label>
                  <input
                    id="recipient"
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="amount"
                    className="text-sm font-medium text-gray-700 flex items-center"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Amount (Tokens)
                  </label>
                  <input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="0"
                    step="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {transferStatus !== "idle" && (
                  <div
                    className={`p-4 rounded-md ${
                      transferStatus === "loading"
                        ? "bg-yellow-50 border border-yellow-200"
                        : transferStatus === "success"
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {transferStatus === "loading" && (
                        <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
                      )}
                      {transferStatus === "success" && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {transferStatus === "error" && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span
                        className={`font-medium ${
                          transferStatus === "loading"
                            ? "text-yellow-800"
                            : transferStatus === "success"
                            ? "text-green-800"
                            : "text-red-800"
                        }`}
                      >
                        {transferStatus === "loading" && "Transferring..."}
                        {transferStatus === "success" && "Transfer Successful"}
                        {transferStatus === "error" && "Transfer Failed"}
                      </span>
                    </div>
                    {transferStatus === "error" && (
                      <p className="mt-2 text-sm text-red-600">
                        {transferError}
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={transferStatus === "loading"}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Send className="w-5 h-5 mr-2" />
                  {transferStatus === "loading"
                    ? "Transferring..."
                    : "Transfer Tokens"}
                </button>
              </form>
            </div>
          )}
        </div>
        {connected && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={disconnect}
              className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 flex items-center justify-center"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Disconnect
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
