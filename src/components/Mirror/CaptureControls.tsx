import { motion } from "motion/react";
import { Camera, RotateCcw } from "lucide-react";

interface CaptureControlsProps {
  mode: 'quick-check' | 'procedure';
  onModeChange: (mode: 'quick-check' | 'procedure') => void;
  onCapture: () => void;
  onSwitchCamera: () => void;
}

export function CaptureControls({ mode, onModeChange, onCapture, onSwitchCamera }: CaptureControlsProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 pb-20 pt-6 bg-gradient-to-t from-black/40 to-transparent">
      {/* Mode toggle */}
      <div className="flex justify-center mb-5">
        <div className="flex bg-black/30 backdrop-blur-md rounded-full p-1">
          <button
            onClick={() => onModeChange('quick-check')}
            className={`relative px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              mode === 'quick-check' ? 'text-white' : 'text-white/60'
            }`}
          >
            {mode === 'quick-check' && (
              <motion.div
                layoutId="mode-pill"
                className="absolute inset-0 bg-gradient-to-r from-[#FF6FAE] to-[#FF5994] rounded-full"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">Quick Check</span>
          </button>
          <button
            onClick={() => onModeChange('procedure')}
            className={`relative px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              mode === 'procedure' ? 'text-white' : 'text-white/60'
            }`}
          >
            {mode === 'procedure' && (
              <motion.div
                layoutId="mode-pill"
                className="absolute inset-0 bg-gradient-to-r from-[#FF6FAE] to-[#FF5994] rounded-full"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">Procedure</span>
          </button>
        </div>
      </div>

      {/* Capture row */}
      <div className="flex items-center justify-center gap-12">
        {/* Spacer for symmetry */}
        <div className="w-11" />

        {/* Capture button */}
        <motion.button
          onClick={onCapture}
          whileTap={{ scale: 0.9 }}
          className="relative w-[72px] h-[72px] rounded-full"
        >
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-[3px] border-white/80" />
          {/* Inner fill */}
          <div className="absolute inset-[5px] rounded-full bg-gradient-to-br from-[#FF6FAE] to-[#FF5994] shadow-lg" />
          {/* Icon */}
          <Camera className="absolute inset-0 m-auto w-7 h-7 text-white" />
        </motion.button>

        {/* Flip camera */}
        <button
          onClick={onSwitchCamera}
          className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center"
        >
          <RotateCcw className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}
