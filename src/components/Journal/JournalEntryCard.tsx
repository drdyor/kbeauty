import { motion } from "motion/react";
import { format } from "date-fns";
import type { SkinJournalEntry } from "../../types";
import { MOOD_EMOJI, CONCERN_LABELS } from "../../types";

interface JournalEntryCardProps {
  entry: SkinJournalEntry;
  onClick: () => void;
  index?: number;
}

export function JournalEntryCard({ entry, onClick, index = 0 }: JournalEntryCardProps) {
  const date = new Date(entry.timestamp);

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="w-full bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 overflow-hidden text-left"
    >
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
          <img
            src={entry.photo}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-800">
              {format(date, "MMM d, yyyy")}
            </span>
            {entry.mood && (
              <span className="text-base">{MOOD_EMOJI[entry.mood]}</span>
            )}
          </div>

          {/* Concerns */}
          {entry.concerns.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {entry.concerns.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-[#FFF5F7] text-[10px] font-medium text-[#FF6FAE] rounded-full"
                >
                  {CONCERN_LABELS[tag]}
                </span>
              ))}
              {entry.concerns.length > 3 && (
                <span className="text-[10px] text-gray-400">
                  +{entry.concerns.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Notes preview */}
          {entry.notes && (
            <p className="text-xs text-gray-500 line-clamp-1">{entry.notes}</p>
          )}
        </div>

        {/* Time */}
        <span className="text-[10px] text-gray-400 flex-shrink-0">
          {format(date, "h:mm a")}
        </span>
      </div>
    </motion.button>
  );
}
