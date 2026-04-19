import { useState, useEffect, useCallback, useMemo } from "react";

/**
 * sOMNI staking hook. Simulated — sOMNI is not a real deployed token.
 *
 * Mechanics:
 *   - Users stake OMNI tokens. They receive sOMNI (staked OMNI) as a receipt.
 *   - Lock tiers: Flexible (5% APR), 30d (8%), 90d (13%), 180d (20%), 365d (35%)
 *   - Rewards accrue continuously (per-second compounding)
 *   - Unstaking a locked position before expiry forfeits 50% of accrued rewards
 *   - Users start with 10,000 OMNI for simulation
 *
 * Persistence: localStorage. Per-wallet-address when connected.
 */
const KEY = "omni:staking:v1";

export const LOCK_TIERS = [
  { id: "flex",   label: "FLEXIBLE", days: 0,   apr: 0.05, multiplier: 1.0 },
  { id: "30d",    label: "30 DAYS",  days: 30,  apr: 0.08, multiplier: 1.2 },
  { id: "90d",    label: "90 DAYS",  days: 90,  apr: 0.13, multiplier: 1.5 },
  { id: "180d",   label: "180 DAYS", days: 180, apr: 0.20, multiplier: 2.0 },
  { id: "365d",   label: "1 YEAR",   days: 365, apr: 0.35, multiplier: 3.0 },
];

const DEFAULT_STATE = {
  balance: 10_000,        // OMNI balance available to stake
  positions: [],          // [{ id, amount, tierId, startedAt, unlocksAt, accrued }]
  claimedLifetime: 0,
  omniPrice: 2.87,        // simulated USD price of OMNI
};

