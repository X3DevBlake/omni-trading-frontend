import { useState, useEffect, useCallback } from "react";
import { preferences as prefsApi, getToken } from "../lib/api.js";

const DEFAULT_PREFS = {
  theme: "default",
  defaultView: "markets",
  defaultPair: "BTC-USD",
  showPortfolioBalances: true,
  notificationsEnabled: true,
  reducedMotion: false,
};

/**
 * Per-user preferences — hydrates from backend when authenticated, falls
 * back to defaults (and localStorage cache) when not.
 */
const LOCAL_KEY = "omni:preferences:local";

export function usePreferences() {
  const [prefs, setPrefs] = useState(() => {
    try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}") }; }
    catch { return DEFAULT_PREFS; }
  });
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(false);

  // Pull from backend when token is available
  useEffect(() => {
    if (!getToken()) return;
    let alive = true;
    setLoading(true);
    prefsApi.get()
      .then(({ preferences }) => {
        if (!alive) return;
        setPrefs(p => ({ ...p, ...preferences }));
        try { localStorage.setItem(LOCAL_KEY, JSON.stringify(preferences)); } catch {}
        setOnline(true);
      })
      .catch(() => { if (alive) setOnline(false); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const update = useCallback(async (patch) => {
    setPrefs(p => {
      const next = { ...p, ...patch };
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    if (getToken()) {
      try {
        await prefsApi.update(patch);
        setOnline(true);
      } catch (_) { setOnline(false); }
    }
  }, []);

  return { prefs, update, loading, online };
}
