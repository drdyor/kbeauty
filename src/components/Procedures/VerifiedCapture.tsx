import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { Camera, RotateCcw, Check, X, Upload, AlertTriangle } from "lucide-react";
import { createVerificationData } from "../../utils/verification";
import type { VerificationData } from "../../types/procedures";

interface VerifiedCaptureProps {
  onCapture: (imageData: string, verification: VerificationData) => void;
  onCancel: () => void;
  allowTestUpload?: boolean; // Enable test upload mode
}

export function VerifiedCapture({ onCapture, onCancel, allowTestUpload = true }: VerifiedCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [error, setError] = useState<string | null>(null);
  const [isTestUpload, setIsTestUpload] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Unable to access camera. Please grant permission.");
    }
  }, [facingMode, stream]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame
    ctx.drawImage(video, 0, 0);

    // Add timestamp watermark
    const timestamp = new Date().toLocaleString();
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillRect(10, canvas.height - 40, 200, 30);
    ctx.fillStyle = "#333";
    ctx.font = "14px sans-serif";
    ctx.fillText(`Verified: ${timestamp}`, 15, canvas.height - 18);

    // Convert to base64
    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageData);
  };

  const retake = () => {
    setCapturedImage(null);
    setIsTestUpload(false);
  };

  const confirmCapture = async () => {
    if (capturedImage) {
      setIsProcessing(true);
      try {
        // Stop camera before proceeding
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        // Generate verification data
        const verification = await createVerificationData(
          capturedImage,
          isTestUpload ? 'upload-test' : 'in-app'
        );

        onCapture(capturedImage, verification);
      } catch (err) {
        console.error("Error creating verification:", err);
        setError("Failed to process image");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setCapturedImage(imageData);
      setIsTestUpload(true);
    };
    reader.readAsDataURL(file);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl border border-purple-100">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={startCamera}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-rose-500 text-white rounded-full"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm rounded-3xl border border-purple-100 overflow-hidden shadow-xl"
    >
      {/* Header */}
      <div className="p-4 text-center border-b border-purple-100">
        <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-rose-500 bg-clip-text text-transparent">
          Take Progress Photo
        </h3>
        <p className="text-sm text-gray-600">Position your face in the guide</p>
      </div>

      {/* Camera View */}
      <div className="relative aspect-[3/4] bg-black">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
            />

            {/* Face Guide Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-64 border-2 border-white/50 rounded-[50%] border-dashed" />
            </div>

            {/* Corner guides */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-white/70" />
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-white/70" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-white/70" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-white/70" />
          </>
        ) : (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
            style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
          />
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input for test uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Test upload warning */}
      {isTestUpload && capturedImage && (
        <div className="mx-4 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800">Test Upload</p>
            <p className="text-amber-600">This image won't be marked as verified. Use camera for verified photos.</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="p-4">
        {!capturedImage ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button
                onClick={onCancel}
                className="p-3 rounded-full bg-gray-100 text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>

              <button
                onClick={capturePhoto}
                className="p-4 rounded-full bg-gradient-to-r from-purple-500 to-rose-500 text-white shadow-lg"
              >
                <Camera className="w-8 h-8" />
              </button>

              <button
                onClick={switchCamera}
                className="p-3 rounded-full bg-gray-100 text-gray-600"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
            </div>

            {/* Test upload option */}
            {allowTestUpload && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 text-sm text-purple-600 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload test image (not verified)
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button
              onClick={retake}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600"
            >
              <RotateCcw className="w-5 h-5" />
              Retake
            </button>

            <button
              onClick={confirmCapture}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-rose-500 text-white shadow-lg disabled:opacity-50"
            >
              <Check className="w-5 h-5" />
              {isProcessing ? "Processing..." : "Use Photo"}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
