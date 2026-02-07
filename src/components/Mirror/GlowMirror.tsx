import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as faceapi from "face-api.js";
import { Check, RotateCcw, Grid3x3, Upload, Zap, ZapOff, Shield } from "lucide-react";
import { FaceGuideOverlay } from "./FaceGuideOverlay";
import { SkinZoneOverlay } from "./SkinZoneOverlay";
import { LightingIndicator } from "./LightingIndicator";
import { CaptureControls } from "./CaptureControls";
import { GlowchiCompanion } from "./GlowchiCompanion";
import { SkinJournalDetails } from "../Journal/SkinJournalDetails";
import { PrivacyEditor } from "../Procedures/PrivacyEditor";
import { ProcedureTracker } from "../Procedures";
import type { SkinJournalEntry } from "../../types";
import type { Procedure, ProgressEntry, PrivacySettings } from "../../types/procedures";

type MirrorView = "live" | "review" | "privacy" | "quick-details" | "procedure-flow";

const LIGHT_THRESHOLD_LOW = 20;   // Auto-enable fill light below this
const LIGHT_THRESHOLD_OK = 30;    // Auto-disable fill light above this

interface GlowMirrorProps {
  onSaveJournalEntry: (entry: SkinJournalEntry) => void;
  procedures: Procedure[];
  onAddProcedure: (proc: Procedure) => void;
  progressEntries: ProgressEntry[];
  onAddProgressEntry: (entry: ProgressEntry) => void;
  onUpdateProcedures: (procs: Procedure[]) => void;
  onUpdateProgressEntries: (entries: ProgressEntry[]) => void;
}

