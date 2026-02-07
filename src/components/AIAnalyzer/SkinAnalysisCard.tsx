import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Check } from "lucide-react";

interface SkinAnalysisCardProps {
  score: number;
  concerns: string[];
  skinType: string;
  onContinue: () => void;
}

export const SkinAnalysisCard = ({ 
  score, 
  concerns, 
  skinType,
  onContinue
}: SkinAnalysisCardProps) => {
  return (
    <Card className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm border-purple-100 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-rose-500 bg-clip-text text-transparent">
          Your Skin Health Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative w-48 h-48 mx-auto">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-5xl font-bold text-purple-600">{score}</div>
          </div>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#f3e8ff"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * score) / 100}
              transform="rotate(-90 50 50)"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9333ea" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <div className="bg-purple-50 rounded-2xl p-4">
          <h3 className="font-semibold text-purple-800 mb-2">Skin Type</h3>
          <p className="text-lg capitalize">{skinType}</p>
        </div>
        
        <div className="bg-rose-50 rounded-2xl p-4">
          <h3 className="font-semibold text-rose-800 mb-2">Key Concerns</h3>
          <div className="flex flex-wrap gap-2">
            {concerns.map((concern, index) => (
              <span 
                key={index} 
                className="bg-white text-rose-700 px-3 py-1 rounded-full text-sm flex items-center"
              >
                <Check className="h-4 w-4 mr-1" />
                {concern}
              </span>
            ))}
          </div>
        </div>
        
        <Button 
          onClick={onContinue}
          className="w-full bg-gradient-to-r from-purple-500 to-rose-500 hover:from-purple-600 hover:to-rose-600 text-white py-6 rounded-2xl shadow-lg"
        >
          Continue to Your Routine
        </Button>
      </CardContent>
    </Card>
  );
};