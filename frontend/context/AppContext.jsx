"use client";

import { createContext, useContext, useState, useCallback } from "react";
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx";
import ErrorModal from "../components/ui/ErrorModal.jsx";

const AppContext = createContext({});

export function AppProvider({ children }) {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState(null);

  const startLoading = useCallback((message = "Loading...") => {
    setLoadingMessage(message);
    setGlobalLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setGlobalLoading(false);
    setLoadingMessage("");
  }, []);

  const showError = useCallback((message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        globalLoading,
        loadingMessage,
        startLoading,
        stopLoading,
        error,
        showError,
        clearError,
      }}
    >
      {children}
      {globalLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 flex flex-col items-center gap-4 border border-white/20">
            <LoadingSpinner size="lg" color="purple" />
            <p className="text-white text-lg">{loadingMessage}</p>
          </div>
        </div>
      )}
      <ErrorModal error={error} onClose={clearError} />
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);