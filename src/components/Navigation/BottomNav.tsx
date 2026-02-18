import { motion } from "motion/react";
import { Scan, BookOpen, ShieldCheck, User } from "lucide-react";
import type { AppTab } from "../../types";

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const tabs: { id: AppTab; icon: typeof Scan; label: string }[] = [
  { id: 'mirror', icon: Scan, label: 'Mirror' },
  { id: 'journal', icon: BookOpen, label: 'Journal' },
  { id: 'verify', icon: ShieldCheck, label: 'Verify' },
  { id: 'profile', icon: User, label: 'Profile' },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-t border-pink-100 safe-bottom">
      <div className="flex justify-around items-center py-2 px-4 max-w-md mx-auto">
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="relative flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition-colors"
            >
              <Icon
                className={`w-6 h-6 transition-colors ${
                  isActive ? 'text-[#FF6FAE]' : 'text-gray-400'
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-[#FF6FAE]' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-2 w-5 h-0.5 rounded-full bg-gradient-to-r from-[#FF6FAE] to-[#FF5994]"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
