import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, Calendar, Building2, FileText } from "lucide-react";
import type { Procedure, ProcedureType, PROCEDURE_LABELS, PROCEDURE_ICONS } from "../../types/procedures";

interface AddProcedureProps {
  onAdd: (procedure: Procedure) => void;
  onCancel: () => void;
}

const PROCEDURE_OPTIONS: { type: ProcedureType; label: string; icon: string }[] = [
  { type: "botox", label: "Botox / Dysport", icon: "💉" },
  { type: "laser", label: "Laser Treatment", icon: "✨" },
  { type: "chemical-peel", label: "Chemical Peel", icon: "🧪" },
  { type: "microneedling", label: "Microneedling", icon: "📍" },
  { type: "filler", label: "Dermal Filler", icon: "💋" },
  { type: "prp", label: "PRP / Vampire Facial", icon: "🩸" },
  { type: "hydrafacial", label: "HydraFacial", icon: "💧" },
  { type: "other", label: "Other", icon: "🏥" }
];

export function AddProcedure({ onAdd, onCancel }: AddProcedureProps) {
  const [procedureType, setProcedureType] = useState<ProcedureType | null>(null);
  const [customType, setCustomType] = useState("");
  const [datePerformed, setDatePerformed] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [provider, setProvider] = useState("");
  const [clinic, setClinic] = useState("");
  const [notes, setNotes] = useState("");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const handleSubmit = () => {
    if (!procedureType) return;

    const procedure: Procedure = {
      id: `proc_${Date.now()}`,
      type: procedureType,
      customType: procedureType === "other" ? customType : undefined,
      datePerformed,
      provider: provider || undefined,
      clinic: clinic || undefined,
      notes: notes || undefined,
      createdAt: new Date().toISOString()
    };

    onAdd(procedure);
  };

  const selectedOption = PROCEDURE_OPTIONS.find(o => o.type === procedureType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm rounded-3xl border border-purple-100 overflow-hidden shadow-xl"
    >
      {/* Header */}
      <div className="p-4 text-center border-b border-purple-100">
        <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-rose-500 bg-clip-text text-transparent">
          Add New Procedure
        </h3>
        <p className="text-sm text-gray-600">Track your skin treatment progress</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Procedure Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Procedure Type *
          </label>
          <div className="relative">
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="w-full p-3 bg-purple-50 rounded-xl flex items-center justify-between text-left"
            >
              {selectedOption ? (
                <span className="flex items-center gap-2">
                  <span>{selectedOption.icon}</span>
                  <span>{selectedOption.label}</span>
                </span>
              ) : (
                <span className="text-gray-500">Select procedure type...</span>
              )}
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showTypeDropdown ? "rotate-180" : ""}`} />
            </button>

            {showTypeDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden"
              >
                {PROCEDURE_OPTIONS.map(option => (
                  <button
                    key={option.type}
                    onClick={() => {
                      setProcedureType(option.type);
                      setShowTypeDropdown(false);
                    }}
                    className={`w-full p-3 flex items-center gap-2 hover:bg-purple-50 text-left ${
                      procedureType === option.type ? "bg-purple-100" : ""
                    }`}
                  >
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Custom Type (if Other selected) */}
        {procedureType === "other" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Procedure Name *
            </label>
            <input
              type="text"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              placeholder="Enter procedure name..."
              className="w-full p-3 bg-purple-50 rounded-xl border-0 focus:ring-2 focus:ring-purple-500"
            />
          </motion.div>
        )}

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Date Performed *
          </label>
          <input
            type="date"
            value={datePerformed}
            onChange={(e) => setDatePerformed(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="w-full p-3 bg-purple-50 rounded-xl border-0 focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Provider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building2 className="w-4 h-4 inline mr-1" />
            Provider / Doctor (optional)
          </label>
          <input
            type="text"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="Dr. Smith"
            className="w-full p-3 bg-purple-50 rounded-xl border-0 focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Clinic */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Clinic / Location (optional)
          </label>
          <input
            type="text"
            value={clinic}
            onChange={(e) => setClinic(e.target.value)}
            placeholder="Beauty Clinic NYC"
            className="w-full p-3 bg-purple-50 rounded-xl border-0 focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any details about the procedure..."
            rows={3}
            className="w-full p-3 bg-purple-50 rounded-xl border-0 focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 flex gap-3 border-t border-purple-100">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!procedureType || (procedureType === "other" && !customType)}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-rose-500 text-white font-medium disabled:opacity-50"
        >
          Add Procedure
        </button>
      </div>
    </motion.div>
  );
}