export function GlowMirror({
  onSaveJournalEntry,
  procedures,
  onAddProcedure,
  progressEntries,
  onAddProgressEntry,
  onUpdateProcedures,
  onUpdateProgressEntries,
}: GlowMirrorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyzeCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detectionIntervalRef = useRef<number | null>(null);

  const [view, setView] = useState<MirrorView>("live");
  const [captureMode, setCaptureMode] = useState<"quick-check" | "procedure">("quick-check");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [protectedImage, setProtectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [showZones, setShowZones] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceBox, setFaceBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [landmarks, setLandmarks] = useState<faceapi.FaceLandmarks68 | null>(null);
  const [lightingScore, setLightingScore] = useState(50);
  const [containerSize, setContainerSize] = useState({ width: 375, height: 500 });
  const [videoSize, setVideoSize] = useState({ width: 1280, height: 720 });

  // Flash/Torch state
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [fillLightOn, setFillLightOn] = useState(false);
  const [autoFillLight, setAutoFillLight] = useState(true);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load face models:", err);
        setModelsLoaded(true);
      }
    };
    loadModels();
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      stream?.getTracks().forEach(t => t.stop());

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }

      // Check torch support
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      setTorchSupported(!!capabilities?.torch);

      setError(null);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera access needed. Please allow camera permissions.");
    }
  }, [facingMode]);

  useEffect(() => {
    if (view === "live") {
      startCamera();
    }
    return () => {
      if (view !== "live") {
        stream?.getTracks().forEach(t => t.stop());
      }
    };
  }, [facingMode, view, startCamera]);

  // Toggle hardware torch (mobile only)
  const toggleTorch = useCallback(async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
      setTorchOn(!torchOn);
    } catch {
      // Torch not supported, use fill light instead
      setFillLightOn(!fillLightOn);
    }
  }, [stream, torchOn, fillLightOn]);

  // Auto fill light when low light detected
  useEffect(() => {
    if (!autoFillLight || view !== "live") return;
    if (lightingScore < LIGHT_THRESHOLD_LOW && !fillLightOn && !torchOn) {
      // Try torch first, fall back to screen fill light
      if (torchSupported && stream) {
        const track = stream.getVideoTracks()[0];
        track.applyConstraints({ advanced: [{ torch: true } as any] })
          .then(() => setTorchOn(true))
          .catch(() => setFillLightOn(true));
      } else {
        setFillLightOn(true);
      }
    } else if (lightingScore > LIGHT_THRESHOLD_OK && fillLightOn && autoFillLight) {
      setFillLightOn(false);
    }
  }, [lightingScore, autoFillLight, view, fillLightOn, torchOn, torchSupported, stream]);

  // Measure container
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Track video dimensions
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleMeta = () => {
      setVideoSize({ width: video.videoWidth, height: video.videoHeight });
    };
    video.addEventListener("loadedmetadata", handleMeta);
    return () => video.removeEventListener("loadedmetadata", handleMeta);
  }, []);

  // Face detection + lighting analysis loop
  useEffect(() => {
    if (!modelsLoaded || view !== "live") {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      return;
    }

    const analyze = async () => {
      const video = videoRef.current;
      const analyzeCanvas = analyzeCanvasRef.current;
      if (!video || !analyzeCanvas || video.readyState < 2) return;

      const ctx = analyzeCanvas.getContext("2d");
      if (!ctx) return;

      const scale = 320 / video.videoWidth;
      analyzeCanvas.width = 320;
      analyzeCanvas.height = video.videoHeight * scale;
      ctx.drawImage(video, 0, 0, analyzeCanvas.width, analyzeCanvas.height);

      // Lighting analysis
      try {
        const imageData = ctx.getImageData(
          analyzeCanvas.width * 0.25, analyzeCanvas.height * 0.25,
          analyzeCanvas.width * 0.5, analyzeCanvas.height * 0.5
        );
        const data = imageData.data;
        let sum = 0;
        for (let i = 0; i < data.length; i += 16) {
          sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        const brightness = Math.round(sum / (data.length / 16) / 255 * 100);
        setLightingScore(brightness);
      } catch {}

      // Face detection
      try {
        const result = await faceapi
          .detectSingleFace(analyzeCanvas, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
          .withFaceLandmarks();

        if (result) {
          const box = result.detection.box;
          const containerScale = containerSize.width / video.videoWidth;
          setFaceBox({
            x: box.x / scale * containerScale,
            y: box.y / scale * containerScale,
            width: box.width / scale * containerScale,
            height: box.height / scale * containerScale,
          });
          setLandmarks(result.landmarks);
          setFaceDetected(true);
        } else {
          setFaceDetected(false);
          setFaceBox(null);
        }
      } catch {
        setFaceDetected(false);
      }
    };

    detectionIntervalRef.current = window.setInterval(analyze, 1000);
    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, [modelsLoaded, view, containerSize.width]);

  // Capture photo
  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    // Timestamp watermark
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const timestamp = new Date().toLocaleString();
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillRect(10, canvas.height - 36, 220, 26);
    ctx.fillStyle = "#333";
    ctx.font = "12px sans-serif";
    ctx.fillText(`GlowMirror ${timestamp}`, 15, canvas.height - 16);

    const imageData = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(imageData);

    // Shutter flash
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 300);

    // Turn off torch/fill light
    if (torchOn && stream) {
      const track = stream.getVideoTracks()[0];
      track.applyConstraints({ advanced: [{ torch: false } as any] }).catch(() => {});
      setTorchOn(false);
    }
    setFillLightOn(false);

    // Stop camera
    stream?.getTracks().forEach(t => t.stop());
    setView("review");
  }, [facingMode, stream, torchOn]);

  // File upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
      stream?.getTracks().forEach(t => t.stop());
      setView("review");
    };
    reader.readAsDataURL(file);
  };

  const retake = () => {
    setCapturedImage(null);
    setProtectedImage(null);
    setView("live");
  };

  // Use photo -> privacy or details
  const usePhoto = () => {
    if (captureMode === "quick-check") {
      // Go to privacy editor first for eye/face protection
      setView("privacy");
    } else {
      setView("procedure-flow");
    }
  };

  // Privacy editor complete
  const handlePrivacyComplete = (protectedImg: string, _settings: PrivacySettings) => {
    setProtectedImage(protectedImg);
    setView("quick-details");
  };

  // Skip privacy (use original)
  const skipPrivacy = () => {
    setProtectedImage(null);
    setView("quick-details");
  };

  // Save journal entry
  const handleSaveJournal = (entry: SkinJournalEntry) => {
    // If we have a protected image, attach it
    if (protectedImage) {
      entry.photoProtected = protectedImage;
    }
    onSaveJournalEntry(entry);
    setCapturedImage(null);
    setProtectedImage(null);
    setView("live");
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  // Get last journal check date for Glowchi
  const lastCheckDate = (() => {
    // Check localStorage directly for journal entries
    try {
      const stored = localStorage.getItem("skinJournal");
      if (stored) {
        const entries = JSON.parse(stored);
        if (entries.length > 0) return entries[entries.length - 1].timestamp;
      }
    } catch {}
    return undefined;
  })();

  const journalCount = (() => {
    try {
      const stored = localStorage.getItem("skinJournal");
      if (stored) return JSON.parse(stored).length;
    } catch {}
    return 0;
  })();

  // Error state
  if (error && view === "live") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pb-24">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl border border-pink-100 p-8 max-w-sm">
          <div className="text-5xl mb-4">📸</div>
          <p className="text-gray-700 font-medium mb-2">{error}</p>
          <p className="text-sm text-gray-500 mb-6">GlowMirror needs camera access to work as your smart skin mirror.</p>
          <button
            onClick={startCamera}
            className="px-6 py-3 bg-gradient-to-r from-[#FF6FAE] to-[#FF5994] text-white rounded-full font-medium"
          >
            Try Again
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="block mx-auto mt-3 text-sm text-[#FF6FAE] font-medium"
          >
            Or upload a photo instead
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <AnimatePresence mode="wait">
        {/* ===== LIVE CAMERA ===== */}
        {view === "live" && (
          <motion.div
            key="live"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex justify-center bg-black"
          >
            {/* Camera viewport */}
            <div
              ref={containerRef}
              className="relative w-full max-w-lg bg-black overflow-hidden"
              style={{ height: "calc(100vh - 64px)" }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
              />

              {/* Screen fill light (white overlay when torch unavailable) */}
              <AnimatePresence>
                {fillLightOn && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.85 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white pointer-events-none z-[5] mix-blend-soft-light"
                  />
                )}
              </AnimatePresence>

              {/* Face guide */}
              <FaceGuideOverlay
                faceDetected={faceDetected}
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
              />

              {/* Skin zones */}
              <SkinZoneOverlay
                visible={showZones}
                landmarks={landmarks}
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
                videoWidth={videoSize.width}
                videoHeight={videoSize.height}
              />

              {/* Top bar */}
              <div className="absolute top-0 left-0 right-0 pt-12 px-4 flex items-start justify-between">
                <div className="flex flex-col gap-2">
                  <LightingIndicator score={lightingScore} />
                  <GlowchiCompanion
                    journalCount={journalCount}
                    lastCheckDate={lastCheckDate}
                    visible={view === "live"}
                  />
                </div>

                <div className="flex gap-2">
                  {/* Flash/torch toggle */}
                  <button
                    onClick={toggleTorch}
                    className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                      torchOn || fillLightOn
                        ? "bg-yellow-400/40 border border-yellow-400/60"
                        : "bg-black/30"
                    }`}
                  >
                    {torchOn || fillLightOn ? (
                      <Zap className="w-4 h-4 text-yellow-300" />
                    ) : (
                      <ZapOff className="w-4 h-4 text-white/70" />
                    )}
                  </button>

                  {/* Zone toggle */}
                  <button
                    onClick={() => setShowZones(!showZones)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                      showZones ? "bg-[#FF6FAE]/30 border border-[#FF6FAE]/50" : "bg-black/30"
                    }`}
                  >
                    <Grid3x3 className="w-4 h-4 text-white" />
                  </button>

                  {/* Upload */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center"
                  >
                    <Upload className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Brand watermark */}
              <div className="absolute top-12 left-0 right-0 text-center pointer-events-none">
                <h1 className="text-lg font-bold text-white/70 tracking-wide">GlowMirror</h1>
              </div>

              {/* Shutter flash overlay */}
              <AnimatePresence>
                {showFlash && (
                  <motion.div
                    initial={{ opacity: 0.9 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-white pointer-events-none z-20"
                  />
                )}
              </AnimatePresence>

              {/* Capture controls */}
              <CaptureControls
                mode={captureMode}
                onModeChange={setCaptureMode}
                onCapture={capturePhoto}
                onSwitchCamera={switchCamera}
              />
            </div>

            {/* Hidden elements */}
            <canvas ref={canvasRef} className="hidden" />
            <canvas ref={analyzeCanvasRef} className="hidden" />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </motion.div>
        )}

        {/* ===== REVIEW ===== */}
        {view === "review" && capturedImage && (
          <motion.div
            key="review"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative flex justify-center bg-black"
          >
            <div
              className="relative w-full max-w-lg bg-black overflow-hidden"
              style={{ height: "calc(100vh - 64px)" }}
            >
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />

              {/* Top label */}
              <div className="absolute top-12 left-0 right-0 text-center">
                <span className="px-4 py-1.5 bg-black/30 backdrop-blur-md rounded-full text-white text-sm font-medium">
                  {captureMode === "quick-check" ? "Quick Check" : "Procedure Photo"}
                </span>
              </div>

              {/* Bottom controls */}
              <div className="absolute bottom-0 left-0 right-0 pb-20 pt-8 bg-gradient-to-t from-black/50 to-transparent">
                <div className="flex items-center justify-center gap-6 px-6">
                  <button
                    onClick={retake}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-md text-white font-medium"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Retake
                  </button>
                  <button
                    onClick={usePhoto}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF6FAE] to-[#FF5994] text-white font-medium shadow-lg"
                  >
                    <Check className="w-5 h-5" />
                    Use Photo
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== PRIVACY EDITOR (eye/face blur) ===== */}
        {view === "privacy" && capturedImage && (
          <motion.div
            key="privacy"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="pb-20 flex justify-center"
          >
            <div className="w-full max-w-md px-4 pt-4">
              {/* Skip option */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setView("review")}
                  className="text-sm text-gray-500 font-medium"
                >
                  ← Back
                </button>
                <div className="flex items-center gap-1 text-[#FF6FAE]">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-semibold">Privacy</span>
                </div>
                <button
                  onClick={skipPrivacy}
                  className="text-sm text-[#FF6FAE] font-medium"
                >
                  Skip →
                </button>
              </div>

              <PrivacyEditor
                imageData={capturedImage}
                onComplete={handlePrivacyComplete}
                onBack={() => setView("review")}
              />
            </div>
          </motion.div>
        )}

        {/* ===== QUICK DETAILS ===== */}
        {view === "quick-details" && capturedImage && (
          <motion.div
            key="quick-details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="pb-20"
          >
            <SkinJournalDetails
              capturedImage={capturedImage}
              lightingScore={lightingScore}
              onSave={handleSaveJournal}
              onBack={() => setView("privacy")}
            />
          </motion.div>
        )}

        {/* ===== PROCEDURE FLOW ===== */}
        {view === "procedure-flow" && (
          <motion.div
            key="procedure-flow"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="pb-20 px-4 pt-8"
          >
            <button
              onClick={retake}
              className="mb-4 px-4 py-2 rounded-full bg-white/80 text-gray-600 text-sm font-medium border border-pink-100"
            >
              ← Back to Mirror
            </button>
            <ProcedureTracker
              initialImage={capturedImage || undefined}
              externalProcedures={procedures}
              onExternalAddProcedure={onAddProcedure}
              externalProgressEntries={progressEntries}
              onExternalAddEntry={onAddProgressEntry}
              onDone={retake}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
