import { clusterApiUrl, Connection } from "@solana/web3.js";

let connection: Connection | null = null;

export function getDevnetConnection(): Connection {
  if (!connection) {
    connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  }
  return connection;
}
