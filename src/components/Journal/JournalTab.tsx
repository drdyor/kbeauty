import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, List, ArrowLeftRight, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { CalendarGrid } from "./CalendarGrid";
import { JournalEntryCard } from "./JournalEntryCard";
import { CompareView } from "../Compare/CompareView";
import type { SkinJournalEntry } from "../../types";
import type { Procedure, ProgressEntry } from "../../types/procedures";
import { MOOD_EMOJI, CONCERN_LABELS } from "../../types";

type JournalView = "calendar" | "timeline" | "entry-detail" | "compare";
type FilterMode = "all" | "journal" | "procedures";

interface JournalTabProps {
  journalEntries: SkinJournalEntry[];
  progressEntries: ProgressEntry[];
  procedures: Procedure[];
  getAllPhotos: () => Array<{ id: string; photo: string; date: string; source: "journal" | "procedure" }>;
}

export function JournalTab({ journalEntries, progressEntries, procedures, getAllPhotos }: JournalTabProps) {
  const [journalView, setJournalView] = useState<JournalView>("calendar");
  const [selectedEntry, setSelectedEntry] = useState<SkinJournalEntry | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");

  const sortedEntries = [...journalEntries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const handleEntryTap = (entry: SkinJournalEntry) => {
    setSelectedEntry(entry);
    setJournalView("entry-detail");
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-10">
      <div className="max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {/* ===== MAIN VIEWS (Calendar / Timeline) ===== */}
          {(journalView === "calendar" || journalView === "timeline") && (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Journal</h1>
                  <p className="text-sm text-gray-500">
                    {journalEntries.length} skin checks
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setJournalView("calendar")}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                      journalView === "calendar"
                        ? "bg-[#FF6FAE] text-white"
                        : "bg-white/80 text-gray-400 border border-pink-100"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setJournalView("timeline")}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                      journalView === "timeline"
                        ? "bg-[#FF6FAE] text-white"
                        : "bg-white/80 text-gray-400 border border-pink-100"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setJournalView("compare")}
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-white/80 text-gray-400 border border-pink-100"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Calendar View */}
              {journalView === "calendar" && (
                <CalendarGrid
                  entries={journalEntries}
                  procedureEntries={progressEntries}
                  onDateSelect={() => {}}
                  onEntryTap={handleEntryTap}
                />
              )}

              {/* Timeline View */}
              {journalView === "timeline" && (
                <div className="space-y-3">
                  {sortedEntries.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-5xl mb-3">📷</div>
                      <p className="text-gray-500 font-medium">No entries yet</p>
                      <p className="text-sm text-gray-400 mt-1">Use the Mirror tab to capture your first skin check</p>
                    </div>
                  ) : (
                    sortedEntries.map((entry, i) => (
                      <JournalEntryCard
                        key={entry.id}
                        entry={entry}
                        onClick={() => handleEntryTap(entry)}
                        index={i}
                      />
                    ))
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ===== ENTRY DETAIL ===== */}
          {journalView === "entry-detail" && selectedEntry && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Back */}
              <button
                onClick={() => { setSelectedEntry(null); setJournalView("calendar"); }}
                className="flex items-center gap-2 mb-4 text-gray-600 font-medium"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>

              {/* Photo */}
              <div className="rounded-2xl overflow-hidden shadow-lg mb-4">
                <img
                  src={selectedEntry.photo}
                  alt="Skin check"
                  className="w-full aspect-[4/3] object-cover"
                />
              </div>

              {/* Date & Mood */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-4 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {format(new Date(selectedEntry.timestamp), "MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(selectedEntry.timestamp), "h:mm a")}
                    </p>
                  </div>
                  {selectedEntry.mood && (
                    <div className="text-3xl">{MOOD_EMOJI[selectedEntry.mood]}</div>
                  )}
                </div>
              </div>

              {/* Concerns */}
              {selectedEntry.concerns.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-4 mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Concerns</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEntry.concerns.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gradient-to-r from-[#FF6FAE] to-[#FF5994] text-white text-xs font-medium rounded-full"
                      >
                        {CONCERN_LABELS[tag]}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedEntry.notes && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-4 mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                  <p className="text-sm text-gray-600">{selectedEntry.notes}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ===== COMPARE ===== */}
          {journalView === "compare" && (
            <motion.div
              key="compare"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CompareView
                allPhotos={getAllPhotos()}
                onClose={() => setJournalView("calendar")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
