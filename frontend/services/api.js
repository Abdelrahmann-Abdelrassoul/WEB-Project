const DEFAULT_API_BASE = "http://localhost:5000/api/v1";

const normalizeApiBase = (value) => {
  if (!value) {
    return DEFAULT_API_BASE;
  }

  const trimmedValue = value.trim().replace(/\/+$/, "");

  if (!trimmedValue) {
    return DEFAULT_API_BASE;
  }

  return trimmedValue.endsWith("/api/v1")
    ? trimmedValue
    : `${trimmedValue}/api/v1`;
};

export const API_BASE = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);

export const buildApiUrl = (path = "") => {
  if (!path) {
    return API_BASE;
  }

  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
};

export const readJsonSafely = async (response) => response.json().catch(() => null);