function loadState(addressKey) {
  try {
    const raw = localStorage.getItem(KEY + ":" + addressKey);
    return raw ? JSON.parse(raw) : { ...DEFAULT_STATE };
  } catch { return { ...DEFAULT_STATE }; }
}
function saveState(addressKey, state) {
  try { localStorage.setItem(KEY + ":" + addressKey, JSON.stringify(state)); }
  catch {}
}
function makeId() {
  return "stk_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function useStaking(address) {
  // Key off wallet address so different wallets see different state
  const addressKey = address || "anonymous";
  const [state, setState] = useState(() => loadState(addressKey));

  // Reload when address changes (user connects different wallet)
  useEffect(() => {
    setState(loadState(addressKey));
  }, [addressKey]);

  // Tick every second to update accrued rewards on each open position
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Derived: positions with live accrual computed on each render
  const openPositions = useMemo(() => {
    return state.positions
      .filter(p => !p.withdrawnAt)
      .map(p => {
        const tier = LOCK_TIERS.find(t => t.id === p.tierId) || LOCK_TIERS[0];
        const elapsedMs = now - p.startedAt;
        // Continuous compounding: A = P × e^(rt)
        // but a simple linear approximation keeps numbers readable for demo
        const years = elapsedMs / (1000 * 60 * 60 * 24 * 365);
        const accrued = p.amount * tier.apr * years;
        const remainingMs = p.unlocksAt ? Math.max(0, p.unlocksAt - now) : 0;
        const isLocked = remainingMs > 0;
        return {
          ...p,
          tier,
          accrued,
          remainingMs,
          isLocked,
          canUnstake: !isLocked,
        };
      });
  }, [state.positions, now]);

  const totalStaked = useMemo(
    () => openPositions.reduce((s, p) => s + p.amount, 0),
    [openPositions]
  );

  const totalAccrued = useMemo(
    () => openPositions.reduce((s, p) => s + p.accrued, 0),
    [openPositions]
  );

  // Weighted APR across open positions
  const weightedApr = useMemo(() => {
    if (totalStaked === 0) return 0;
    return openPositions.reduce((s, p) => s + p.amount * p.tier.apr, 0) / totalStaked;
  }, [openPositions, totalStaked]);

  // Total voting power — boosted by lock multipliers
  const votingPower = useMemo(
    () => openPositions.reduce((s, p) => s + p.amount * p.tier.multiplier, 0),
    [openPositions]
  );

  const stake = useCallback((amount, tierId) => {
    const tier = LOCK_TIERS.find(t => t.id === tierId);
    if (!tier) throw new Error("Unknown lock tier");
    if (amount <= 0) throw new Error("Amount must be positive");

    setState(prev => {
      if (amount > prev.balance) throw new Error(`Insufficient balance. You have ${prev.balance.toFixed(2)} OMNI.`);
      const startedAt = Date.now();
      const unlocksAt = tier.days > 0 ? startedAt + tier.days * 86400000 : null;
      const position = {
        id: makeId(),
        amount,
        tierId,
        startedAt,
        unlocksAt,
      };
      const next = {
        ...prev,
        balance: prev.balance - amount,
        positions: [position, ...prev.positions],
      };
      saveState(addressKey, next);
      return next;
    });
  }, [addressKey]);

  const unstake = useCallback((positionId) => {
    setState(prev => {
      const positions = prev.positions.map(p => {
        if (p.id !== positionId || p.withdrawnAt) return p;
        const tier = LOCK_TIERS.find(t => t.id === p.tierId) || LOCK_TIERS[0];
        const elapsedMs = Date.now() - p.startedAt;
        const years = elapsedMs / (1000 * 60 * 60 * 24 * 365);
        const fullAccrued = p.amount * tier.apr * years;
        // Penalty if unstaking before unlock
        const isEarly = p.unlocksAt && Date.now() < p.unlocksAt;
        const rewards = isEarly ? fullAccrued * 0.5 : fullAccrued;
        return {
          ...p,
          withdrawnAt: Date.now(),
          finalRewards: rewards,
          earlyExit: !!isEarly,
        };
      });
      const pos = positions.find(p => p.id === positionId);
      if (!pos) return prev;
      const returned = pos.amount + (pos.finalRewards || 0);
      const next = {
        ...prev,
        balance: prev.balance + returned,
        positions,
        claimedLifetime: prev.claimedLifetime + (pos.finalRewards || 0),
      };
      saveState(addressKey, next);
      return next;
    });
  }, [addressKey]);

  const claimAll = useCallback(() => {
    const nowTs = Date.now();
    setState(prev => {
      let claimed = 0;
      const positions = prev.positions.map(p => {
        if (p.withdrawnAt) return p;
        const tier = LOCK_TIERS.find(t => t.id === p.tierId) || LOCK_TIERS[0];
        const elapsedMs = nowTs - p.startedAt;
        const years = elapsedMs / (1000 * 60 * 60 * 24 * 365);
        const accrued = p.amount * tier.apr * years;
        claimed += accrued;
        // Restart the accrual clock for this position
        return { ...p, startedAt: nowTs };
      });
      if (claimed <= 0) return prev;
      const next = {
        ...prev,
        balance: prev.balance + claimed,
        positions,
        claimedLifetime: prev.claimedLifetime + claimed,
      };
      saveState(addressKey, next);
      return next;
    });
  }, [addressKey]);

  // Reset (for testing / wipe)
  const reset = useCallback(() => {
    const next = { ...DEFAULT_STATE };
    saveState(addressKey, next);
    setState(next);
  }, [addressKey]);

  return {
    balance: state.balance,
    positions: openPositions,
    closedPositions: state.positions.filter(p => p.withdrawnAt),
    totalStaked,
    totalAccrued,
    weightedApr,
    votingPower,
    claimedLifetime: state.claimedLifetime,
    omniPrice: state.omniPrice,
    stake,
    unstake,
    claimAll,
    reset,
  };
}

// Helper for formatting durations
export function formatDuration(ms) {
  if (ms <= 0) return "unlocked";
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const hrs = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (days > 0) return `${days}d ${hrs}h`;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}
