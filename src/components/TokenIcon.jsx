import { TH } from "../theme";
import React, { useState } from "react";
import { INLINE_SVGS } from "../lib/svgIcons";

export function TokenIcon({ coin, size = 32 }) {
  const [stage, setStage] = useState(0);
  if (!coin) return null;
  const sym = (coin.symbol || "").toLowerCase();
  const symUpper = sym.toUpperCase().slice(0, 4);

  // STAGE 0: Inline SVG — zero network dependency, guaranteed to render.
  // This covers the top 25 coins by market cap, which is basically every coin
  // anyone will look at. No fetch, no CDN, no CORS, no cache. Impossible to fail.
  if (stage === 0 && INLINE_SVGS[sym]) {
    // Strip any existing width/height attrs, then add our sized ones
    const sized = INLINE_SVGS[sym]
      .replace(/<svg([^>]*)>/, (m, attrs) => {
        const clean = attrs.replace(/\s*(width|height)="[^"]*"/g, "");
        return `<svg${clean} width="${size}" height="${size}" style="display:block">`;
      });
    return (
      <div
        style={{
          width:size, height:size, borderRadius:"50%",
          overflow:"hidden",
          boxShadow:`0 0 ${size*0.35}px rgba(124,200,255,0.18)`,
          background:"#0a1020",
          flexShrink:0,
          display:"inline-flex", alignItems:"center", justifyContent:"center",
          lineHeight:0,
        }}
        dangerouslySetInnerHTML={{ __html: sized }}
      />
    );
  }

  // Network fallback cascade for coins beyond the inline 25
  const sources = [];
  if (sym) sources.push(svgUrlSpot(sym));
  if (sym) sources.push(svgUrlCfont(sym));
  if (coin.image) sources.push(coin.image);
  if (sym) sources.push(pngUrlSpot(sym));

  // If inline failed or didn't have this sym, start at the network sources (stage - 1 since stage 0 was inline)
  const networkStage = INLINE_SVGS[sym] ? stage - 1 : stage;
  const src = sources[networkStage];

  if (!src) {
    // Final fallback: gradient letter circle
    return (
      <div style={{
        width:size, height:size, borderRadius:"50%",
        background:`linear-gradient(135deg,${TH.cyan},${TH.magenta})`,
        display:"flex", alignItems:"center", justifyContent:"center",
        color:"#000", fontWeight:900, fontSize:size*0.34,
        fontFamily:TH.display, boxShadow:`0 0 ${size*0.3}px rgba(124,200,255,0.4)`,
        flexShrink:0,
      }}>{symUpper.slice(0, 3)}</div>
    );
  }

  return (
    <img
      key={`${sym}-${stage}`}
      src={src}
      alt={coin.name || symUpper}
      onError={() => setStage(s => s + 1)}
      loading="lazy"
      style={{
        width:size, height:size, borderRadius:"50%",
        boxShadow:`0 0 ${size*0.4}px rgba(124,200,255,0.22)`,
        background:"#0a1020",
        objectFit:"cover",
        flexShrink:0,
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   5. SPARKLINE — uses real sparkline_in_7d data
   ═══════════════════════════════════════════════════════════════════════ */

export default TokenIcon;
