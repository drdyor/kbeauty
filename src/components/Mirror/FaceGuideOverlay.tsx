import { motion } from "motion/react";

interface FaceGuideOverlayProps {
  faceDetected: boolean;
  containerWidth: number;
  containerHeight: number;
}

export function FaceGuideOverlay({ faceDetected, containerWidth, containerHeight }: FaceGuideOverlayProps) {
  // Fixed centered oval sized to typical face proportions
  const cx = containerWidth / 2;
  const cy = containerHeight * 0.38;
  const rx = containerWidth * 0.28;
  const ry = rx * 1.35; // Face is ~1.35x taller than wide

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={`0 0 ${containerWidth} ${containerHeight}`}
    >
      <defs>
        <linearGradient id="guideGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6FAE" />
          <stop offset="100%" stopColor="#E9D5FF" />
        </linearGradient>
      </defs>

      {/* Guide oval - fades out when face detected */}
      <motion.ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill="none"
        stroke="url(#guideGradient)"
        strokeWidth={1.5}
        animate={{ opacity: faceDetected ? 0 : 0.6 }}
        transition={{ duration: 0.5 }}
      />

      {/* Pulsing ring when no face */}
      {!faceDetected && (
        <motion.ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="none"
          stroke="url(#guideGradient)"
          strokeWidth={1}
          animate={{
            rx: [rx, rx + 6, rx],
            ry: [ry, ry + 8, ry],
            opacity: [0.2, 0, 0.2],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Prompt text when no face */}
      <motion.text
        x={cx}
        y={cy + ry + 30}
        textAnchor="middle"
        fill="white"
        fontSize="14"
        fontWeight="500"
        animate={{ opacity: faceDetected ? 0 : [0.4, 0.7, 0.4] }}
        transition={faceDetected ? { duration: 0.3 } : { duration: 2, repeat: Infinity }}
      >
        Position your face here
      </motion.text>
    </svg>
  );
}
