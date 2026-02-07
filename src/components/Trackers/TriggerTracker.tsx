import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Calendar, Utensils, Heart, Moon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface TriggerTrackerProps {
  onLog: (data: TriggerData) => void;
}

interface TriggerData {
  date: Date;
  foodTriggers?: string[];
  stressLevel?: number;
  cycleDay?: number;
  notes?: string;
}

const commonFoodTriggers = [
  "Dairy", "Sugar", "Gluten", "Spicy Food", 
  "Chocolate", "Nuts", "Seafood", "Processed Food"
];

const stressLevels = [
  { value: 1, label: "Very Low", color: "bg-green-400" },
  { value: 2, label: "Low", color: "bg-green-500" },
  { value: 3, label: "Moderate", color: "bg-yellow-400" },
  { value: 4, label: "High", color: "bg-orange-500" },
  { value: 5, label: "Very High", color: "bg-red-500" }
];

export const TriggerTracker = ({ onLog }: TriggerTrackerProps) => {
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [cycleDay, setCycleDay] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState<"food" | "stress" | "cycle">("food");

  const toggleFood = (food: string) => {
    setSelectedFoods(prev => 
      prev.includes(food) 
        ? prev.filter(f => f !== food) 
        : [...prev, food]
    );
  };

  const handleSubmit = () => {
    const data: TriggerData = {
      date: new Date(),
      foodTriggers: selectedFoods.length > 0 ? selectedFoods : undefined,
      stressLevel: stressLevel || undefined,
      cycleDay: cycleDay > 0 ? cycleDay : undefined,
      notes: notes || undefined
    };
    
    onLog(data);
    resetForm();
  };

  const resetForm = () => {
    setSelectedFoods([]);
    setStressLevel(null);
    setCycleDay(0);
    setNotes("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="bg-white/80 backdrop-blur-sm border-purple-100 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Calendar className="h-5 w-5" />
            Track Your Triggers
          </CardTitle>
          <p className="text-sm text-gray-600">
            Log factors that might affect your skin health
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex bg-purple-50 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("food")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === "food"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              <Utensils className="h-4 w-4" />
              Food
            </button>
            <button
              onClick={() => setActiveTab("stress")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === "stress"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              <Heart className="h-4 w-4" />
              Stress
            </button>
            <button
              onClick={() => setActiveTab("cycle")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === "cycle"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              <Moon className="h-4 w-4" />
              Cycle
            </button>
          </div>

          {/* Food Tracking */}
          {activeTab === "food" && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Did you eat any of these?</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {commonFoodTriggers.map((food) => (
                  <button
                    key={food}
                    onClick={() => toggleFood(food)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      selectedFoods.includes(food)
                        ? "bg-gradient-to-r from-purple-500 to-rose-500 text-white shadow-md"
                        : "bg-purple-50 text-purple-800 hover:bg-purple-100"
                    }`}
                  >
                    {food}
                  </button>
                ))}
              </div>
              
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other foods (comma separated)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., avocado, coffee, wine..."
                  className="w-full p-3 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Stress Tracking */}
          {activeTab === "stress" && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">How stressed are you today?</h3>
              <div className="space-y-3">
                {stressLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setStressLevel(level.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                      stressLevel === level.value
                        ? "ring-2 ring-purple-500 bg-purple-50"
                        : "hover:bg-purple-50"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${level.color}`}></div>
                    <span className="font-medium">{level.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cycle Tracking */}
          {activeTab === "cycle" && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Where are you in your cycle?</h3>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <button
                    key={day}
                    onClick={() => setCycleDay(day)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      cycleDay === day
                        ? "bg-gradient-to-r from-purple-500 to-rose-500 text-white shadow-md"
                        : "bg-purple-50 text-purple-800 hover:bg-purple-100"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Menstrual</span>
                <span>Ovulation</span>
                <span>Luteal</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={
              selectedFoods.length === 0 && 
              stressLevel === null && 
              cycleDay === 0 && 
              !notes
            }
            className="w-full bg-gradient-to-r from-purple-500 to-rose-500 hover:from-purple-600 hover:to-rose-600 text-white py-3"
          >
            Log Triggers
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};