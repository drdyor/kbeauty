import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Clock } from "lucide-react";

interface RoutineStep {
  id: string;
  title: string;
  description: string;
  time: 'morning' | 'evening';
  glowState: 'optimal' | 'recovering' | 'overloaded';
  product?: {
    name: string;
    description: string;
  };
}

interface DynamicTimelineProps {
  steps: RoutineStep[];
}

const glowStateColors = {
  optimal: 'bg-gradient-to-r from-green-400 to-emerald-500',
  recovering: 'bg-gradient-to-r from-amber-400 to-orange-500',
  overloaded: 'bg-gradient-to-r from-rose-400 to-pink-500'
};

const glowStateLabels = {
  optimal: 'Optimal',
  recovering: 'Recovering',
  overloaded: 'Overloaded'
};

export const DynamicTimeline = ({ steps }: DynamicTimelineProps) => {
  return (
    <Card className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm border-purple-100 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-rose-500 bg-clip-text text-transparent">
          Your Daily Routine
        </CardTitle>
        <p className="text-gray-600">
          Personalized for your skin's current needs
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-purple-200"></div>
          
          <div className="space-y-8 pt-2">
            {steps.map((step, index) => (
              <div key={step.id} className="relative flex items-start">
                {/* Timeline dot */}
                <div className={`absolute left-3 w-4 h-4 rounded-full ${glowStateColors[step.glowState]} border-2 border-white`}></div>
                
                {/* Content */}
                <div className="ml-12 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                      {step.time === 'morning' ? 'Morning' : 'Evening'}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full text-white ${glowStateColors[step.glowState]}`}>
                      {glowStateLabels[step.glowState]}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold mt-2">{step.title}</h3>
                  <p className="text-gray-600 mt-1">{step.description}</p>
                  
                  {step.product && (
                    <div className="mt-3 p-3 bg-gradient-to-br from-purple-50 to-rose-50 rounded-2xl border border-purple-100">
                      <h4 className="font-semibold text-purple-800">{step.product.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{step.product.description}</p>
                    </div>
                  )}
                  
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-full text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      2 min
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-full text-xs text-purple-600">
                      Why this works
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <Button className="w-full bg-gradient-to-r from-purple-500 to-rose-500 hover:from-purple-600 hover:to-rose-600 text-white py-6 rounded-2xl shadow-lg">
          Start Routine
        </Button>
      </CardContent>
    </Card>
  );
};