import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BottomNav } from "./components/Navigation/BottomNav";
import { GlowMirror } from "./components/Mirror";
import { JournalTab } from "./components/Journal";
import { ProfileTab } from "./components/Profile/ProfileTab";
import { VerifyPage } from "./components/Verify/VerifyPage";
import { useAppData } from "./hooks/useAppData";
import { autoSetupHedera } from "./services/hederaSetup";
import type { AppTab } from "./types";

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("mirror");
  const appData = useAppData();

  // Auto-connect to Hedera if env vars are set
  useEffect(() => {
    autoSetupHedera();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5F7] via-[#FAE8FF] to-white">
      <AnimatePresence mode="wait">
        {activeTab === "mirror" && (
          <motion.div
            key="mirror"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <GlowMirror
              onSaveJournalEntry={appData.addJournalEntry}
              procedures={appData.procedures}
              onAddProcedure={appData.addProcedure}
              progressEntries={appData.progressEntries}
              onAddProgressEntry={appData.addProgressEntry}
              onUpdateProcedures={appData.updateProcedures}
              onUpdateProgressEntries={appData.updateProgressEntries}
            />
          </motion.div>
        )}
        {activeTab === "journal" && (
          <motion.div
            key="journal"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <JournalTab
              journalEntries={appData.journalEntries}
              progressEntries={appData.progressEntries}
              procedures={appData.procedures}
              getAllPhotos={appData.getAllPhotos}
            />
          </motion.div>
        )}
        {activeTab === "verify" && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <VerifyPage />
          </motion.div>
        )}
        {activeTab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ProfileTab
              profile={appData.userProfile}
              onUpdateProfile={appData.updateProfile}
              procedureCount={appData.procedures.length}
              journalCount={appData.journalEntries.length}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;
