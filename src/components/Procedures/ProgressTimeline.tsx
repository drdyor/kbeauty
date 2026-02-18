import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, ChevronRight, Image as ImageIcon, Plus, FileText, AlertTriangle, ShieldCheck, Link, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { ExportReport } from "./ExportReport";
import { generateImageHash } from "../../utils/verification";
import { verifyOnChain } from "../../services/hederaService";
import type { Procedure, ProgressEntry, ProcedureWithProgress } from "../../types/procedures";

interface ProgressTimelineProps {
  proceduresWithProgress: ProcedureWithProgress[];
  onAddProgress: (procedureId: string) => void;
  onViewEntry: (entry: ProgressEntry) => void;
}

const ICONS: Record<string, string> = {
  'botox': '💉',
  'laser': '✨',
  'chemical-peel': '🧪',
  'microneedling': '📍',
  'filler': '💋',
  'prp': '🩸',
  'hydrafacial': '💧',
  'other': '🏥'
};

export function ProgressTimeline({
  proceduresWithProgress,
  onAddProgress,
  onViewEntry
}: ProgressTimelineProps) {
  const [expandedProcedure, setExpandedProcedure] = useState<string | null>(null);
  const [exportingProcedure, setExportingProcedure] = useState<ProcedureWithProgress | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null); // entry ID being verified
  const [verifyResult, setVerifyResult] = useState<Record<string, "verified" | "mismatch" | "no-chain">>({});

  const handleVerify = async (entry: ProgressEntry) => {
    setVerifying(entry.id);
    try {
      // Re-hash the local original photo
      const currentHash = await generateImageHash(entry.photoOriginal);

      // Check local hash matches stored hash
      const localMatch = entry.verification?.hash === currentHash;

      if (!localMatch) {
        setVerifyResult(prev => ({ ...prev, [entry.id]: "mismatch" }));
        setVerifying(null);
        return;
      }

      // If we have Hedera data, verify on-chain too
      if (entry.verification?.hedera) {
        const { topicId, topicSequenceNumber } = entry.verification.hedera;
        const result = await verifyOnChain(topicId, topicSequenceNumber, currentHash);
        setVerifyResult(prev => ({
          ...prev,
          [entry.id]: result.verified ? "verified" : "mismatch",
        }));
      } else {
        // Local verification passed but no blockchain record
        setVerifyResult(prev => ({ ...prev, [entry.id]: "no-chain" }));
      }
    } catch {
      setVerifyResult(prev => ({ ...prev, [entry.id]: "mismatch" }));
    }
    setVerifying(null);
  };

  if (proceduresWithProgress.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="w-16 h-16 mx-auto text-pink-200 mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Progress Yet</h3>
        <p className="text-gray-500">Add a procedure to start tracking your journey</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-4">
      {proceduresWithProgress.map(({ procedure, entries }) => {
        const isExpanded = expandedProcedure === procedure.id;
        const sortedEntries = [...entries].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        const latestEntry = sortedEntries[0];
        const procedureDate = new Date(procedure.datePerformed);

        return (
          <motion.div
            key={procedure.id}
            layout
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 overflow-hidden shadow-md"
          >
            {/* Procedure Header */}
            <button
              onClick={() => setExpandedProcedure(isExpanded ? null : procedure.id)}
              className="w-full p-4 flex items-center gap-3 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-2xl">
                {ICONS[procedure.type] || '🏥'}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 capitalize">
                  {procedure.customType || procedure.type.replace("-", " ")}
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {procedureDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                  {procedure.provider && ` • ${procedure.provider}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-[#FF6FAE] font-medium">
                  {entries.length} photo{entries.length !== 1 ? "s" : ""}
                </span>
                <ChevronRight
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                />
              </div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">
                    {/* Action Buttons */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => onAddProgress(procedure.id)}
                        className="flex-1 p-3 rounded-xl border-2 border-dashed border-pink-200 text-[#FF6FAE] flex items-center justify-center gap-2 hover:bg-pink-50 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                        Add Photo
                      </button>
                      {entries.length > 0 && (
                        <button
                          onClick={() => setExportingProcedure({ procedure, entries, latestEntry: sortedEntries[0] })}
                          className="p-3 rounded-xl border border-pink-200 text-[#FF6FAE] flex items-center justify-center gap-2 hover:bg-pink-50 transition-colors"
                        >
                          <FileText className="w-5 h-5" />
                          Export
                        </button>
                      )}
                    </div>

                    {/* Timeline */}
                    {sortedEntries.length > 0 ? (
                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-pink-200" />

                        <div className="space-y-4">
                          {sortedEntries.map((entry, index) => {
                            const entryDate = new Date(entry.timestamp);
                            return (
                              <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative flex items-start gap-4"
                              >
                                {/* Timeline dot */}
                                <div className="relative z-10 w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                                  <img
                                    src={entry.photoProtected}
                                    alt="Progress"
                                    className="w-full h-full object-cover"
                                  />
                                </div>

                                {/* Entry details */}
                                <button
                                  onClick={() => onViewEntry(entry)}
                                  className="flex-1 p-3 bg-pink-50 rounded-xl text-left hover:bg-pink-100 transition-colors"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-pink-800">
                                      Day {entry.daysSinceProcedure}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {entryDate.toLocaleDateString()}
                                    </span>
                                  </div>

                                  {entry.notes && (
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                      {entry.notes}
                                    </p>
                                  )}

                                  {entry.rating && (
                                    <div className="flex gap-0.5 mt-1">
                                      {[1, 2, 3, 4, 5].map(star => (
                                        <span
                                          key={star}
                                          className={star <= entry.rating! ? "text-yellow-400" : "text-gray-300"}
                                        >
                                          ★
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {/* Verification badges & verify button */}
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {entry.verified && (
                                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                        <ShieldCheck className="w-3 h-3" />
                                        Verified
                                      </span>
                                    )}
                                    {entry.verification?.hedera && (
                                      <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                                        <Link className="w-3 h-3" />
                                        On-Chain
                                      </span>
                                    )}
                                    {verifyResult[entry.id] === "verified" && (
                                      <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Blockchain Verified
                                      </span>
                                    )}
                                    {verifyResult[entry.id] === "no-chain" && (
                                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Hash Verified (local)
                                      </span>
                                    )}
                                    {verifyResult[entry.id] === "mismatch" && (
                                      <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                                        <XCircle className="w-3 h-3" />
                                        Tampered!
                                      </span>
                                    )}
                                    {entry.verification && !verifyResult[entry.id] && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleVerify(entry); }}
                                        disabled={verifying === entry.id}
                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                      >
                                        {verifying === entry.id ? (
                                          <><Loader2 className="w-3 h-3 animate-spin" /> Verifying...</>
                                        ) : (
                                          <>Verify Integrity</>
                                        )}
                                      </button>
                                    )}
                                  </div>

                                  {entry.complication && entry.complication.severity !== 'none' && (
                                    <span className={`inline-flex items-center gap-1 mt-1 text-xs ${
                                      entry.complication.severity === 'mild' ? 'text-yellow-600' :
                                      entry.complication.severity === 'moderate' ? 'text-orange-600' :
                                      'text-red-600'
                                    }`}>
                                      <AlertTriangle className="w-3 h-3" />
                                      {entry.complication.severity} complication
                                    </span>
                                  )}
                                </button>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-4">
                        No progress photos yet. Add your first one!
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>

    {/* Export Modal */}
    <AnimatePresence>
      {exportingProcedure && (
        <ExportReport
          procedureWithProgress={exportingProcedure}
          onClose={() => setExportingProcedure(null)}
        />
      )}
    </AnimatePresence>
    </>
  );
}
