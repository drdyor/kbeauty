import { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  isSameDay, addMonths, subMonths, startOfWeek, endOfWeek,
  isSameMonth,
} from "date-fns";
import type { SkinJournalEntry } from "../../types";
import type { ProgressEntry } from "../../types/procedures";

interface CalendarGridProps {
  entries: SkinJournalEntry[];
  procedureEntries: ProgressEntry[];
  onDateSelect: (date: string) => void;
  onEntryTap: (entry: SkinJournalEntry) => void;
}

export function CalendarGrid({ entries, procedureEntries, onDateSelect, onEntryTap }: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEntriesForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return entries.filter(e => e.date === dateStr);
  };

  const hasProcedureEntry = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return procedureEntries.some(e => e.timestamp.startsWith(dateStr));
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
          className="w-8 h-8 rounded-full bg-[#FFF5F7] flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h3 className="text-base font-semibold text-gray-800">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <button
          onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
          className="w-8 h-8 rounded-full bg-[#FFF5F7] flex items-center justify-center"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-center text-[10px] font-medium text-gray-400 uppercase">
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          const dayEntries = getEntriesForDate(day);
          const hasJournal = dayEntries.length > 0;
          const hasProcedure = hasProcedureEntry(day);
          const firstEntry = dayEntries[0];

          return (
            <button
              key={day.toISOString()}
              onClick={() => {
                if (firstEntry) onEntryTap(firstEntry);
                else onDateSelect(format(day, "yyyy-MM-dd"));
              }}
              className={`relative aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${
                !isCurrentMonth ? "opacity-30" : ""
              } ${isToday ? "ring-2 ring-[#FF6FAE]/30" : ""}`}
            >
              {/* Thumbnail background */}
              {hasJournal && firstEntry.photo && (
                <div className="absolute inset-0.5 rounded-lg overflow-hidden">
                  <img
                    src={firstEntry.photo}
                    alt=""
                    className="w-full h-full object-cover opacity-40"
                  />
                </div>
              )}

              {/* Day number */}
              <span className={`relative text-xs font-medium ${
                hasJournal ? "text-white drop-shadow" :
                isToday ? "text-[#FF6FAE] font-bold" :
                "text-gray-600"
              }`}>
                {format(day, "d")}
              </span>

              {/* Indicators */}
              <div className="relative flex gap-0.5 mt-0.5">
                {hasJournal && (
                  <div className="w-1 h-1 rounded-full bg-[#FF6FAE]" />
                )}
                {hasProcedure && (
                  <div className="w-1 h-1 rounded-full bg-[#A855F7]" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
