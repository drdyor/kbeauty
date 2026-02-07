import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Columns2 } from "lucide-react";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { PhotoStrip } from "./PhotoStrip";
import { format } from "date-fns";

interface CompareViewProps {
  allPhotos: Array<{ id: string; photo: string; date: string; source: "journal" | "procedure" }>;
  initialBeforeId?: string;
  initialAfterId?: string;
  onClose: () => void;
}

export function CompareView({ allPhotos, initialBeforeId, initialAfterId, onClose }: CompareViewProps) {
  const sorted = useMemo(() =>
    [...allPhotos].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [allPhotos]
  );

  const [beforeId, setBeforeId] = useState<string | undefined>(
    initialBeforeId || sorted[0]?.id
  );
  const [afterId, setAfterId] = useState<string | undefined>(
    initialAfterId || (sorted.length > 1 ? sorted[sorted.length - 1].id : undefined)
  );
  const [selecting, setSelecting] = useState<"before" | "after" | null>(null);
  const [sideBySide, setSideBySide] = useState(false);

  const beforePhoto = sorted.find(p => p.id === beforeId);
  const afterPhoto = sorted.find(p => p.id === afterId);

  const handlePhotoSelect = (id: string) => {
    if (selecting === "before") {
      setBeforeId(id);
      setSelecting(null);
    } else if (selecting === "after") {
      setAfterId(id);
      setSelecting(null);
    }
  };

  const canCompare = beforePhoto && afterPhoto && beforeId !== afterId;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-gray-600 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h2 className="text-lg font-bold text-gray-800">Compare</h2>
        <button
          onClick={() => setSideBySide(!sideBySide)}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            sideBySide ? "bg-[#FF6FAE] text-white" : "bg-white/80 text-gray-400 border border-pink-100"
          }`}
        >
          <Columns2 className="w-4 h-4" />
        </button>
      </div>

      {/* Photo selectors */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setSelecting("before")}
          className={`flex-1 p-2 rounded-xl border-2 transition-colors ${
            selecting === "before" ? "border-[#FF6FAE] bg-[#FFF5F7]" : "border-pink-100 bg-white/80"
          }`}
        >
          {beforePhoto ? (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg overflow-hidden">
                <img src={beforePhoto.photo} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-gray-400 uppercase font-medium">Before</p>
                <p className="text-xs font-medium text-gray-700">{format(new Date(beforePhoto.date), "MMM d")}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-2 text-center">Select Before</p>
          )}
        </button>

        <button
          onClick={() => setSelecting("after")}
          className={`flex-1 p-2 rounded-xl border-2 transition-colors ${
            selecting === "after" ? "border-[#FF6FAE] bg-[#FFF5F7]" : "border-pink-100 bg-white/80"
          }`}
        >
          {afterPhoto ? (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg overflow-hidden">
                <img src={afterPhoto.photo} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-gray-400 uppercase font-medium">After</p>
                <p className="text-xs font-medium text-gray-700">{format(new Date(afterPhoto.date), "MMM d")}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-2 text-center">Select After</p>
          )}
        </button>
      </div>

      {/* Photo strip */}
      {selecting && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-4"
        >
          <p className="text-xs text-gray-500 mb-2">
            Select {selecting} photo:
          </p>
          <PhotoStrip
            photos={sorted}
            selectedId={selecting === "before" ? beforeId : afterId}
            onSelect={handlePhotoSelect}
          />
        </motion.div>
      )}

      {/* Comparison */}
      {canCompare ? (
        sideBySide ? (
          /* Side by side */
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-center text-gray-400 mb-1 uppercase font-medium">Before</p>
              <div className="rounded-xl overflow-hidden aspect-[3/4]">
                <img src={beforePhoto.photo} alt="Before" className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-center text-gray-500 mt-1">{format(new Date(beforePhoto.date), "MMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-[10px] text-center text-gray-400 mb-1 uppercase font-medium">After</p>
              <div className="rounded-xl overflow-hidden aspect-[3/4]">
                <img src={afterPhoto.photo} alt="After" className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-center text-gray-500 mt-1">{format(new Date(afterPhoto.date), "MMM d, yyyy")}</p>
            </div>
          </div>
        ) : (
          /* Slider */
          <BeforeAfterSlider
            beforeImage={beforePhoto.photo}
            afterImage={afterPhoto.photo}
            beforeDate={beforePhoto.date}
            afterDate={afterPhoto.date}
          />
        )
      ) : (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-gray-500 font-medium">
            {sorted.length < 2
              ? "Need at least 2 photos to compare"
              : "Select two different photos to compare"
            }
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Capture skin checks from the Mirror tab
          </p>
        </div>
      )}
    </div>
  );
}
