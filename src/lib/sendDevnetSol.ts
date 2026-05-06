import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { toUint8Array } from "js-base64";
import { getDevnetConnection } from "./devnetConnection";
import { MWA_APP_IDENTITY } from "./mwaAppIdentity";

export { LAMPORTS_PER_SOL };

/**
 * Sign and send a devnet SOL transfer via Mobile Wallet Adapter, then confirm.
 * Caller must supply a valid MWA auth token (or undefined for full authorize UI).
 */
export async function sendDevnetSolTransfer(params: {
  toAddressBase58: string;
  lamports: number;
  authToken: string | null;
}): Promise<string> {
  const { toAddressBase58, lamports, authToken } = params;
  if (!Number.isFinite(lamports) || lamports < 1) {
    throw new Error("INVALID_LAMPORTS");
  }

  const toPubkey = new PublicKey(toAddressBase58.trim());

  return transact(async (wallet) => {
    const authorizationResult = await wallet.authorize({
      identity: MWA_APP_IDENTITY,
      chain: "devnet",
      auth_token: authToken ?? undefined,
    });
    const first = authorizationResult.accounts[0];
    if (!first?.address) {
      throw new Error("NO_AUTHORIZED_ACCOUNT");
    }
    const fromPubkey = new PublicKey(toUint8Array(first.address));

    const connection = getDevnetConnection();
    const latestBlockhash = await connection.getLatestBlockhash("confirmed");

    const ix = SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports,
    });

    const messageV0 = new TransactionMessage({
      payerKey: fromPubkey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: [ix],
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);
    const signatures = await wallet.signAndSendTransactions({
      transactions: [tx],
    });
    const signature = signatures[0];
    if (!signature) {
      throw new Error("NO_SIGNATURE");
    }

    const confirmation = await connection.confirmTransaction(
      {
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      "confirmed"
    );
    if (confirmation.value.err) {
      throw new Error(`CONFIRM_FAILED:${JSON.stringify(confirmation.value.err)}`);
    }

    return signature;
  });
}
