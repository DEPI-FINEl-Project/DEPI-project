import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { DEFAULT_BUILDER } from '../storage.js';

const CACHE_KEY = 'builderCache';
const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const writeCache = (data) => localStorage.setItem(CACHE_KEY, JSON.stringify(data));

// Loads the signed-in user's portfolio from the backend, keeps a local cache
// for instant re-renders, and exposes a save() that persists to the server.
export function usePortfolio() {
  const [data, setDataState] = useState(() => ({ ...DEFAULT_BUILDER, ...(readCache() || {}) }));
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .getPortfolio()
      .then((res) => {
        if (!active) return;
        const merged = { ...DEFAULT_BUILDER, ...res.portfolio };
        setDataState(merged);
        writeCache(merged);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const setData = useCallback((updater) => {
    setDataState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      writeCache(next);
      return next;
    });
  }, []);

  const save = useCallback(async (toSave) => {
    const payload = toSave || readCache();
    if (!payload) return;
    await api.savePortfolio(payload);
  }, []);

  return { data, setData, save, loaded, error };
}
