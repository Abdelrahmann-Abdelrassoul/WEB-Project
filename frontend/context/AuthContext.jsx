"use client";

import { createContext, useContext } from "react";
import { useAuth } from "../hooks/useAuth.js";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider 
      value={{
        user: auth.user,
        loading: auth.loading,
        isAuthenticated: auth.isAuthenticated,
        refetchUser: auth.refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);