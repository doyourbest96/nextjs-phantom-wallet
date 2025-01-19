import { Idl } from "@project-serum/anchor";

export const IDL: Idl = {
  version: "0.1.0",
  name: "solana_victor_transfer",
  instructions: [
    {
      name: "transferSplTokens",
      accounts: [
        {
          name: "from",
          isMut: false,
          isSigner: true,
        },
        {
          name: "fromAta",
          isMut: true,
          isSigner: false,
        },
        {
          name: "toAta",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
  ],
};
