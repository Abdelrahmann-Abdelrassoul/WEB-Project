import { useEffect, useState, useCallback } from "react";
import { getMe } from "../services/authService.js";
import { useApp } from "../context/AppContext.jsx";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { startLoading, stopLoading } = useApp();

  const fetchUser = useCallback(async () => {
    try {
      const data = await getMe();
      setUser(data.data?.user);
      return data.data?.user;
    } catch (err) {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      startLoading("Loading user session...");
      await fetchUser();
      setLoading(false);
      stopLoading();
    };
    
    loadUser();
  }, [fetchUser, startLoading, stopLoading]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchUser();
    setLoading(false);
  }, [fetchUser]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    refetch,
  };
};