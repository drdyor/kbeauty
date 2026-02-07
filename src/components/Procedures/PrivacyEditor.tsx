import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import * as faceapi from "face-api.js";
import { Check, Loader2, Eye, EyeOff, Sparkles } from "lucide-react";
import type { BlurSettings, PrivacySettings } from "../../types/procedures";

interface PrivacyEditorProps {
  imageData: string;
  onComplete: (protectedImage: string, settings: PrivacySettings) => void;
  onBack: () => void;
}

export function PrivacyEditor({ imageData, onComplete, onBack }: PrivacyEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [landmarks, setLandmarks] = useState<faceapi.FaceLandmarks68 | null>(null);
  const [detection, setDetection] = useState<faceapi.FaceDetection | null>(null);

  const [blurSettings, setBlurSettings] = useState<BlurSettings>({
    blurEyes: true,
    blurHair: false,
    blurBackground: false,
    blurStrength: 25
  });

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const modelPath = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelPath)
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load face-api models:", err);
        setModelsLoaded(true);
      }
    };
    loadModels();
  }, []);

  // Detect face when models are loaded
  useEffect(() => {
    if (!modelsLoaded || !imageData) return;

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = async () => {
      imageRef.current = img;

      try {
        const result = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (result) {
          setLandmarks(result.landmarks);
          setDetection(result.detection);
          setFaceDetected(true);
        } else {
          setFaceDetected(false);
        }
      } catch (err) {
        console.error("Face detection error:", err);
        setFaceDetected(false);
      }

      setIsLoading(false);
      // Don't call applyBlur here - let the effect handle it
    };

    img.src = imageData;
  }, [modelsLoaded, imageData]);

  // Apply blur whenever settings, landmarks, or detection change
  // This is the SINGLE place blur gets applied - no race conditions
  useEffect(() => {
    if (isLoading) return;
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas to image dimensions
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw original image first
    ctx.drawImage(img, 0, 0);

    // If nothing to blur, show original
    if (!blurSettings.blurEyes && !blurSettings.blurHair && !blurSettings.blurBackground) {
      return;
    }

    const blurRadius = blurSettings.blurStrength;

    // Helper: create a blurred copy of the image
    const createBlurredCanvas = (strength: number): HTMLCanvasElement | null => {
      const temp = document.createElement("canvas");
      temp.width = canvas.width;
      temp.height = canvas.height;
      const tempCtx = temp.getContext("2d");
      if (!tempCtx) return null;

      // Check if filter is supported
      if (typeof tempCtx.filter !== "undefined") {
        tempCtx.filter = `blur(${strength}px)`;
        tempCtx.drawImage(img, 0, 0);
      } else {
        // Fallback: scale down then up (box blur approximation)
        const scale = Math.max(1, strength / 2);
        const sw = Math.max(1, Math.floor(canvas.width / scale));
        const sh = Math.max(1, Math.floor(canvas.height / scale));
        const micro = document.createElement("canvas");
        micro.width = sw;
        micro.height = sh;
        const microCtx = micro.getContext("2d");
        if (microCtx) {
          microCtx.drawImage(img, 0, 0, sw, sh);
          tempCtx.imageSmoothingEnabled = true;
          tempCtx.imageSmoothingQuality = "high";
          tempCtx.drawImage(micro, 0, 0, sw, sh, 0, 0, canvas.width, canvas.height);
        }
      }
      return temp;
    };

    if (landmarks && detection) {
      const box = detection.box;
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const jawline = landmarks.getJawOutline();

      const leftEyeCenter = {
        x: leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length,
        y: leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length
      };
      const rightEyeCenter = {
        x: rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length,
        y: rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length
      };

      // Eye blur region - generous size to actually cover the eye area
      const eyeDistance = Math.abs(rightEyeCenter.x - leftEyeCenter.x);
      const eyeWidth = eyeDistance * 0.55;
      const eyeHeight = eyeWidth * 0.7;

      // Background blur (everything outside face)
      if (blurSettings.blurBackground) {
        const blurred = createBlurredCanvas(blurRadius);
        if (blurred) {
          // Draw full blurred image
          ctx.drawImage(blurred, 0, 0);

          // Cut out face area (restore sharp face)
          ctx.save();
          ctx.beginPath();
          const topOfHead = box.y - box.height * 0.3;
          ctx.moveTo(jawline[0].x, jawline[0].y);
          jawline.forEach(p => ctx.lineTo(p.x, p.y));
          ctx.lineTo(box.x + box.width, topOfHead);
          ctx.lineTo(box.x, topOfHead);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, 0, 0);
          ctx.restore();
        }
      }

      // Hair blur (top of head)
      if (blurSettings.blurHair) {
        const hairTop = Math.max(0, box.y - box.height * 0.5);
        const hairBottom = box.y + box.height * 0.15;
        const hairCenterX = box.x + box.width / 2;
        const hairRadiusX = box.width * 0.6;
        const hairRadiusY = (hairBottom - hairTop) / 2;
        const hairCenterY = hairTop + hairRadiusY;

        const blurred = createBlurredCanvas(blurRadius);
        if (blurred) {
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(hairCenterX, hairCenterY, hairRadiusX, hairRadiusY, 0, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(blurred, 0, 0);
          ctx.restore();
        }
      }

      // Eye blur - drawn LAST so it's always on top
      if (blurSettings.blurEyes) {
        const blurred = createBlurredCanvas(blurRadius * 1.5);
        if (blurred) {
          // Left eye
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(leftEyeCenter.x, leftEyeCenter.y, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(blurred, 0, 0);
          ctx.restore();

          // Right eye
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(rightEyeCenter.x, rightEyeCenter.y, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(blurred, 0, 0);
          ctx.restore();
        }
      }
    } else {
      // No face detected - apply uniform blur to top portion
      if (blurSettings.blurEyes || blurSettings.blurHair) {
        const blurred = createBlurredCanvas(blurRadius);
        if (blurred) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, canvas.width, canvas.height * 0.4);
          ctx.clip();
          ctx.drawImage(blurred, 0, 0);
          ctx.restore();
        }
      }
    }
  }, [blurSettings, landmarks, detection, isLoading]);

  const handleComplete = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const protectedImage = canvas.toDataURL("image/jpeg", 0.9);

    const settings: PrivacySettings = {
      mode: faceDetected ? "auto-blur" : "manual",
      blur: blurSettings,
      faceLandmarks: landmarks ? {
        leftEye: {
          x: landmarks.getLeftEye()[0].x,
          y: landmarks.getLeftEye()[0].y
        },
        rightEye: {
          x: landmarks.getRightEye()[0].x,
          y: landmarks.getRightEye()[0].y
        },
        nose: {
          x: landmarks.getNose()[0].x,
          y: landmarks.getNose()[0].y
        },
        jawline: landmarks.getJawOutline().map(p => ({ x: p.x, y: p.y }))
      } : undefined
    };

    onComplete(protectedImage, settings);
  };

  const toggleSetting = (key: keyof BlurSettings) => {
    if (key === "blurStrength") return;
    setBlurSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm rounded-3xl border border-pink-100 overflow-hidden shadow-xl"
    >
      {/* Header */}
      <div className="p-4 text-center border-b border-pink-100">
        <h3 className="text-lg font-bold bg-gradient-to-r from-[#FF6FAE] to-[#FF5994] bg-clip-text text-transparent">
          Privacy Protection
        </h3>
        <p className="text-sm text-gray-600">
          {isLoading ? "Detecting face..." : faceDetected ? "Face detected - adjust blur below" : "Adjust blur settings"}
        </p>
      </div>

      {/* Preview */}
      <div className="relative aspect-[3/4] bg-gray-100">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF6FAE]" />
            <span className="ml-2 text-gray-600">Detecting face...</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Blur Controls */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between p-3 bg-pink-50 rounded-xl">
          <div className="flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-[#FF6FAE]" />
            <span className="font-medium">Blur Eyes</span>
          </div>
          <button
            onClick={() => toggleSetting("blurEyes")}
            className={`w-12 h-6 rounded-full transition-colors ${
              blurSettings.blurEyes ? "bg-[#FF6FAE]" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                blurSettings.blurEyes ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-pink-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FF6FAE]" />
            <span className="font-medium">Blur Hair</span>
          </div>
          <button
            onClick={() => toggleSetting("blurHair")}
            className={`w-12 h-6 rounded-full transition-colors ${
              blurSettings.blurHair ? "bg-[#FF6FAE]" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                blurSettings.blurHair ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-pink-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#FF6FAE]" />
            <span className="font-medium">Blur Background</span>
          </div>
          <button
            onClick={() => toggleSetting("blurBackground")}
            className={`w-12 h-6 rounded-full transition-colors ${
              blurSettings.blurBackground ? "bg-[#FF6FAE]" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                blurSettings.blurBackground ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Blur Strength Slider */}
        <div className="p-3 bg-pink-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Blur Strength</span>
            <span className="text-sm text-[#FF6FAE]">{blurSettings.blurStrength}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            value={blurSettings.blurStrength}
            onChange={(e) => setBlurSettings(prev => ({
              ...prev,
              blurStrength: parseInt(e.target.value)
            }))}
            className="w-full accent-[#FF6FAE]"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 flex gap-3 border-t border-pink-100">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium"
        >
          Back
        </button>
        <button
          onClick={handleComplete}
          disabled={isLoading}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF6FAE] to-[#FF5994] text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Check className="w-5 h-5" />
          Apply & Continue
        </button>
      </div>
    </motion.div>
  );
}
