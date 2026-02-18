import {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
  AccountId,
  PrivateKey,
} from "@hashgraph/sdk";

export interface HederaConfig {
  operatorId: string;
  operatorKey: string;
  network: "testnet" | "mainnet";
  topicId?: string; // Reuse existing topic
}

export interface NotarizationMessage {
  procedureId: string;
  photoHash: string; // SHA-256 of unfiltered original
  timestamp: string; // ISO string
  captureMethod: "in-app" | "upload-test";
  deviceInfo?: string;
}

export interface NotarizationResult {
  transactionId: string;
  consensusTimestamp: string;
  topicId: string;
  topicSequenceNumber: number;
}

export interface MirrorNodeMessage {
  consensus_timestamp: string;
  topic_id: string;
  sequence_number: number;
  message: string; // base64-encoded JSON
}

let client: Client | null = null;
let currentTopicId: string | null = null;

/**
 * Initialize the Hedera client with operator credentials
 */
export function initHedera(config: HederaConfig): Client {
  if (config.network === "testnet") {
    client = Client.forTestnet();
  } else {
    client = Client.forMainnet();
  }

  // Auto-detect key type: DER keys start with "30", hex ECDSA keys start with "0x"
  let privateKey: PrivateKey;
  if (config.operatorKey.startsWith("0x")) {
    privateKey = PrivateKey.fromStringECDSA(config.operatorKey.slice(2));
  } else if (config.operatorKey.startsWith("3030")) {
    privateKey = PrivateKey.fromStringDer(config.operatorKey);
  } else {
    // Try DER first, fall back to ED25519
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

  if (config.topicId) {
    currentTopicId = config.topicId;
  }

  return client;
}

/**
 * Create a new HCS topic for photo notarization (one-time setup)
 */
export async function createTopic(memo?: string): Promise<string> {
  if (!client) throw new Error("Hedera client not initialized. Call initHedera() first.");

  const tx = new TopicCreateTransaction();
  if (memo) tx.setTopicMemo(memo);

  const response = await tx.execute(client);
  const receipt = await response.getReceipt(client);

  if (!receipt.topicId) {
    throw new Error("Failed to create topic - no topic ID in receipt");
  }

  currentTopicId = receipt.topicId.toString();
  return currentTopicId;
}

/**
 * Submit a photo hash to HCS for immutable timestamped notarization
 * Cost: ~$0.0001 per message
 */
export async function notarizePhoto(
  message: NotarizationMessage
): Promise<NotarizationResult> {
  if (!client) throw new Error("Hedera client not initialized. Call initHedera() first.");
  if (!currentTopicId) throw new Error("No topic ID set. Call createTopic() or pass topicId in config.");

  const payload = JSON.stringify({
    v: 1, // schema version
    pid: message.procedureId,
    hash: message.photoHash,
    ts: message.timestamp,
    method: message.captureMethod,
    device: message.deviceInfo,
  });

  const tx = new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(currentTopicId))
    .setMessage(payload);

  const response = await tx.execute(client);
  const receipt = await response.getReceipt(client);

  return {
    transactionId: response.transactionId.toString(),
    consensusTimestamp: receipt.topicSequenceNumber
      ? new Date().toISOString() // Will be replaced by mirror node query for exact time
      : new Date().toISOString(),
    topicId: currentTopicId,
    topicSequenceNumber: receipt.topicSequenceNumber?.toNumber() ?? 0,
  };
}

/**
 * Verify a photo hash against the Hedera Mirror Node
 * This is a read-only operation (free, no transaction cost)
 */
export async function verifyOnChain(
  topicId: string,
  sequenceNumber: number,
  expectedHash: string
): Promise<{ verified: boolean; onChainHash: string | null; consensusTimestamp: string | null }> {
  // TODO: Track network from initHedera config. For now, default to testnet.
  const baseUrl = "https://testnet.mirrornode.hedera.com";

  const url = `${baseUrl}/api/v1/topics/${topicId}/messages/${sequenceNumber}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { verified: false, onChainHash: null, consensusTimestamp: null };
    }

    const data: MirrorNodeMessage = await response.json();
    const decoded = JSON.parse(atob(data.message));

    return {
      verified: decoded.hash === expectedHash,
      onChainHash: decoded.hash,
      consensusTimestamp: data.consensus_timestamp,
    };
  } catch (err) {
    console.error("Mirror node verification failed:", err);
    return { verified: false, onChainHash: null, consensusTimestamp: null };
  }
}

/**
 * Get the current topic ID
 */
export function getTopicId(): string | null {
  return currentTopicId;
}

/**
 * Set topic ID without creating a new one (for reusing existing topics)
 */
export function setTopicId(topicId: string): void {
  currentTopicId = topicId;
}

/**
 * Check if the Hedera client is initialized and ready
 */
export function isHederaReady(): boolean {
  return client !== null && currentTopicId !== null;
}
