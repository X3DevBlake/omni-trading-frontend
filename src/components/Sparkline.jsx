import React, { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { TH } from "../theme";

export function Sparkline({ coin, w = 120, h = 40 }) {
  const data = useMemo(() => {
    const arr = coin?.sparkline_in_7d?.price;
    if (!arr || !arr.length) return [];
    // Downsample to ~40 points
    const step = Math.max(1, Math.floor(arr.length / 40));
    return arr.filter((_, i) => i % step === 0).map((v, i) => ({ i, v }));
  }, [coin]);
  const up = (coin?.price_change_percentage_7d_in_currency ?? coin?.price_change_percentage_24h ?? 0) >= 0;
  const color = up ? TH.green : TH.red;
  const id = `sg-${coin?.id || Math.random()}`;
  if (!data.length) return <div style={{ width:w, height:h, opacity:0.3 }} />;
  return (
    <div style={{ width:w, height:h }}>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.7}/>
              <stop offset="100%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
            fill={`url(#${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   6. APP SHELL
   ═══════════════════════════════════════════════════════════════════════ */

export default Sparkline;
