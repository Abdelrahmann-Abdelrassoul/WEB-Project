import { buildApiUrl, readJsonSafely } from "./api.js";

const buildRequestError = (payload, fallbackMessage, status) => {
  const error = new Error(payload?.message || fallbackMessage);
  error.status = status;
  return error;
};

const requestAdminResource = async (path, fallbackMessage) => {
  const response = await fetch(buildApiUrl(path), {
    credentials: "include",
    cache: "no-store",
  });

  const payload = await readJsonSafely(response);

  if (!response.ok) {
    throw buildRequestError(payload, fallbackMessage, response.status);
  }

  return payload;
};

export const getAdminStats = async () => {
  const payload = await requestAdminResource("/admin/stats", "Unable to load admin statistics");
  return payload?.data?.stats ?? null;
};

export const getAdminHealth = async () => {
  const payload = await requestAdminResource("/admin/health", "Unable to load system health");
  return payload?.data ?? null;
};
