import { useState, useRef, useCallback } from "react";
import { format, differenceInDays } from "date-fns";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeDate: string;
  afterDate: string;
}

export function BeforeAfterSlider({ beforeImage, afterImage, beforeDate, afterDate }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const daysBetween = differenceInDays(new Date(afterDate), new Date(beforeDate));

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(2, Math.min(98, (x / rect.width) * 100));
    setSliderPosition(percent);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden select-none bg-gray-100"
      style={{ touchAction: "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Before image (full) */}
      <img
        src={beforeImage}
        alt="Before"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* After image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
      >
        <img
          src={afterImage}
          alt="After"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Slider handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
        style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
      >
        {/* Grip */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-[#FF6FAE]">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-4 rounded-full bg-[#FF6FAE]" />
            <div className="w-0.5 h-4 rounded-full bg-[#FF6FAE]" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full">
        <span className="text-[10px] font-medium text-white">
          Before {format(new Date(beforeDate), "MMM d")}
        </span>
      </div>
      <div className="absolute top-3 right-3 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full">
        <span className="text-[10px] font-medium text-white">
          After {format(new Date(afterDate), "MMM d")}
        </span>
      </div>

      {/* Days badge */}
      {daysBetween > 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#FF6FAE] to-[#FF5994] rounded-full">
          <span className="text-[10px] font-semibold text-white">
            {daysBetween} day{daysBetween !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
