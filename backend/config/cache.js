import { createClient } from "redis";

let client;

const getClient = async () => {
  if (client) return client;

  client = createClient({
    url: process.env.REDIS_URL || "redis://redis:6379",
  });

  client.on("error", (err) => console.error("[cache] Redis error:", err.message));

  await client.connect();
  return client;
};

export const getCache = async (key) => {
  try {
    const c = await getClient();
    const val = await c.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null; // cache miss on error — never block the request
  }
};

export const setCache = async (key, value, ttlSeconds = 60) => {
  try {
    const c = await getClient();
    await c.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (err) {
    console.error("[cache] setCache error:", err.message);
  }
};

export const delCache = async (key) => {
  try {
    const c = await getClient();
    await c.del(key);
  } catch (err) {
    console.error("[cache] delCache error:", err.message);
  }
};