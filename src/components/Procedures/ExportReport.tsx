import { useState } from "react";
import { motion } from "motion/react";
import { Download, FileText, Printer, X, ShieldCheck, AlertTriangle } from "lucide-react";
import { formatVerificationForExport } from "../../utils/verification";
import type { Procedure, ProgressEntry, ProcedureWithProgress } from "../../types/procedures";

interface ExportReportProps {
  procedureWithProgress: ProcedureWithProgress;
  onClose: () => void;
}

export function ExportReport({ procedureWithProgress, onClose }: ExportReportProps) {
  const { procedure, entries } = procedureWithProgress;
  const [isGenerating, setIsGenerating] = useState(false);

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    setIsGenerating(true);

    try {
      // Generate HTML report
      const reportHTML = generateReportHTML(procedure, sortedEntries);

      // Create blob and download
      const blob = new Blob([reportHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `procedure-report-${procedure.id}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generating report:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-lg">Export Report</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="p-4 overflow-y-auto max-h-[60vh] print:max-h-none" id="report-content">
          {/* Report Header */}
          <div className="text-center mb-6 pb-4 border-b">
            <h1 className="text-xl font-bold">Procedure Progress Report</h1>
            <p className="text-gray-500 text-sm">Generated: {new Date().toLocaleString()}</p>
          </div>

          {/* Procedure Info */}
          <div className="mb-6 p-4 bg-purple-50 rounded-xl">
            <h2 className="font-bold mb-2">Procedure Details</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Type:</span>{" "}
                <span className="font-medium capitalize">{procedure.customType || procedure.type.replace("-", " ")}</span>
              </div>
              <div>
                <span className="text-gray-500">Date:</span>{" "}
                <span className="font-medium">{new Date(procedure.datePerformed).toLocaleDateString()}</span>
              </div>
              {procedure.provider && (
                <div>
                  <span className="text-gray-500">Provider:</span>{" "}
                  <span className="font-medium">{procedure.provider}</span>
                </div>
              )}
              {procedure.clinic && (
                <div>
                  <span className="text-gray-500">Clinic:</span>{" "}
                  <span className="font-medium">{procedure.clinic}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-6">
            <h2 className="font-bold mb-4">Progress Timeline ({entries.length} entries)</h2>
            <div className="space-y-4">
              {sortedEntries.map((entry, index) => (
                <div key={entry.id} className="border rounded-xl overflow-hidden">
                  <div className="p-3 bg-gray-50 flex items-center justify-between">
                    <div>
                      <span className="font-medium">Day {entry.daysSinceProcedure}</span>
                      <span className="text-gray-500 text-sm ml-2">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.verified ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                          Test
                        </span>
                      )}
                      {entry.complication && entry.complication.severity !== 'none' && (
                        <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                          entry.complication.severity === 'mild' ? 'bg-yellow-100 text-yellow-700' :
                          entry.complication.severity === 'moderate' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          <AlertTriangle className="w-3 h-3" />
                          {entry.complication.severity}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex gap-4">
                      <img
                        src={entry.photoProtected}
                        alt={`Day ${entry.daysSinceProcedure}`}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <div className="flex-1 text-sm space-y-2">
                        {entry.rating && (
                          <div>
                            <span className="text-gray-500">Rating:</span>{" "}
                            {"★".repeat(entry.rating)}{"☆".repeat(5 - entry.rating)}
                          </div>
                        )}
                        {entry.afterCare && (
                          <div>
                            <span className="text-gray-500">Aftercare followed:</span>{" "}
                            <span className={entry.afterCare.followedInstructions ? "text-green-600" : "text-red-600"}>
                              {entry.afterCare.followedInstructions ? "Yes" : "No"}
                            </span>
                          </div>
                        )}
                        {entry.notes && (
                          <div>
                            <span className="text-gray-500">Notes:</span>{" "}
                            <span>{entry.notes}</span>
                          </div>
                        )}
                        {entry.complication?.description && (
                          <div>
                            <span className="text-gray-500">Complication:</span>{" "}
                            <span className="text-red-600">{entry.complication.description}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Verification details */}
                    {entry.verification && (
                      <div className="mt-2 pt-2 border-t text-xs text-gray-400 font-mono">
                        Hash: {entry.verification.hash.substring(0, 16)}...
                        <br />
                        Captured: {entry.verification.timestamp}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legal disclaimer */}
          <div className="text-xs text-gray-400 border-t pt-4">
            <p className="font-medium mb-1">Verification Notice</p>
            <p>
              Photos marked as "Verified" were captured directly within the application and include
              cryptographic hash verification. This report was generated for documentation purposes.
              Photo hashes can be used to verify image integrity.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            Print
          </button>
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-rose-500 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            {isGenerating ? "Generating..." : "Download HTML"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function generateReportHTML(procedure: Procedure, entries: ProgressEntry[]): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Procedure Report - ${procedure.customType || procedure.type}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
    .procedure-info { background: #f5f3ff; padding: 16px; border-radius: 12px; margin-bottom: 20px; }
    .entry { border: 1px solid #ddd; border-radius: 12px; margin-bottom: 16px; overflow: hidden; }
    .entry-header { background: #f9fafb; padding: 12px; display: flex; justify-content: space-between; }
    .entry-content { padding: 12px; display: flex; gap: 16px; }
    .entry-image { width: 150px; height: 150px; object-fit: cover; border-radius: 8px; }
    .verified { background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 9999px; font-size: 12px; }
    .complication { background: #fef2f2; color: #991b1b; padding: 4px 8px; border-radius: 9999px; font-size: 12px; }
    .hash { font-family: monospace; font-size: 10px; color: #9ca3af; margin-top: 8px; }
    .disclaimer { font-size: 11px; color: #6b7280; border-top: 1px solid #eee; padding-top: 16px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Procedure Progress Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>

  <div class="procedure-info">
    <h2>Procedure Details</h2>
    <p><strong>Type:</strong> ${procedure.customType || procedure.type.replace("-", " ")}</p>
    <p><strong>Date:</strong> ${new Date(procedure.datePerformed).toLocaleDateString()}</p>
    ${procedure.provider ? `<p><strong>Provider:</strong> ${procedure.provider}</p>` : ''}
    ${procedure.clinic ? `<p><strong>Clinic:</strong> ${procedure.clinic}</p>` : ''}
  </div>

  <h2>Progress Timeline (${entries.length} entries)</h2>

  ${entries.map(entry => `
    <div class="entry">
      <div class="entry-header">
        <span><strong>Day ${entry.daysSinceProcedure}</strong> - ${new Date(entry.timestamp).toLocaleString()}</span>
        <span>
          ${entry.verified ? '<span class="verified">✓ Verified</span>' : '<span style="background:#fef3c7;color:#92400e;padding:4px 8px;border-radius:9999px;font-size:12px;">Test</span>'}
          ${entry.complication && entry.complication.severity !== 'none' ? `<span class="complication">${entry.complication.severity}</span>` : ''}
        </span>
      </div>
      <div class="entry-content">
        <img src="${entry.photoProtected}" class="entry-image" alt="Day ${entry.daysSinceProcedure}">
        <div>
          ${entry.rating ? `<p><strong>Rating:</strong> ${"★".repeat(entry.rating)}${"☆".repeat(5 - entry.rating)}</p>` : ''}
          ${entry.afterCare ? `<p><strong>Aftercare followed:</strong> ${entry.afterCare.followedInstructions ? 'Yes' : 'No'}</p>` : ''}
          ${entry.notes ? `<p><strong>Notes:</strong> ${entry.notes}</p>` : ''}
          ${entry.complication?.description ? `<p><strong>Complication:</strong> ${entry.complication.description}</p>` : ''}
          ${entry.verification ? `<p class="hash">Hash: ${entry.verification.hash}<br>Timestamp: ${entry.verification.timestamp}</p>` : ''}
        </div>
      </div>
    </div>
  `).join('')}

  <div class="disclaimer">
    <p><strong>Verification Notice</strong></p>
    <p>Photos marked as "Verified" were captured directly within the application and include cryptographic hash verification (SHA-256). This report was generated for documentation purposes. Photo hashes can be independently verified to confirm image integrity has not been compromised.</p>
  </div>
</body>
</html>
  `.trim();
}
