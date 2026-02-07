import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

export const GlowStoryPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Mock data for glow journey
  const glowData = [
    { week: 1, score: 45, state: "Dryness" },
    { week: 4, score: 62, state: "Balanced" },
    { week: 8, score: 85, state: "Radiant" }
  ];

  return (
    <Card className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm border-purple-100 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-rose-500 bg-clip-text text-transparent">
          Your Glow Journey
        </CardTitle>
        <p className="text-gray-600">
          Watch your transformation over time
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative aspect-video bg-gradient-to-br from-purple-900 to-rose-800 rounded-2xl overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20"></div>
          
          {/* Mock video player */}
          <div className="relative z-10 text-center text-white">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
            <p className="text-lg font-medium">Your Glow Story</p>
            <p className="text-sm opacity-80">Week 1 to Week 8</p>
          </div>
          
          {/* Play controls */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            <Button 
              size="icon" 
              className="rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white" />}
            </Button>
            <Button 
              size="icon" 
              className="rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
            >
              <RotateCcw className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {glowData.map((data, index) => (
            <div 
              key={index} 
              className="bg-gradient-to-br from-purple-50 to-rose-50 rounded-2xl p-3 text-center border border-purple-100"
            >
              <div className="text-2xl font-bold text-purple-600">Week {data.week}</div>
              <div className="text-lg font-semibold mt-1">{data.state}</div>
              <div className="text-sm text-gray-600 mt-1">Score: {data.score}</div>
            </div>
          ))}
        </div>
        
        <Button className="w-full bg-gradient-to-r from-purple-500 to-rose-500 hover:from-purple-600 hover:to-rose-600 text-white py-6 rounded-2xl shadow-lg">
          Export as Video
        </Button>
      </CardContent>
    </Card>
  );
};