import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Camera, History, List, Star, AlertTriangle, CheckCircle, ShieldCheck } from "lucide-react";
import { VerifiedCapture } from "./VerifiedCapture";
import { PrivacyEditor } from "./PrivacyEditor";
import { AddProcedure } from "./AddProcedure";
import { ProgressTimeline } from "./ProgressTimeline";
import { saveToStorage, loadFromStorage } from "../../utils/storage";
import { createVerificationData } from "../../utils/verification";
import type {
  Procedure,
  ProgressEntry,
  ProcedureWithProgress,
  PrivacySettings,
  VerificationData,
  ComplicationSeverity
} from "../../types/procedures";

type View = "timeline" | "add-procedure" | "capture" | "privacy" | "add-notes";

interface ProcedureTrackerProps {
  /** Pre-captured image from the mirror - skips internal camera when provided */
  initialImage?: string;
  /** External procedures state (from useAppData). If not provided, uses internal localStorage. */
  externalProcedures?: Procedure[];
  onExternalAddProcedure?: (proc: Procedure) => void;
  externalProgressEntries?: ProgressEntry[];
  onExternalAddEntry?: (entry: ProgressEntry) => void;
  /** Called when user finishes or cancels the procedure flow */
  onDone?: () => void;
}

export function ProcedureTracker({
  initialImage,
  externalProcedures,
  onExternalAddProcedure,
  externalProgressEntries,
  onExternalAddEntry,
  onDone,
}: ProcedureTrackerProps = {}) {
  const useExternal = !!externalProcedures;

  const [view, setView] = useState<View>("timeline");
  const [internalProcedures, setInternalProcedures] = useState<Procedure[]>([]);
  const [internalProgressEntries, setInternalProgressEntries] = useState<ProgressEntry[]>([]);
  const [selectedProcedureId, setSelectedProcedureId] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(initialImage || null);
  const [protectedImage, setProtectedImage] = useState<string | null>(null);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [entryNotes, setEntryNotes] = useState("");
  const [entryRating, setEntryRating] = useState<number>(0);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [complicationSeverity, setComplicationSeverity] = useState<ComplicationSeverity>("none");
  const [complicationNotes, setComplicationNotes] = useState("");
  const [followedAftercare, setFollowedAftercare] = useState(true);

  // Use external state if provided, otherwise internal localStorage
  const procedures = useExternal ? externalProcedures! : internalProcedures;
  const progressEntries = useExternal ? externalProgressEntries || [] : internalProgressEntries;

  // Load data from storage (only when managing own state)
  useEffect(() => {
    if (useExternal) return;
    const savedProcedures = loadFromStorage("procedures");
    const savedEntries = loadFromStorage("progressEntries");
    if (savedProcedures) setInternalProcedures(savedProcedures);
    if (savedEntries) setInternalProgressEntries(savedEntries);
  }, [useExternal]);

  // Generate verification data for pre-captured image
  useEffect(() => {
    if (initialImage && !verificationData) {
      createVerificationData(initialImage, "in-app").then(setVerificationData);
    }
  }, [initialImage]);

  // Save procedures to storage
  const saveProcedures = (procs: Procedure[]) => {
    if (useExternal) {
      // External state - find the new procedure and add it
      const existingIds = new Set(procedures.map(p => p.id));
      const newProc = procs.find(p => !existingIds.has(p.id));
      if (newProc && onExternalAddProcedure) onExternalAddProcedure(newProc);
    } else {
      setInternalProcedures(procs);
      saveToStorage("procedures", procs);
    }
  };

  // Save entries to storage
  const saveEntries = (entries: ProgressEntry[]) => {
    if (useExternal) {
      const existingIds = new Set(progressEntries.map(e => e.id));
      const newEntry = entries.find(e => !existingIds.has(e.id));
      if (newEntry && onExternalAddEntry) onExternalAddEntry(newEntry);
    } else {
      setInternalProgressEntries(entries);
      saveToStorage("progressEntries", entries);
    }
  };

  // Get procedures with their progress entries
  const proceduresWithProgress: ProcedureWithProgress[] = procedures.map(proc => ({
    procedure: proc,
    entries: progressEntries.filter(e => e.procedureId === proc.id),
    latestEntry: progressEntries
      .filter(e => e.procedureId === proc.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
  }));

  // Handler for adding a new procedure
  const handleAddProcedure = (procedure: Procedure) => {
    saveProcedures([...procedures, procedure]);
    setSelectedProcedureId(procedure.id);
    // Skip capture if we already have an image from the mirror
    if (capturedImage) {
      setView("privacy");
    } else {
      setView("capture");
    }
  };

  // Handler for capturing a photo
  const handleCapture = (imageData: string, verification: VerificationData) => {
    setCapturedImage(imageData);
    setVerificationData(verification);
    setView("privacy");
  };

  // Handler for privacy editor completion
  const handlePrivacyComplete = (protectedImg: string, settings: PrivacySettings) => {
    setProtectedImage(protectedImg);
    setPrivacySettings(settings);
    setView("add-notes");
  };

  // Handler for saving the progress entry
  const handleSaveEntry = () => {
    if (!selectedProcedureId || !capturedImage || !protectedImage || !privacySettings) return;

    const procedure = procedures.find(p => p.id === selectedProcedureId);
    if (!procedure) return;

    const procedureDate = new Date(procedure.datePerformed);
    const now = new Date();
    const daysSince = Math.floor(
      (now.getTime() - procedureDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const entry: ProgressEntry = {
      id: `entry_${Date.now()}`,
      procedureId: selectedProcedureId,
      photoOriginal: capturedImage,
      photoProtected: protectedImage,
      privacySettings,
      timestamp: now.toISOString(),
      daysSinceProcedure: daysSince,
      notes: entryNotes || undefined,
      rating: entryRating > 0 ? (entryRating as 1 | 2 | 3 | 4 | 5) : undefined,
      verified: verificationData?.captureMethod === 'in-app',
      verification: verificationData || undefined,
      afterCare: {
        followedInstructions: followedAftercare
      },
      complication: complicationSeverity !== 'none' ? {
        severity: complicationSeverity,
        description: complicationNotes || undefined,
        reportedToProvider: false
      } : undefined
    };

    saveEntries([...progressEntries, entry]);

    // Reset state
    setCapturedImage(null);
    setProtectedImage(null);
    setPrivacySettings(null);
    setSelectedProcedureId(null);
    setVerificationData(null);
    setEntryNotes("");
    setEntryRating(0);
    setComplicationSeverity("none");
    setComplicationNotes("");
    setFollowedAftercare(true);
    if (onDone) {
      onDone();
    } else {
      setView("timeline");
    }
  };

  // Handler for starting a new progress capture
  const handleAddProgress = (procedureId: string) => {
    setSelectedProcedureId(procedureId);
    // Skip capture if we already have an image from the mirror
    if (capturedImage) {
      setView("privacy");
    } else {
      setView("capture");
    }
  };

  // Handler for viewing an entry (could expand to full screen view)
  const handleViewEntry = (entry: ProgressEntry) => {
    // For now, just log - could implement full-screen view
    console.log("View entry:", entry);
  };

  // Cancel and reset
  const handleCancel = () => {
    setCapturedImage(null);
    setProtectedImage(null);
    setPrivacySettings(null);
    setSelectedProcedureId(null);
    setVerificationData(null);
    setEntryNotes("");
    setEntryRating(0);
    setComplicationSeverity("none");
    setComplicationNotes("");
    setFollowedAftercare(true);
    if (onDone) {
      onDone();
    } else {
      setView("timeline");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-rose-500 bg-clip-text text-transparent">
          Procedure Progress
        </h2>
        <p className="text-gray-600">Track your verified results</p>
      </div>

      <AnimatePresence mode="wait">
        {view === "timeline" && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Add Procedure Button */}
            <button
              onClick={() => setView("add-procedure")}
              className="w-full mb-6 p-4 bg-gradient-to-r from-purple-500 to-rose-500 text-white rounded-2xl shadow-lg flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add New Procedure
            </button>

            {/* Timeline */}
            <ProgressTimeline
              proceduresWithProgress={proceduresWithProgress}
              onAddProgress={handleAddProgress}
              onViewEntry={handleViewEntry}
            />
          </motion.div>
        )}

        {view === "add-procedure" && (
          <motion.div
            key="add-procedure"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <AddProcedure
              onAdd={handleAddProcedure}
              onCancel={handleCancel}
            />
          </motion.div>
        )}

        {view === "capture" && (
          <motion.div
            key="capture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <VerifiedCapture
              onCapture={handleCapture}
              onCancel={handleCancel}
            />
          </motion.div>
        )}

        {view === "privacy" && capturedImage && (
          <motion.div
            key="privacy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PrivacyEditor
              imageData={capturedImage}
              onComplete={handlePrivacyComplete}
              onBack={() => setView("capture")}
            />
          </motion.div>
        )}

        {view === "add-notes" && (
          <motion.div
            key="add-notes"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm rounded-3xl border border-purple-100 overflow-hidden shadow-xl"
          >
            {/* Header */}
            <div className="p-4 text-center border-b border-purple-100">
              <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-rose-500 bg-clip-text text-transparent">
                Add Details
              </h3>
              <p className="text-sm text-gray-600">Optional notes and rating</p>
            </div>

            {/* Preview */}
            <div className="p-4 space-y-4">
              {protectedImage && (
                <div className="relative">
                  <img
                    src={protectedImage}
                    alt="Preview"
                    className="w-full aspect-square object-cover rounded-xl"
                  />
                  {/* Verification badge */}
                  {verificationData && (
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                      verificationData.captureMethod === 'in-app'
                        ? 'bg-green-500 text-white'
                        : 'bg-amber-500 text-white'
                    }`}>
                      <ShieldCheck className="w-3 h-3" />
                      {verificationData.captureMethod === 'in-app' ? 'Verified' : 'Test'}
                    </div>
                  )}
                </div>
              )}

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate your results
                </label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setEntryRating(star)}
                      className="p-2"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= entryRating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Aftercare toggle */}
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Followed aftercare instructions?</span>
                </div>
                <button
                  onClick={() => setFollowedAftercare(!followedAftercare)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    followedAftercare ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      followedAftercare ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Complication reporting */}
              <div className="p-3 bg-purple-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Any complications?</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(['none', 'mild', 'moderate', 'severe'] as ComplicationSeverity[]).map(level => (
                    <button
                      key={level}
                      onClick={() => setComplicationSeverity(level)}
                      className={`px-3 py-1 rounded-full text-sm capitalize ${
                        complicationSeverity === level
                          ? level === 'none'
                            ? 'bg-green-500 text-white'
                            : level === 'mild'
                            ? 'bg-yellow-500 text-white'
                            : level === 'moderate'
                            ? 'bg-orange-500 text-white'
                            : 'bg-red-500 text-white'
                          : 'bg-white text-gray-600 border border-gray-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                {complicationSeverity !== 'none' && (
                  <textarea
                    value={complicationNotes}
                    onChange={(e) => setComplicationNotes(e.target.value)}
                    placeholder="Describe the complication..."
                    rows={2}
                    className="w-full mt-2 p-2 bg-white rounded-lg border border-gray-200 text-sm resize-none"
                  />
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={entryNotes}
                  onChange={(e) => setEntryNotes(e.target.value)}
                  placeholder="How does your skin feel? Any changes noticed?"
                  rows={3}
                  className="w-full p-3 bg-purple-50 rounded-xl border-0 focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 flex gap-3 border-t border-purple-100">
              <button
                onClick={() => setView("privacy")}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium"
              >
                Back
              </button>
              <button
                onClick={handleSaveEntry}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-rose-500 text-white font-medium"
              >
                Save Progress
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
