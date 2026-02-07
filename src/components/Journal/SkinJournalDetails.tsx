import { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import type { SkinJournalEntry, SkinConcernTag, MoodValue } from "../../types";
import { MOOD_EMOJI, CONCERN_LABELS } from "../../types";

interface SkinJournalDetailsProps {
  capturedImage: string;
  lightingScore?: number;
  onSave: (entry: SkinJournalEntry) => void;
  onBack: () => void;
}

const ALL_CONCERNS: SkinConcernTag[] = [
  'dryness', 'oiliness', 'redness', 'acne', 'texture',
  'dark-spots', 'puffiness', 'fine-lines', 'dullness', 'sensitivity',
];

const ALL_MOODS: MoodValue[] = ['great', 'good', 'okay', 'meh', 'bad'];

export function SkinJournalDetails({ capturedImage, lightingScore, onSave, onBack }: SkinJournalDetailsProps) {
  const [mood, setMood] = useState<MoodValue | undefined>();
  const [concerns, setConcerns] = useState<SkinConcernTag[]>([]);
  const [notes, setNotes] = useState("");

  const toggleConcern = (tag: SkinConcernTag) => {
    setConcerns(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    const now = new Date();
    const entry: SkinJournalEntry = {
      id: `journal_${Date.now()}`,
      photo: capturedImage,
      timestamp: now.toISOString(),
      date: now.toISOString().split("T")[0],
      mood,
      concerns,
      notes: notes || undefined,
      lightingQuality: lightingScore,
      verified: true,
    };
    onSave(entry);
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/80 border border-pink-100 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Skin Check</h2>
          <p className="text-sm text-gray-500">How's your skin today?</p>
        </div>
      </div>

      {/* Photo preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden mb-6 shadow-lg"
      >
        <img
          src={capturedImage}
          alt="Skin check"
          className="w-full aspect-[4/3] object-cover"
        />
      </motion.div>

      {/* Mood */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">How do you feel?</label>
        <div className="flex justify-between">
          {ALL_MOODS.map(m => (
            <button
              key={m}
              onClick={() => setMood(m)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                mood === m
                  ? "bg-gradient-to-br from-[#FFF5F7] to-[#FAE8FF] border-2 border-[#FF6FAE] scale-110"
                  : "border-2 border-transparent"
              }`}
            >
              <span className="text-2xl">{MOOD_EMOJI[m]}</span>
              <span className="text-[10px] font-medium text-gray-500 capitalize">{m}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Skin concerns */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">Skin concerns today</label>
        <div className="flex flex-wrap gap-2">
          {ALL_CONCERNS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleConcern(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                concerns.includes(tag)
                  ? "bg-gradient-to-r from-[#FF6FAE] to-[#FF5994] text-white"
                  : "bg-[#FFF5F7] text-gray-600 border border-pink-100"
              }`}
            >
              {CONCERN_LABELS[tag]}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any observations about your skin today..."
          rows={3}
          className="w-full p-3 bg-[#FFF5F7] rounded-xl border-0 focus:ring-2 focus:ring-[#FF6FAE] resize-none outline-none text-sm"
        />
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF6FAE] to-[#FF5994] text-white font-semibold shadow-lg shadow-pink-200/50 mb-8"
      >
        Save Skin Check
      </button>
    </div>
  );
}
