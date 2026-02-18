/**
 * Clinical photography grid overlay — React Native SVG port.
 * Ported from src/components/Mirror/ClinicalGridOverlay.tsx (web).
 *
 * Features:
 * - Rule of thirds grid
 * - Vertical midline
 * - Frankfort plane reference line
 * - Center crosshair
 * - Corner framing brackets
 */
import React from "react";
import Svg, { Line, Path, Text as SvgText } from "react-native-svg";

interface ClinicalGridProps {
  width: number;
  height: number;
  visible?: boolean;
}

export function ClinicalGrid({
  width,
  height,
  visible = true,
}: ClinicalGridProps) {
  if (!visible || width === 0 || height === 0) return null;

  const w = width;
  const h = height;
  const thirdX1 = w / 3;
  const thirdX2 = (w * 2) / 3;
  const thirdY1 = h / 3;
  const thirdY2 = (h * 2) / 3;
  const cx = w / 2;
  const cy = h / 2;

  // Frankfort plane sits roughly at 38% height (ear-to-eye level)
  const frankfortY = h * 0.38;

  return (
    <Svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: "absolute", top: 0, left: 0 }}
      pointerEvents="none"
    >
      {/* Rule of thirds — vertical */}
      <Line
        x1={thirdX1} y1={0} x2={thirdX1} y2={h}
        stroke="white" strokeOpacity={0.25} strokeWidth={0.5}
      />
      <Line
        x1={thirdX2} y1={0} x2={thirdX2} y2={h}
        stroke="white" strokeOpacity={0.25} strokeWidth={0.5}
      />

      {/* Rule of thirds — horizontal */}
      <Line
        x1={0} y1={thirdY1} x2={w} y2={thirdY1}
        stroke="white" strokeOpacity={0.25} strokeWidth={0.5}
      />
      <Line
        x1={0} y1={thirdY2} x2={w} y2={thirdY2}
        stroke="white" strokeOpacity={0.25} strokeWidth={0.5}
      />

      {/* Vertical midline */}
      <Line
        x1={cx} y1={0} x2={cx} y2={h}
        stroke="#FF6FAE" strokeOpacity={0.4} strokeWidth={1}
        strokeDasharray="8 6"
      />

      {/* Frankfort plane */}
      <Line
        x1={0} y1={frankfortY} x2={w} y2={frankfortY}
        stroke="#4FC3F7" strokeOpacity={0.5} strokeWidth={1}
        strokeDasharray="6 4"
      />
      <SvgText
        x={8} y={frankfortY - 6}
        fill="#4FC3F7" fillOpacity={0.6}
        fontSize="9" fontWeight="500"
      >
        Frankfort Plane
      </SvgText>

      {/* Center crosshair */}
      <Line
        x1={cx - 12} y1={cy} x2={cx + 12} y2={cy}
        stroke="white" strokeOpacity={0.5} strokeWidth={1}
      />
      <Line
        x1={cx} y1={cy - 12} x2={cx} y2={cy + 12}
        stroke="white" strokeOpacity={0.5} strokeWidth={1}
      />

      {/* Corner brackets */}
      <Path
        d={`M ${w * 0.08} ${h * 0.06} L ${w * 0.08} ${h * 0.03} L ${w * 0.15} ${h * 0.03}`}
        fill="none" stroke="white" strokeOpacity={0.35} strokeWidth={1.5}
      />
      <Path
        d={`M ${w * 0.92} ${h * 0.06} L ${w * 0.92} ${h * 0.03} L ${w * 0.85} ${h * 0.03}`}
        fill="none" stroke="white" strokeOpacity={0.35} strokeWidth={1.5}
      />
      <Path
        d={`M ${w * 0.08} ${h * 0.94} L ${w * 0.08} ${h * 0.97} L ${w * 0.15} ${h * 0.97}`}
        fill="none" stroke="white" strokeOpacity={0.35} strokeWidth={1.5}
      />
      <Path
        d={`M ${w * 0.92} ${h * 0.94} L ${w * 0.92} ${h * 0.97} L ${w * 0.85} ${h * 0.97}`}
        fill="none" stroke="white" strokeOpacity={0.35} strokeWidth={1.5}
      />
    </Svg>
  );
}
