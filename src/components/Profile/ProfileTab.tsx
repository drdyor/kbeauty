import { useState } from "react";
import { User, Camera, BookOpen, Trash2 } from "lucide-react";
import type { UserProfile, SkinProfile } from "../../types";

interface ProfileTabProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  procedureCount: number;
  journalCount: number;
}

const SKIN_TYPES: SkinProfile['skinType'][] = ['normal', 'dry', 'oily', 'combination', 'sensitive'];

export function ProfileTab({ profile, onUpdateProfile, procedureCount, journalCount }: ProfileTabProps) {
  const [name, setName] = useState(profile.name);
  const [skinType, setSkinType] = useState(profile.skinType);

  const handleSave = () => {
    onUpdateProfile({ name, skinType });
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-12">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#FF6FAE] to-[#FF5994] flex items-center justify-center mb-3">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Your Profile</h1>
        </div>

        {/* Name */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-4">
          <label className="block text-sm font-medium text-gray-600 mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            placeholder="Your name"
            className="w-full p-3 bg-[#FFF5F7] rounded-xl border-0 focus:ring-2 focus:ring-[#FF6FAE] outline-none"
          />
        </div>

        {/* Skin Type */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-4">
          <label className="block text-sm font-medium text-gray-600 mb-3">Skin Type</label>
          <div className="flex flex-wrap gap-2">
            {SKIN_TYPES.map(type => (
              <button
                key={type}
                onClick={() => { setSkinType(type); onUpdateProfile({ name, skinType: type }); }}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                  skinType === type
                    ? 'bg-gradient-to-r from-[#FF6FAE] to-[#FF5994] text-white'
                    : 'bg-[#FFF5F7] text-gray-600 border border-pink-100'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-4 text-center">
            <Camera className="w-6 h-6 text-[#FF6FAE] mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-800">{procedureCount}</div>
            <div className="text-xs text-gray-500">Procedures</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-4 text-center">
            <BookOpen className="w-6 h-6 text-[#FF6FAE] mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-800">{journalCount}</div>
            <div className="text-xs text-gray-500">Journal Entries</div>
          </div>
        </div>

        {/* Clear Data */}
        <button
          onClick={() => {
            if (confirm('Clear all data? This cannot be undone.')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="w-full py-3 rounded-xl bg-red-50 text-red-500 font-medium flex items-center justify-center gap-2 border border-red-100"
        >
          <Trash2 className="w-4 h-4" />
          Clear All Data
        </button>

        {/* Branding */}
        <div className="text-center pt-4 pb-8">
          <p className="text-lg font-bold bg-gradient-to-r from-[#FF6FAE] to-[#FF5994] bg-clip-text text-transparent">
            GlowMirror
          </p>
          <p className="text-xs text-gray-400 mt-1">Your smart skin companion</p>
        </div>
      </div>
    </div>
  );
}
