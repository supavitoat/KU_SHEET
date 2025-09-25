// Simple in-memory cache utility with TTL
const caches = new Map(); // key -> { value, expires }

function setCache(key, value, ttlMs) {
  caches.set(key, { value, expires: Date.now() + ttlMs });
}

function getCache(key) {
  const item = caches.get(key);
  if (!item) return null;
  if (item.expires < Date.now()) {
    caches.delete(key);
    return null;
  }
  return item.value;
}

function clearCache(key) {
  if (key) caches.delete(key); else caches.clear();
}

module.exports = { setCache, getCache, clearCache };
