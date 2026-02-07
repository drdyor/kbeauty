import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";

const quizQuestions = [
  {
    id: "texture",
    question: "How would you describe your skin's texture?",
    options: [
      { value: "smooth", label: "Smooth and even" },
      { value: "rough", label: "Rough or bumpy in places" },
      { value: "uneven", label: "Uneven with visible pores" }
    ]
  },
  {
    id: "sensitivity",
    question: "How does your skin react to new products?",
    options: [
      { value: "resistant", label: "Rarely reacts" },
      { value: "sensitive", label: "Often gets red or irritated" },
      { value: "very-sensitive", label: "Almost always reacts" }
    ]
  },
  {
    id: "hydration",
    question: "How does your skin feel throughout the day?",
    options: [
      { value: "hydrated", label: "Comfortably hydrated" },
      { value: "tight", label: "Tight, especially after cleansing" },
      { value: "oily", label: "Oily, especially in T-zone" }
    ]
  }
];

interface AdaptiveQuizProps {
  onComplete: (answers: Record<string, string>) => void;
}

export const AdaptiveQuiz = ({ onComplete }: AdaptiveQuizProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const handleAnswer = (value: string) => {
    const newAnswers = {
      ...answers,
      [quizQuestions[currentQuestion].id]: value
    };
    
    setAnswers(newAnswers);
    
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      onComplete(newAnswers);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm border-purple-100 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-rose-500 bg-clip-text text-transparent">
          AI Skin Analysis
        </CardTitle>
        <p className="text-gray-600">
          Answer a few questions to help us understand your skin
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Question {currentQuestion + 1} of {quizQuestions.length}</span>
            <span>{Math.round(((currentQuestion + 1) / quizQuestions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-rose-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-center">
          {quizQuestions[currentQuestion].question}
        </h3>
        
        <RadioGroup 
          onValueChange={handleAnswer}
          className="space-y-4"
        >
          {quizQuestions[currentQuestion].options.map((option) => (
            <div key={option.value} className="flex items-center space-x-3 p-4 rounded-2xl border border-gray-200 hover:border-purple-300 transition-colors">
              <RadioGroupItem 
                value={option.value} 
                id={option.value} 
                className="border-purple-400 text-purple-500"
              />
              <Label 
                htmlFor={option.value} 
                className="text-base font-medium cursor-pointer flex-1"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};