import { buildApiUrl, readJsonSafely } from "./api.js";

// Register
export const register = async (username, email, password) => {
  const res = await fetch(buildApiUrl("/auth/register"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ username, email, password }),
  });

  if (!res.ok) {
    const error = await readJsonSafely(res);
    throw new Error(error?.message || "Registration failed");
  }

  return res.json();
};

// Login (cookie will be set automatically by backend)
export const login = async (email, password) => {
  const res = await fetch(buildApiUrl("/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await readJsonSafely(res);
    throw new Error(error?.message || "Login failed");
  }

  return res.json();
};

// Get current user
export const getMe = async () => {
  const res = await fetch(buildApiUrl("/users/me"), {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Not authenticated");
  }

  return res.json();
};

export const logout = async () => {
  try {
    const res = await fetch(buildApiUrl("/auth/logout"), {
      method: "POST",
      credentials: "include",
    });
    
    if (!res.ok) {
      // Even if backend fails, clear cookie on frontend
      console.warn("Logout endpoint failed, clearing local state");
    }
    
    return res.json();
  } catch (error) {
    // If endpoint doesn't exist, still consider logout successful
    console.warn("Logout endpoint not available, clearing local state");
    return { status: "success" };
  }
};
