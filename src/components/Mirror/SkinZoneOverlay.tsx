import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { SkinZone } from "../../types";
import type * as faceapi from "face-api.js";

interface SkinZoneOverlayProps {
  visible: boolean;
  landmarks: faceapi.FaceLandmarks68 | null;
  containerWidth: number;
  containerHeight: number;
  videoWidth: number;
  videoHeight: number;
  onZoneTap?: (zone: SkinZone) => void;
}

const ZONE_COLORS: Record<SkinZone, string> = {
  forehead: "rgba(255, 111, 174, 0.2)",
  "left-cheek": "rgba(168, 85, 247, 0.2)",
  "right-cheek": "rgba(168, 85, 247, 0.2)",
  nose: "rgba(233, 213, 255, 0.3)",
  chin: "rgba(255, 89, 148, 0.2)",
};

const ZONE_LABELS: Record<SkinZone, string> = {
  forehead: "Forehead",
  "left-cheek": "L. Cheek",
  "right-cheek": "R. Cheek",
  nose: "Nose",
  chin: "Chin",
};

export function SkinZoneOverlay({
  visible,
  landmarks,
  containerWidth,
  containerHeight,
  videoWidth,
  videoHeight,
  onZoneTap,
}: SkinZoneOverlayProps) {
  const [activeZone, setActiveZone] = useState<SkinZone | null>(null);

  if (!visible || !landmarks) return null;

  // Scale factors from video coordinates to container coordinates
  const scaleX = containerWidth / videoWidth;
  const scaleY = containerHeight / videoHeight;

  const nose = landmarks.getNose();
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const jaw = landmarks.getJawOutline();
  const mouth = landmarks.getMouth();

  const noseCenter = {
    x: nose.reduce((s, p) => s + p.x, 0) / nose.length * scaleX,
    y: nose.reduce((s, p) => s + p.y, 0) / nose.length * scaleY,
  };
  const leftEyeCenter = {
    x: leftEye.reduce((s, p) => s + p.x, 0) / leftEye.length * scaleX,
    y: leftEye.reduce((s, p) => s + p.y, 0) / leftEye.length * scaleY,
  };
  const rightEyeCenter = {
    x: rightEye.reduce((s, p) => s + p.x, 0) / rightEye.length * scaleX,
    y: rightEye.reduce((s, p) => s + p.y, 0) / rightEye.length * scaleY,
  };
  const mouthCenter = {
    x: mouth.reduce((s, p) => s + p.x, 0) / mouth.length * scaleX,
    y: mouth.reduce((s, p) => s + p.y, 0) / mouth.length * scaleY,
  };

  const eyeSpan = Math.abs(rightEyeCenter.x - leftEyeCenter.x);
  const jawTop = jaw[0].y * scaleY;
  const jawBottom = jaw[8].y * scaleY;
  const faceHeight = jawBottom - jawTop;

  type ZoneConfig = { zone: SkinZone; cx: number; cy: number; rx: number; ry: number };

  const zones: ZoneConfig[] = [
    {
      zone: "forehead",
      cx: (leftEyeCenter.x + rightEyeCenter.x) / 2,
      cy: leftEyeCenter.y - faceHeight * 0.22,
      rx: eyeSpan * 0.55,
      ry: faceHeight * 0.12,
    },
    {
      zone: "left-cheek",
      cx: leftEyeCenter.x - eyeSpan * 0.1,
      cy: noseCenter.y + faceHeight * 0.05,
      rx: eyeSpan * 0.28,
      ry: faceHeight * 0.12,
    },
    {
      zone: "right-cheek",
      cx: rightEyeCenter.x + eyeSpan * 0.1,
      cy: noseCenter.y + faceHeight * 0.05,
      rx: eyeSpan * 0.28,
      ry: faceHeight * 0.12,
    },
    {
      zone: "nose",
      cx: noseCenter.x,
      cy: noseCenter.y,
      rx: eyeSpan * 0.15,
      ry: faceHeight * 0.1,
    },
    {
      zone: "chin",
      cx: mouthCenter.x,
      cy: mouthCenter.y + faceHeight * 0.12,
      rx: eyeSpan * 0.3,
      ry: faceHeight * 0.08,
    },
  ];

  const handleTap = (zone: SkinZone) => {
    setActiveZone(prev => prev === zone ? null : zone);
    onZoneTap?.(zone);
  };

  return (
    <AnimatePresence>
      <motion.svg
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${containerWidth} ${containerHeight}`}
      >
        {zones.map(({ zone, cx, cy, rx, ry }) => (
          <g key={zone} onClick={() => handleTap(zone)} style={{ cursor: "pointer" }}>
            <motion.ellipse
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill={ZONE_COLORS[zone]}
              stroke={activeZone === zone ? "#FF6FAE" : "rgba(255,255,255,0.3)"}
              strokeWidth={activeZone === zone ? 2 : 1}
              animate={{ scale: activeZone === zone ? 1.05 : 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
            {activeZone === zone && (
              <motion.text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="11"
                fontWeight="600"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {ZONE_LABELS[zone]}
              </motion.text>
            )}
          </g>
        ))}
      </motion.svg>
    </AnimatePresence>
  );
}
