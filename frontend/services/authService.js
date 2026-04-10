const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Register
export const register = async (username, email, password) => {
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ username, email, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Registration failed");
  }

  return res.json();
};

// Login (cookie will be set automatically by backend)
export const login = async (email, password) => {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Login failed");
  }

  return res.json();
};

// Get current user
export const getMe = async () => {
  const res = await fetch(`${API}/users/me`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Not authenticated");
  }

  return res.json();
};

export const logout = async () => {
  try {
    const res = await fetch(`${API}/auth/logout`, {
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