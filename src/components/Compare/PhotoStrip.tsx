import { format } from "date-fns";

interface PhotoStripProps {
  photos: Array<{ id: string; photo: string; date: string }>;
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function PhotoStrip({ photos, selectedId, onSelect }: PhotoStripProps) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-gray-400">
        No photos yet. Use the Mirror to capture skin checks.
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
      {photos.map(({ id, photo, date }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={`flex-shrink-0 flex flex-col items-center gap-1 transition-all ${
            selectedId === id ? "scale-105" : ""
          }`}
        >
          <div
            className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
              selectedId === id ? "border-[#FF6FAE] shadow-md" : "border-transparent"
            }`}
          >
            <img src={photo} alt="" className="w-full h-full object-cover" />
          </div>
          <span className="text-[9px] text-gray-500">
            {format(new Date(date), "M/d")}
          </span>
        </button>
      ))}
    </div>
  );
}
