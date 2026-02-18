import { motion } from "motion/react";

interface ClinicalGridOverlayProps {
  visible: boolean;
  containerWidth: number;
  containerHeight: number;
}

/**
 * Clinical photography grid overlay for standardized medical captures.
 * - Center crosshair for alignment
 * - Rule of thirds grid
 * - Frankfort plane (horizontal ear-to-eye line)
 * - Vertical midline
 */
export function ClinicalGridOverlay({
  visible,
  containerWidth,
  containerHeight,
}: ClinicalGridOverlayProps) {
  if (!visible || containerWidth === 0) return null;

  const w = containerWidth;
  const h = containerHeight;
  const thirdX1 = w / 3;
  const thirdX2 = (w * 2) / 3;
  const thirdY1 = h / 3;
  const thirdY2 = (h * 2) / 3;
  const cx = w / 2;
  const cy = h / 2;

  // Frankfort plane sits roughly at 38% height (ear-to-eye level)
  const frankfortY = h * 0.38;

  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 w-full h-full pointer-events-none z-[4]"
      viewBox={`0 0 ${w} ${h}`}
    >
      {/* Rule of thirds - vertical lines */}
      <line x1={thirdX1} y1={0} x2={thirdX1} y2={h} stroke="white" strokeOpacity={0.25} strokeWidth={0.5} />
      <line x1={thirdX2} y1={0} x2={thirdX2} y2={h} stroke="white" strokeOpacity={0.25} strokeWidth={0.5} />

      {/* Rule of thirds - horizontal lines */}
      <line x1={0} y1={thirdY1} x2={w} y2={thirdY1} stroke="white" strokeOpacity={0.25} strokeWidth={0.5} />
      <line x1={0} y1={thirdY2} x2={w} y2={thirdY2} stroke="white" strokeOpacity={0.25} strokeWidth={0.5} />

      {/* Vertical midline */}
      <line x1={cx} y1={0} x2={cx} y2={h} stroke="#FF6FAE" strokeOpacity={0.4} strokeWidth={1} strokeDasharray="8 6" />

      {/* Frankfort plane (horizontal alignment reference) */}
      <line x1={0} y1={frankfortY} x2={w} y2={frankfortY} stroke="#4FC3F7" strokeOpacity={0.5} strokeWidth={1} strokeDasharray="6 4" />
      <text x={8} y={frankfortY - 6} fill="#4FC3F7" fillOpacity={0.6} fontSize="9" fontWeight="500">
        Frankfort Plane
      </text>

      {/* Center crosshair */}
      <line x1={cx - 12} y1={cy} x2={cx + 12} y2={cy} stroke="white" strokeOpacity={0.5} strokeWidth={1} />
      <line x1={cx} y1={cy - 12} x2={cx} y2={cy + 12} stroke="white" strokeOpacity={0.5} strokeWidth={1} />

      {/* Corner brackets (clinical framing) */}
      {/* Top-left */}
      <path d={`M ${w * 0.08} ${h * 0.06} L ${w * 0.08} ${h * 0.03} L ${w * 0.15} ${h * 0.03}`} fill="none" stroke="white" strokeOpacity={0.35} strokeWidth={1.5} />
      {/* Top-right */}
      <path d={`M ${w * 0.92} ${h * 0.06} L ${w * 0.92} ${h * 0.03} L ${w * 0.85} ${h * 0.03}`} fill="none" stroke="white" strokeOpacity={0.35} strokeWidth={1.5} />
      {/* Bottom-left */}
      <path d={`M ${w * 0.08} ${h * 0.94} L ${w * 0.08} ${h * 0.97} L ${w * 0.15} ${h * 0.97}`} fill="none" stroke="white" strokeOpacity={0.35} strokeWidth={1.5} />
      {/* Bottom-right */}
      <path d={`M ${w * 0.92} ${h * 0.94} L ${w * 0.92} ${h * 0.97} L ${w * 0.85} ${h * 0.97}`} fill="none" stroke="white" strokeOpacity={0.35} strokeWidth={1.5} />
    </motion.svg>
  );
}
