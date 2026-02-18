# Hedera Integration Plan: Unfiltered Photographic Documentation

This plan outlines the steps to integrate the **Hedera Hashgraph** into the Korean Beauty platform to provide immutable, unfiltered documentation for medical/aesthetic procedures.

## 1. Core Concept: The "Trust Chain"
To keep costs low while ensuring maximum trust, we will not store the actual image on the blockchain. Instead, we will store a **cryptographic fingerprint (SHA-256 hash)** of the **unfiltered original photo** using the **Hedera Consensus Service (HCS)**.

| Component | Purpose |
| :--- | :--- |
| **Unfiltered Photo** | Stored locally/privately (Base64 in `photoOriginal`). |
| **SHA-256 Hash** | Generated instantly upon capture; proves the photo hasn't been edited. |
| **Hedera HCS** | Provides a decentralized timestamp and immutable record of the hash. |

---

## 2. Implementation Steps

### Step 1: Environment Setup
1.  **Hedera Account**: Create a Testnet account at [portal.hedera.com](https://portal.hedera.com).
2.  **Dependencies**: Install the Hedera SDK and a lightweight hashing library.
    ```bash
    npm install @hashgraph/sdk crypto-js
    ```
3.  **Environment Variables**: Store the `OPERATOR_ID` and `OPERATOR_KEY` securely.

### Step 2: Cryptographic Hashing Logic
In `src/utils/verification.ts`, implement a function to hash the raw image data immediately after capture.
*   **Action**: Take the raw Base64 string from `GlowMirror`.
*   **Logic**: Generate a SHA-256 hash. This hash is the "digital twin" of the unfiltered photo.

### Step 3: Hedera Consensus Service (HCS) Integration
Create a service to send the hash to a Hedera Topic.
1.  **Create Topic**: A one-time setup to create a unique Topic ID for the app.
2.  **Submit Message**: Every time a procedure is logged, send a JSON message to the topic:
    ```json
    {
      "procedureId": "proc_123",
      "photoHash": "sha256_hash_here",
      "timestamp": "ISO_string",
      "verified": true
    }
    ```
*   **Cost Benefit**: HCS messages cost roughly **$0.0001 USD**, making this the "lowest credit" way to achieve blockchain immutability.

### Step 4: Update ProcedureTracker Flow
Modify the `handleSaveEntry` function in `ProcedureTracker.tsx`:
1.  **Capture**: User takes photo in `GlowMirror`.
2.  **Hash**: System generates hash of the unfiltered `capturedImage`.
3.  **Record**: System sends hash to Hedera.
4.  **Store**: Save the Hedera `TransactionID` and `ConsensusTimestamp` alongside the entry in local storage.

### Step 5: Verification UI
Add a "Verify on Hedera" button to the `ProcedureCard`:
*   When clicked, it re-hashes the local `photoOriginal`.
*   It compares this hash against the one recorded on the Hedera Mirror Node.
*   If they match, display a **"Verified Unfiltered Original"** badge.

---

## 3. Why this is "Low Credit"
*   **No Smart Contracts**: We avoid expensive Solidity contracts.
*   **HCS vs. Tokenization**: Using HCS is significantly cheaper than minting NFTs for every photo.
*   **Local Storage**: By keeping the heavy image data in `localStorage` or a private S3 bucket and only putting the *hash* on-chain, you minimize data costs.

## 4. Security Note
The "unfiltered" nature is guaranteed because the hash is generated **before** any `PrivacyEditor` filters are applied. If anyone tries to swap the unfiltered photo for a filtered one later, the hashes will not match, and the verification will fail.
