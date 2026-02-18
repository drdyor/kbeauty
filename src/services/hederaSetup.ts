import { initHedera, createTopic, getTopicId, setTopicId } from "./hederaService";
import { saveToStorage, loadFromStorage } from "../utils/storage";

const HEDERA_TOPIC_KEY = "hedera_topic_id";

/**
 * Initialize Hedera with credentials and ensure a topic exists.
 * Call this once on app startup (e.g., in App.tsx or a context provider).
 *
 * Usage:
 *   import { setupHedera } from './services/hederaSetup';
 *   await setupHedera('0.0.XXXXX', '302e020100...', 'testnet');
 */
export async function setupHedera(
  operatorId: string,
  operatorKey: string,
  network: "testnet" | "mainnet" = "testnet"
): Promise<string> {
  // Initialize client
  initHedera({ operatorId, operatorKey, network });

  // Check for existing topic in localStorage
  const savedTopicId = loadFromStorage(HEDERA_TOPIC_KEY);
  if (savedTopicId) {
    setTopicId(savedTopicId);
    console.log("[Hedera] Reusing existing topic:", savedTopicId);
    return savedTopicId;
  }

  // Create new topic
  const topicId = await createTopic("Glow Protocol - Certified Photo Hashes");
  saveToStorage(HEDERA_TOPIC_KEY, topicId);
  console.log("[Hedera] Created new topic:", topicId);
  return topicId;
}

/**
 * Check if Hedera credentials are configured via environment variables.
 * Returns the config if available, null if not.
 */
export function getHederaEnvConfig(): { operatorId: string; operatorKey: string } | null {
  const operatorId = import.meta.env.VITE_HEDERA_OPERATOR_ID;
  const operatorKey = import.meta.env.VITE_HEDERA_OPERATOR_KEY;

  if (operatorId && operatorKey) {
    return { operatorId, operatorKey };
  }
  return null;
}

/**
 * Auto-setup Hedera from environment variables if available.
 * Safe to call - does nothing if env vars aren't set.
 */
export async function autoSetupHedera(): Promise<void> {
  const config = getHederaEnvConfig();
  if (!config) {
    console.log("[Hedera] No credentials in env vars (VITE_HEDERA_OPERATOR_ID / VITE_HEDERA_OPERATOR_KEY). Blockchain notarization disabled.");
    return;
  }

  try {
    await setupHedera(config.operatorId, config.operatorKey, "testnet");
  } catch (err) {
    console.warn("[Hedera] Auto-setup failed:", err);
  }
}
