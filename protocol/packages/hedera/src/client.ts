/**
 * Hedera client initialization for Glow Protocol
 *
 * Wraps and extends src/services/hederaService.ts from the existing kbeauty codebase.
 * Key changes: env-based config, no localStorage, supports both testnet and mainnet.
 */

import {
  Client,
  TopicCreateTransaction,
  AccountId,
  PrivateKey,
} from "@hashgraph/sdk";

export interface GlowHederaConfig {
  operatorId: string;
  operatorKey: string;
  network: "testnet" | "mainnet";
  topicId?: string;
}

let client: Client | null = null;
let currentConfig: GlowHederaConfig | null = null;
let currentTopicId: string | null = null;

/**
 * Initialize the Hedera client.
 * In production, config comes from environment variables.
 * In React Native, config comes from secure storage.
 */
export function initClient(config: GlowHederaConfig): Client {
  if (config.network === "testnet") {
    client = Client.forTestnet();
  } else {
    client = Client.forMainnet();
  }

  // Auto-detect key type (ported from hederaService.ts)
  let privateKey: PrivateKey;
  if (config.operatorKey.startsWith("0x")) {
    privateKey = PrivateKey.fromStringECDSA(config.operatorKey.slice(2));
  } else if (config.operatorKey.startsWith("3030")) {
    privateKey = PrivateKey.fromStringDer(config.operatorKey);
  } else {
    try {
      privateKey = PrivateKey.fromStringDer(config.operatorKey);
    } catch {
      privateKey = PrivateKey.fromStringED25519(config.operatorKey);
    }
  }

  client.setOperator(
    AccountId.fromString(config.operatorId),
    privateKey
  );

  currentConfig = config;

  if (config.topicId) {
    currentTopicId = config.topicId;
  }

  return client;
}

/**
 * Get the current Hedera client. Throws if not initialized.
 */
export function getClient(): Client {
  if (!client) {
    throw new Error("Hedera client not initialized. Call initClient() first.");
  }
  return client;
}

/**
 * Get the current network (testnet/mainnet)
 */
export function getNetwork(): "testnet" | "mainnet" {
  return currentConfig?.network ?? "testnet";
}

/**
 * Get the Mirror Node base URL for the current network
 */
export function getMirrorNodeUrl(): string {
  const network = getNetwork();
  return network === "mainnet"
    ? "https://mainnet.mirrornode.hedera.com"
    : "https://testnet.mirrornode.hedera.com";
}

/**
 * Create a new HCS topic for a clinic (one-time setup per clinic)
 */
export async function createTopic(memo?: string): Promise<string> {
  const c = getClient();

  const tx = new TopicCreateTransaction();
  if (memo) tx.setTopicMemo(memo);

  const response = await tx.execute(c);
  const receipt = await response.getReceipt(c);

  if (!receipt.topicId) {
    throw new Error("Failed to create topic - no topic ID in receipt");
  }

  currentTopicId = receipt.topicId.toString();
  return currentTopicId;
}

/**
 * Get the current topic ID
 */
export function getTopicId(): string | null {
  return currentTopicId;
}

/**
 * Set topic ID (for reusing existing clinic topics)
 */
export function setTopicId(topicId: string): void {
  currentTopicId = topicId;
}

/**
 * Check if the Hedera client is ready for notarization
 */
export function isReady(): boolean {
  return client !== null && currentTopicId !== null;
}
