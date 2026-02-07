import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Smile, Meh, Frown } from "lucide-react";

interface DailyCheckInProps {
  onSubmit: (data: any) => void;
}

export const DailyCheckIn = ({ onSubmit }: DailyCheckInProps) => {
  const [mood, setMood] = useState<'happy' | 'neutral' | 'sad'>('neutral');
  const [notes, setNotes] = useState('');
  
  const handleSubmit = () => {
    onSubmit({ mood, notes });
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm border-purple-100 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-rose-500 bg-clip-text text-transparent">
          Daily Check-In
        </CardTitle>
        <p className="text-gray-600">
          How's your skin feeling today?
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-lg font-medium mb-3 block">How are you feeling?</Label>
          <div className="flex justify-between">
            <Button
              variant={mood === 'happy' ? 'default' : 'outline'}
              size="lg"
              className={`rounded-full w-20 h-20 ${mood === 'happy' ? 'bg-gradient-to-r from-purple-500 to-rose-500 text-white' : 'border-purple-200'}`}
              onClick={() => setMood('happy')}
            >
              <Smile className="h-8 w-8" />
            </Button>
            <Button
              variant={mood === 'neutral' ? 'default' : 'outline'}
              size="lg"
              className={`rounded-full w-20 h-20 ${mood === 'neutral' ? 'bg-gradient-to-r from-purple-500 to-rose-500 text-white' : 'border-purple-200'}`}
              onClick={() => setMood('neutral')}
            >
              <Meh className="h-8 w-8" />
            </Button>
            <Button
              variant={mood === 'sad' ? 'default' : 'outline'}
              size="lg"
              className={`rounded-full w-20 h-20 ${mood === 'sad' ? 'bg-gradient-to-r from-purple-500 to-rose-500 text-white' : 'border-purple-200'}`}
              onClick={() => setMood('sad')}
            >
              <Frown className="h-8 w-8" />
            </Button>
          </div>
        </div>
        
        <div>
          <Label htmlFor="notes" className="text-lg font-medium mb-3 block">
            Any notes about your skin today?
          </Label>
          <Textarea
            id="notes"
            placeholder="e.g. Noticed some dryness after yesterday's workout..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[120px] rounded-2xl border-purple-200"
          />
        </div>
        
        <Button 
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-purple-500 to-rose-500 hover:from-purple-600 hover:to-rose-600 text-white py-6 rounded-2xl shadow-lg"
        >
          Save Check-In
        </Button>
      </CardContent>
    </Card>
  );
};