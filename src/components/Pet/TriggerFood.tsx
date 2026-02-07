import { useState, useEffect } from "react";

interface TriggerFoodProps {
  onTriggerLog: (food: string, intensity: number) => void;
}

export function TriggerFood({ onTriggerLog }: TriggerFoodProps) {
  const [showFoods, setShowFoods] = useState(false);
  const [activeFood, setActiveFood] = useState<string | null>(null);
  const [tapCounts, setTapCounts] = useState<Record<string, number>>({});

  const foods = [
    { name: "Candy", emoji: "🍭" },
    { name: "Milk", emoji: "🥛" },
    { name: "Wine", emoji: "🍷" },
    { name: "Bread", emoji: "🍞" },
    { name: "Burger", emoji: "🍔" },
    { name: "Spicy", emoji: "🌶️" }
  ];

  const handleFoodClick = (foodName: string) => {
    const newCount = (tapCounts[foodName] || 0) + 1;
    const intensity = Math.min(newCount, 3);
    
    setTapCounts(prev => ({ ...prev, [foodName]: intensity }));
    setActiveFood(foodName);
    
    // Reset after animation
    setTimeout(() => {
      setActiveFood(null);
      setTapCounts(prev => ({ ...prev, [foodName]: 0 }));
    }, 1000);
    
    onTriggerLog(foodName, intensity);
  };

  // Reset all taps after 2 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      setTapCounts({});
    }, 2000);
    return () => clearTimeout(timer);
  }, [tapCounts]);

  return (
    <div className="fixed bottom-32 right-4 z-20">
      {showFoods && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          {foods.map((food) => (
            <button
              key={food.name}
              onClick={() => handleFoodClick(food.name)}
              className={`
                w-12 h-12 bg-white rounded-full flex flex-col items-center justify-center shadow-lg transition-all
                ${activeFood === food.name 
                  ? 'scale-125 ring-4 ring-yellow-300' 
                  : 'hover:scale-110'}
                ${tapCounts[food.name] === 2 ? 'ring-2 ring-yellow-200' : ''}
                ${tapCounts[food.name] === 3 ? 'ring-4 ring-yellow-400' : ''}
              `}
            >
              <span className="text-xl">{food.emoji}</span>
              {tapCounts[food.name] > 0 && (
                <div className="flex mt-1">
                  {[...Array(tapCounts[food.name])].map((_, i) => (
                    <div key={i} className="w-1 h-1 bg-yellow-500 rounded-full mx-0.5"></div>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
      
      <button
        onClick={() => setShowFoods(!showFoods)}
        className="w-14 h-14 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
      >
        <span className="text-white font-bold text-lg">
          {showFoods ? '×' : '+'}
        </span>
      </button>
      
      {activeFood && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {activeFood} logged for today 😺
        </div>
      )}
    </div>
  );
}