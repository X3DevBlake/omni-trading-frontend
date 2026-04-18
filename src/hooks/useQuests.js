import { useState, useEffect, useCallback } from "react";
import { quests as questsApi, getToken } from "../lib/api.js";

/**
 * Quest progress. Reads the shared catalog + the current user's per-quest
 * progress from the backend. Exposes increment/claim helpers.
 *
 * Returns totalXp (sum of claimed-quest rewards), which drives the Rewards
 * view's level/tier UI.
 */
export function useQuests() {
  const [state, setState] = useState({
    quests: [],
    totalXp: 0,
    loading: false,
    error: null,
    online: false,
  });

  const refresh = useCallback(async () => {
    if (!getToken()) return;
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const { quests, totalXp } = await questsApi.list();
      setState({
        quests: quests || [],
        totalXp: totalXp || 0,
        loading: false,
        error: null,
        online: true,
      });
    } catch (err) {
      setState(s => ({
        ...s,
        loading: false,
        error: err?.message || String(err),
        online: false,
      }));
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const progress = useCallback(async (id, delta = 1) => {
    await questsApi.progress(id, delta);
    await refresh();
  }, [refresh]);

  const claim = useCallback(async (id) => {
    await questsApi.claim(id);
    await refresh();
  }, [refresh]);

  return { ...state, refresh, progress, claim };
}
