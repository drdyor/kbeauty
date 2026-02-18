import { useState, useRef } from "react";
import { motion } from "motion/react";
import { ShieldCheck, Upload, Search, CheckCircle2, XCircle, Loader2, Link, Hash, Copy } from "lucide-react";
import { generateImageHash } from "../../utils/verification";
import { verifyOnChain } from "../../services/hederaService";

type VerifyMode = "photo" | "hash";
type VerifyStatus = "idle" | "hashing" | "checking" | "verified" | "mismatch" | "error";

export function VerifyPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<VerifyMode>("photo");
  const [status, setStatus] = useState<VerifyStatus>("idle");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [inputHash, setInputHash] = useState("");
  const [topicId, setTopicId] = useState("");
  const [sequenceNumber, setSequenceNumber] = useState("");
  const [onChainHash, setOnChainHash] = useState<string | null>(null);
  const [consensusTimestamp, setConsensusTimestamp] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("hashing");
    setErrorMsg(null);
    setOnChainHash(null);
    setConsensusTimestamp(null);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhotoPreview(dataUrl);

      try {
        const hash = await generateImageHash(dataUrl);
        setComputedHash(hash);
        setStatus("idle");
      } catch {
        setErrorMsg("Failed to compute hash");
        setStatus("error");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVerifyOnChain = async () => {
    const hashToVerify = mode === "photo" ? computedHash : inputHash;
    if (!hashToVerify || !topicId || !sequenceNumber) return;

    setStatus("checking");
    setErrorMsg(null);

    try {
      const result = await verifyOnChain(topicId, parseInt(sequenceNumber), hashToVerify);
      setOnChainHash(result.onChainHash);
      setConsensusTimestamp(result.consensusTimestamp);
      setStatus(result.verified ? "verified" : "mismatch");
    } catch {
      setErrorMsg("Failed to query Hedera Mirror Node");
      setStatus("error");
    }
  };

  const copyHash = () => {
    const hash = mode === "photo" ? computedHash : inputHash;
    if (hash) navigator.clipboard.writeText(hash);
  };

  const activeHash = mode === "photo" ? computedHash : inputHash;
  const canVerify = !!activeHash && !!topicId && !!sequenceNumber;

  return (
    <div className="max-w-md mx-auto px-4 pt-14 pb-24">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-[#FF6FAE] bg-clip-text text-transparent">
          Verify Photo
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Check if a photo is an unedited original certified on Hedera
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => { setMode("photo"); setStatus("idle"); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            mode === "photo" ? "bg-white shadow text-gray-900" : "text-gray-500"
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload Photo
        </button>
        <button
          onClick={() => { setMode("hash"); setStatus("idle"); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            mode === "hash" ? "bg-white shadow text-gray-900" : "text-gray-500"
          }`}
        >
          <Hash className="w-4 h-4" />
          Paste Hash
        </button>
      </div>

      {/* Photo upload mode */}
      {mode === "photo" && (
        <div className="space-y-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50/50 flex flex-col items-center justify-center gap-2 hover:bg-pink-50 transition-colors overflow-hidden"
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Uploaded" className="w-full h-full object-cover" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-[#FF6FAE]" />
                <span className="text-sm text-gray-600">Upload a photo to verify</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
          />

          {/* Computed hash */}
          {computedHash && (
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500">SHA-256 Hash</span>
                <button onClick={copyHash} className="text-gray-400 hover:text-gray-600">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs font-mono text-gray-700 break-all">{computedHash}</p>
            </div>
          )}
        </div>
      )}

      {/* Hash input mode */}
      {mode === "hash" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Photo Hash (SHA-256)</label>
            <textarea
              value={inputHash}
              onChange={(e) => setInputHash(e.target.value.trim())}
              placeholder="e.g. a1b2c3d4e5f6..."
              rows={2}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-mono resize-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Hedera lookup fields */}
      <div className="mt-6 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <Link className="w-4 h-4 text-blue-600" />
          Blockchain Record
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Topic ID</label>
            <input
              value={topicId}
              onChange={(e) => setTopicId(e.target.value.trim())}
              placeholder="0.0.XXXXX"
              className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sequence #</label>
            <input
              value={sequenceNumber}
              onChange={(e) => setSequenceNumber(e.target.value.trim())}
              placeholder="1"
              className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Verify button */}
      <button
        onClick={handleVerifyOnChain}
        disabled={!canVerify || status === "checking"}
        className="w-full mt-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg"
      >
        {status === "checking" ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Checking Hedera...</>
        ) : (
          <><Search className="w-5 h-5" /> Verify on Blockchain</>
        )}
      </button>

      {/* Result */}
      {(status === "verified" || status === "mismatch" || status === "error") && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-6 p-4 rounded-2xl border ${
            status === "verified"
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {status === "verified" ? (
              <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
            )}
            <div>
              <h4 className={`font-bold ${status === "verified" ? "text-green-800" : "text-red-800"}`}>
                {status === "verified"
                  ? "Verified Unfiltered Original"
                  : status === "mismatch"
                  ? "Verification Failed"
                  : "Error"}
              </h4>
              <p className={`text-sm mt-1 ${status === "verified" ? "text-green-700" : "text-red-700"}`}>
                {status === "verified"
                  ? "This photo matches the hash recorded on the Hedera blockchain. It has not been edited or filtered since capture."
                  : status === "mismatch"
                  ? "The photo hash does NOT match the blockchain record. This image may have been edited or is not the original."
                  : errorMsg || "Something went wrong."}
              </p>
              {consensusTimestamp && (
                <p className="text-xs text-gray-500 mt-2">
                  Consensus: {consensusTimestamp}
                </p>
              )}
              {onChainHash && (
                <p className="text-xs font-mono text-gray-400 mt-1 break-all">
                  On-chain: {onChainHash}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* How it works */}
      <div className="mt-8 p-4 bg-gray-50 rounded-2xl">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">How Verification Works</h4>
        <ol className="text-xs text-gray-500 space-y-1.5 list-decimal list-inside">
          <li>A SHA-256 hash of the unfiltered photo was computed at capture time</li>
          <li>That hash was submitted to a Hedera Consensus Service topic</li>
          <li>The blockchain provides an immutable, timestamped record</li>
          <li>Re-hashing the photo now and comparing proves it hasn't been edited</li>
        </ol>
      </div>
    </div>
  );
}
