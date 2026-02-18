export {
  initClient,
  getClient,
  getNetwork,
  getMirrorNodeUrl,
  createTopic,
  getTopicId,
  setTopicId,
  isReady,
} from "./client";
export type { GlowHederaConfig } from "./client";

export { notarizePhoto } from "./notarize";
export type { NotarizationPayload } from "./notarize";

export { verifyOnChain, buildVerificationResult } from "./verify";
