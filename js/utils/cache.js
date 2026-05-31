/**
 * DEVOS — CACHE.JS
 * In-memory + localStorage cache with TTL.
 */

window.DevOS = window.DevOS || {};

window.DevOS.Cache = (function () {
  const MEM = {};
  const PREFIX = 'devos_';

  /**
   * Set value in memory and localStorage.
   * @param {string} key
   * @param {*} value
   * @param {number} ttl - milliseconds
   */
  function set(key, value, ttl) {
    const entry = { value, expires: Date.now() + (ttl || 0) };
    MEM[key] = entry;
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(entry));
    } catch (e) {
      // localStorage full or unavailable — memory only
    }
  }

  /**
   * Get cached value. Returns null if expired or missing.
   * @param {string} key
   * @returns {*|null}
   */
  function get(key) {
    // 1. Check memory first
    if (MEM[key]) {
      if (Date.now() < MEM[key].expires) {
        return MEM[key].value;
      }
      delete MEM[key];
    }
    // 2. Fallback to localStorage
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (Date.now() < entry.expires) {
        MEM[key] = entry; // Re-populate memory
        return entry.value;
      }
      localStorage.removeItem(PREFIX + key);
    } catch (e) {
      // Parse error or unavailable
    }
    return null;
  }

  /**
   * Delete a specific key from cache.
   * @param {string} key
   */
  function remove(key) {
    delete MEM[key];
    try { localStorage.removeItem(PREFIX + key); } catch (e) {}
  }

  /**
   * Clear all DevOS cache entries from localStorage.
   */
  function clearAll() {
    Object.keys(MEM).forEach(k => delete MEM[k]);
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX))
        .forEach(k => localStorage.removeItem(k));
    } catch (e) {}
  }

  /**
   * Check if key exists and is still valid.
   * @param {string} key
   * @returns {boolean}
   */
  function has(key) {
    return get(key) !== null;
  }

  return { set, get, remove, clearAll, has };
})();
