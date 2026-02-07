import { Card, CardContent } from "../ui/card";

interface MilestoneBadgeProps {
  title: string;
  description: string;
  achieved: boolean;
  date?: string;
}

export const MilestoneBadge = ({ 
  title, 
  description, 
  achieved,
  date
}: MilestoneBadgeProps) => {
  return (
    <Card className={`overflow-hidden rounded-2xl border-2 ${achieved ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-rose-50' : 'border-gray-200 bg-gray-50'}`}>
      <CardContent className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${achieved ? 'bg-gradient-to-r from-purple-500 to-rose-500' : 'bg-gray-200'}`}>
            {achieved ? (
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8" />
            ) : (
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8" />
            )}
          </div>
          <div className="ml-4">
            <h3 className={`font-bold ${achieved ? 'text-purple-800' : 'text-gray-500'}`}>
              {title}
            </h3>
            <p className={`text-sm ${achieved ? 'text-gray-600' : 'text-gray-400'}`}>
              {description}
            </p>
            {achieved && date && (
              <p className="text-xs text-gray-500 mt-1">Achieved on {date}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};