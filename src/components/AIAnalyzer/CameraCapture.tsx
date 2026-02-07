import { useState, useRef } from "react";
import { Button } from "../ui/button";
import { Camera, Upload } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
}

export const CameraCapture = ({ onCapture }: CameraCaptureProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setPreview(imageData);
        onCapture(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative aspect-square bg-gradient-to-br from-purple-50 to-rose-50 rounded-3xl overflow-hidden border-2 border-purple-100 flex items-center justify-center">
        {preview ? (
          <img 
            src={preview} 
            alt="Skin preview" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center p-6">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Upload a photo of your face</p>
          </div>
        )}
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>
      
      <div className="flex gap-3 mt-6">
        <Button 
          onClick={triggerFileInput}
          className="flex-1 bg-gradient-to-r from-purple-500 to-rose-500 hover:from-purple-600 hover:to-rose-600 text-white py-6 rounded-2xl shadow-lg"
        >
          <Upload className="mr-2 h-5 w-5" />
          Upload Photo
        </Button>
      </div>
    </div>
  );
};