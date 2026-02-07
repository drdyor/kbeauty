import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

interface DynamicSkincarePetProps {
  onInteract: () => void;
  skinCondition: 'acne-prone' | 'sensitive' | 'aging' | 'balanced';
  lastInteraction?: Date;
}

export function DynamicSkincarePet({ 
  onInteract, 
  skinCondition, 
  lastInteraction 
}: DynamicSkincarePetProps) {
  const [acneSpots, setAcneSpots] = useState<{id: number; x: number; y: number}[]>([]);
  const [redness, setRedness] = useState(0);
  const [greyness, setGreyness] = useState(0);
  const [happiness, setHappiness] = useState(100);
  const [showSparkles, setShowSparkles] = useState(false);
  const [showReminder, setShowReminder] = useState(false);

  // Calculate time since last interaction
  useEffect(() => {
    const calculateDegradation = () => {
      if (!lastInteraction) return;
      
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60));
      
      switch (skinCondition) {
        case 'acne-prone':
          // Add acne spots every 2 hours if neglected
          const newSpots = [];
          for (let i = 0; i < Math.min(diffHours / 2, 10); i++) {
            newSpots.push({
              id: i,
              x: Math.random() * 80 + 10,
              y: Math.random() * 60 + 20
            });
          }
          setAcneSpots(newSpots);
          setHappiness(Math.max(20, 100 - diffHours * 3));
          break;
          
        case 'sensitive':
          // Increase redness every hour
          setRedness(Math.min(100, diffHours * 5));
          setHappiness(Math.max(30, 100 - diffHours * 2));
          break;
          
        case 'aging':
          // Increase greyness every 3 hours
          setGreyness(Math.min(100, diffHours * 3));
          setHappiness(Math.max(40, 100 - diffHours * 1.5));
          break;
          
        default:
          // Balanced skin degrades slowly
          setHappiness(Math.max(50, 100 - diffHours));
      }
      
      // Show reminder if neglected for more than 6 hours
      setShowReminder(diffHours > 6);
    };

    calculateDegradation();
    const interval = setInterval(calculateDegradation, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [skinCondition, lastInteraction]);

  const handlePetInteraction = () => {
    setShowSparkles(true);
    onInteract();
    
    // Reset condition based on skin type
    switch (skinCondition) {
      case 'acne-prone':
        setAcneSpots([]);
        break;
      case 'sensitive':
        setRedness(0);
        break;
      case 'aging':
        setGreyness(0);
        break;
    }
    
    setHappiness(100);
    setShowReminder(false);
    
    setTimeout(() => setShowSparkles(false), 1000);
  };

  const getConditionText = () => {
    switch (skinCondition) {
      case 'acne-prone': return 'Acne Prone';
      case 'sensitive': return 'Sensitive';
      case 'aging': return 'Aging';
      default: return 'Balanced';
    }
  };

  const getActionButtonText = () => {
    switch (skinCondition) {
      case 'acne-prone': return 'Clear Spots';
      case 'sensitive': return 'Soothe Skin';
      case 'aging': return 'Rejuvenate';
      default: return 'Pet Me';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-10">
      <div className="relative">
        {/* Pet Container */}
        <div className="relative w-32 h-32">
          {/* Pet Base */}
          <motion.div 
            className="w-full h-full rounded-full bg-gradient-to-br from-rose-100 to-pink-200 border-4 border-white shadow-xl flex items-center justify-center"
            style={{
              filter: `grayscale(${greyness}%)`,
              opacity: 0.7 + (happiness / 100) * 0.3
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Pet Face */}
            <div className="relative w-20 h-20">
              {/* Eyes */}
              <div 
                className="absolute top-6 left-3 w-4 h-4 bg-black rounded-full"
                style={{ filter: `brightness(${100 - redness / 2}%)` }}
              />
              <div 
                className="absolute top-6 right-3 w-4 h-4 bg-black rounded-full"
                style={{ filter: `brightness(${100 - redness / 2}%)` }}
              />
              
              {/* Mouth */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-pink-300 rounded-full" />
            </div>
            
            {/* Acne Spots */}
            <AnimatePresence>
              {acneSpots.map(spot => (
                <motion.div
                  key={spot.id}
                  className="absolute w-3 h-3 bg-red-500 rounded-full border border-red-700"
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                />
              ))}
            </AnimatePresence>
            
            {/* Sparkles */}
            <AnimatePresence>
              {showSparkles && (
                <>
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-yellow-400"
                      initial={{ 
                        x: Math.random() * 40 - 20, 
                        y: Math.random() * 40 - 20,
                        opacity: 1,
                        scale: 0
                      }}
                      animate={{ 
                        x: Math.random() * 80 - 40, 
                        y: Math.random() * 80 - 40,
                        opacity: 0,
                        scale: 1
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1 }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                  ))}
                </>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Condition Badge */}
          <div className="absolute -top-2 -right-2 bg-white rounded-full px-2 py-1 shadow-md">
            <span className="text-xs font-bold text-purple-600">{getConditionText()}</span>
          </div>
          
          {/* Reminder Indicator */}
          <AnimatePresence>
            {showReminder && (
              <motion.div
                className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                Need care!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Action Button */}
        <motion.button
          onClick={handlePetInteraction}
          className="mt-4 w-full py-2 bg-gradient-to-r from-purple-500 to-rose-500 text-white rounded-full shadow-lg font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {getActionButtonText()}
        </motion.button>
      </div>
    </div>
  );
}