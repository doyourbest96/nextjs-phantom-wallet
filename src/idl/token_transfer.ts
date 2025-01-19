import { Idl } from "@project-serum/anchor";

export const IDL: Idl = {
  version: "0.1.0",
  name: "solana_victor_transfer",
  instructions: [
    {
      name: "transfer_spl_tokens",
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
  events: [
    {
      name: "TransferEvent",
      fields: [
        {
          name: "from",
          type: "publicKey",
          index: false,
        },
        {
          name: "to",
          type: "publicKey",
          index: false,
        },
        {
          name: "amount",
          type: "u64",
          index: false,
        },
        {
          name: "timestamp",
          type: "i64",
          index: false,
        },
      ],
    },
  ],
  errors: [
    {
      code: 6000,
      name: "InvalidAmount",
      msg: "Amount must be greater than zero",
    },
    {
      code: 6001,
      name: "InsufficientFunds",
      msg: "Insufficient funds for transfer",
    },
    {
      code: 6002,
      name: "InvalidOwner",
      msg: "Invalid token account owner",
    },
    {
      code: 6003,
      name: "TransferFailed",
      msg: "Transfer failed",
    },
    {
      code: 6004,
      name: "SignatureRequired",
      msg: "Signature required",
    },
    {
      code: 6005,
      name: "MintMismatch",
      msg: "Token mints do not match",
    },
  ],
};
