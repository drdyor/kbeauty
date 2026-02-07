import { useState } from "react";

interface PetMoodProps {
  onMoodChange: (mood: string) => void;
}

export function PetMood({ onMoodChange }: PetMoodProps) {
  const moods = [
    { name: "great", emoji: "😺", label: "Great" },
    { name: "okay", emoji: "🙂", label: "Okay" },
    { name: "meh", emoji: "😐", label: "Meh" },
    { name: "brainfog", emoji: "😵‍💫", label: "Brain Fog" },
    { name: "irritable", emoji: "😾", label: "Irritable" },
    { name: "low", emoji: "😿", label: "Low" }
  ];

  const [currentMoodIndex, setCurrentMoodIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleMoodTap = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const nextIndex = (currentMoodIndex + 1) % moods.length;
    setCurrentMoodIndex(nextIndex);
    onMoodChange(moods[nextIndex].name);
    
    // Reset animation flag after transition
    setTimeout(() => setIsAnimating(false), 300);
  };

  const currentMood = moods[currentMoodIndex];

  return (
    <div className="flex flex-col items-center mb-8">
      <div className="text-sm text-gray-600 mb-2">How's today feeling?</div>
      <button
        onClick={handleMoodTap}
        className="text-8xl transition-all duration-300 hover:scale-110 active:scale-95 transform"
        aria-label="Change mood"
      >
        <span className={isAnimating ? "animate-pulse" : ""}>
          {currentMood.emoji}
        </span>
      </button>
      <div className="mt-2 text-lg font-medium text-gray-800">
        {currentMood.label}
      </div>
    </div>
  );
}