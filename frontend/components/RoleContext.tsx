"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api, AnalysisResponse } from "@/services/api";

export type UserRole = "municipal_officer" | "housing_society" | "school_administrator";

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  analysis: AnalysisResponse | null;
  setAnalysis: (analysis: AnalysisResponse | null) => void;
  loading: boolean;
  refreshAnalysis: () => Promise<void>;
  loadDemoData: () => Promise<void>;
  selectedEvidenceId: string | null;
  setSelectedEvidenceId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>("municipal_officer");
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);

  const refreshAnalysis = async () => {
    try {
      setLoading(true);
      const data = await api.getLatestAnalysis();
      setAnalysis(data);
    } catch (err) {
      console.warn("Could not load initial analysis, loading demo automatically:", err);
      try {
        await api.loadDemo();
        const data = await api.getLatestAnalysis();
        setAnalysis(data);
      } catch (e) {
        console.error("Auto demo load error:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDemoData = async () => {
    setLoading(true);
    try {
      await api.loadDemo();
      const data = await api.getLatestAnalysis();
      setAnalysis(data);
    } catch (e) {
      console.error("Failed to load demo:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAnalysis();
  }, []);

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        analysis,
        setAnalysis,
        loading,
        refreshAnalysis,
        loadDemoData,
        selectedEvidenceId,
        setSelectedEvidenceId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
