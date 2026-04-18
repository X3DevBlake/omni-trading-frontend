export const fmtUsd = n => {
  if (n == null || isNaN(n)) return "—";
  if (n >= 1e12) return "$" + (n/1e12).toFixed(2) + "T";
  if (n >= 1e9)  return "$" + (n/1e9).toFixed(2) + "B";
  if (n >= 1e6)  return "$" + (n/1e6).toFixed(2) + "M";
  if (n >= 1e3)  return "$" + (n/1e3).toFixed(2) + "K";
  if (n >= 1)    return "$" + n.toFixed(2);
  if (n >= 0.01) return "$" + n.toFixed(4);
  return "$" + n.toFixed(8);
};

export const fmtNum = n => {
  if (n == null || isNaN(n)) return "—";
  if (n >= 1e12) return (n/1e12).toFixed(2) + "T";
  if (n >= 1e9)  return (n/1e9).toFixed(2) + "B";
  if (n >= 1e6)  return (n/1e6).toFixed(2) + "M";
  if (n >= 1e3)  return (n/1e3).toFixed(2) + "K";
  return n.toFixed(2);
};

export const fmtPct = n => (n == null || isNaN(n)) ? "—" : (n>=0?"+":"") + n.toFixed(2) + "%";

/* ──── FONTS + GLOBAL STYLES ─────────────────────────────────────────── */
