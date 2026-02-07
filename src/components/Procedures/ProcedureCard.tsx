import { motion } from "motion/react";
import { Calendar, Star, MessageSquare } from "lucide-react";
import type { ProgressEntry, Procedure, PROCEDURE_ICONS } from "../../types/procedures";

interface ProcedureCardProps {
  entry: ProgressEntry;
  procedure: Procedure;
  onClick?: () => void;
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

export function ProcedureCard({ entry, procedure, onClick }: ProcedureCardProps) {
  const entryDate = new Date(entry.timestamp);
  const formattedDate = entryDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100 overflow-hidden shadow-md cursor-pointer"
    >
      {/* Photo */}
      <div className="relative aspect-square">
        <img
          src={entry.photoProtected}
          alt="Progress"
          className="w-full h-full object-cover"
        />

        {/* Verified badge */}
        {entry.verified && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <span>✓</span>
            <span>Verified</span>
          </div>
        )}

        {/* Day counter */}
        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-sm px-2 py-1 rounded-lg">
          Day {entry.daysSinceProcedure}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <span>{ICONS[procedure.type] || '🏥'}</span>
          <span className="font-medium text-gray-800 truncate">
            {procedure.customType || procedure.type.replace("-", " ")}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{formattedDate}</span>
        </div>

        {/* Rating */}
        {entry.rating && (
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= entry.rating! ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                }`}
              />
            ))}
          </div>
        )}

        {/* Notes preview */}
        {entry.notes && (
          <div className="flex items-start gap-1 mt-2 text-sm text-gray-600">
            <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="line-clamp-2">{entry.notes}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
