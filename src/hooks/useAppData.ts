import { useState, useEffect, useCallback } from 'react';
import { saveToStorage, loadFromStorage } from '../utils/storage';
import type { SkinJournalEntry, UserProfile } from '../types';
import type { Procedure, ProgressEntry } from '../types/procedures';

export function useAppData() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [journalEntries, setJournalEntries] = useState<SkinJournalEntry[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: '', skinType: 'normal' });

  // Load all data on mount
  useEffect(() => {
    setProcedures(loadFromStorage('procedures') || []);
    setProgressEntries(loadFromStorage('progressEntries') || []);
    setJournalEntries(loadFromStorage('skinJournal') || []);
    setUserProfile(loadFromStorage('userProfile') || { name: '', skinType: 'normal' });
  }, []);

  // Procedures
  const addProcedure = useCallback((proc: Procedure) => {
    setProcedures(prev => {
      const updated = [...prev, proc];
      saveToStorage('procedures', updated);
      return updated;
    });
  }, []);

  const updateProcedures = useCallback((procs: Procedure[]) => {
    setProcedures(procs);
    saveToStorage('procedures', procs);
  }, []);

  // Progress entries
  const addProgressEntry = useCallback((entry: ProgressEntry) => {
    setProgressEntries(prev => {
      const updated = [...prev, entry];
      saveToStorage('progressEntries', updated);
      return updated;
    });
  }, []);

  const updateProgressEntries = useCallback((entries: ProgressEntry[]) => {
    setProgressEntries(entries);
    saveToStorage('progressEntries', entries);
  }, []);

  // Journal entries
  const addJournalEntry = useCallback((entry: SkinJournalEntry) => {
    setJournalEntries(prev => {
      const updated = [...prev, entry];
      saveToStorage('skinJournal', updated);
      return updated;
    });
  }, []);

  // Profile
  const updateProfile = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    saveToStorage('userProfile', profile);
  }, []);

  // Get all photos (journal + procedure progress) for comparison
  const getAllPhotos = useCallback(() => {
    const journalPhotos = journalEntries.map(e => ({
      id: e.id,
      photo: e.photo,
      date: e.date,
      source: 'journal' as const,
    }));
    const procedurePhotos = progressEntries.map(e => ({
      id: e.id,
      photo: e.photoProtected,
      date: e.timestamp.split('T')[0],
      source: 'procedure' as const,
    }));
    return [...journalPhotos, ...procedurePhotos].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [journalEntries, progressEntries]);

  return {
    procedures,
    progressEntries,
    journalEntries,
    userProfile,
    addProcedure,
    updateProcedures,
    addProgressEntry,
    updateProgressEntries,
    addJournalEntry,
    updateProfile,
    getAllPhotos,
  };
}
