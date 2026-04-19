import { useState, useEffect, useCallback } from "react";
import { watchlist as watchlistApi, getToken } from "../lib/api.js";

/**
 * Per-user watchlist. Syncs with the backend when authenticated; falls back to
 * localStorage when not.
 *
 * Returns: { favs: Set<string>, toggle, reorder, loading, error, online }
 */
const LOCAL_KEY = "omni:watchlist:local";

function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}
function saveLocal(set) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify([...set])); } catch {}
}

export function useWatchlist() {
  const [favs, setFavs] = useState(() => loadLocal());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [online, setOnline] = useState(false);

  // On mount, if we have an auth token, try loading from backend
  useEffect(() => {
    if (!getToken()) return;
    let alive = true;
    setLoading(true);
    watchlistApi.list()
      .then(({ items }) => {
        if (!alive) return;
        const ids = new Set(items.map(i => i.coinId));
        setFavs(ids);
        saveLocal(ids);
        setOnline(true);
      })
      .catch(() => { if (alive) setOnline(false); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const toggle = useCallback(async (coinId, symbol) => {
    setFavs(prev => {
      const next = new Set(prev);
      const adding = !next.has(coinId);
      if (adding) next.add(coinId);
      else next.delete(coinId);
      saveLocal(next);

      // Fire-and-forget sync with backend if we have a session
      if (getToken()) {
        (adding
          ? watchlistApi.add(coinId, symbol || coinId)
          : watchlistApi.remove(coinId)
        ).catch(err => setError(err?.message || String(err)));
      }
      return next;
    });
  }, []);

  return { favs, toggle, loading, error, online };
}
