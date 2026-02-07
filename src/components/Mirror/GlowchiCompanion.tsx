import { useMemo } from "react";
import { motion } from "motion/react";

interface GlowchiCompanionProps {
  journalCount: number;
  lastCheckDate?: string;
  visible: boolean;
}

export function GlowchiCompanion({ journalCount, lastCheckDate, visible }: GlowchiCompanionProps) {
  const { streak, label } = useMemo(() => {
    if (journalCount === 0) {
      return { streak: 0, label: "First check!" };
    }
    if (!lastCheckDate) {
      return { streak: journalCount, label: `${journalCount} checks` };
    }
    const daysSince = Math.floor(
      (Date.now() - new Date(lastCheckDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince <= 1) {
      return { streak: journalCount, label: `${journalCount} day streak` };
    }
    if (daysSince > 3) {
      return { streak: 0, label: "Welcome back" };
    }
    return { streak: journalCount, label: `${journalCount} checks` };
  }, [journalCount, lastCheckDate]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.3 }}
      className="flex items-center gap-1.5 px-2.5 py-1 bg-black/30 backdrop-blur-md rounded-full"
    >
      {/* Tiny cat face */}
      <span className="text-sm leading-none">🐱</span>
      {/* Streak / status */}
      <span className="text-[11px] text-white/90 font-medium leading-none">
        {label}
      </span>
      {streak > 0 && (
        <span className="text-[10px] leading-none">✨</span>
      )}
    </motion.div>
  );
}
