"use client";

import { useApp } from "../context/AppContext.jsx";

export function useError() {
  const { error, showError, clearError } = useApp();
  return { error, showError, clearError };
}