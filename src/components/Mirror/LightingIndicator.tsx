import { motion } from "motion/react";
import { Sun, SunDim, CloudSun } from "lucide-react";

interface LightingIndicatorProps {
  score: number; // 0-100
}

export function LightingIndicator({ score }: LightingIndicatorProps) {
  const getConfig = () => {
    if (score < 25) return { icon: SunDim, label: "Low light", color: "text-amber-400", bg: "bg-amber-500/10" };
    if (score < 70) return { icon: Sun, label: "Good", color: "text-green-400", bg: "bg-green-500/10" };
    return { icon: CloudSun, label: "Bright", color: "text-amber-400", bg: "bg-amber-500/10" };
  };

  const { icon: Icon, label, color, bg } = getConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${bg} backdrop-blur-md`}
    >
      <Icon className={`w-4 h-4 ${color}`} />
      <span className={`text-xs font-medium ${color}`}>{label}</span>
    </motion.div>
  );
}
