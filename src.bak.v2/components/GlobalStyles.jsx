import React from "react";

export const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
    *{box-sizing:border-box}
    html,body,#root{margin:0;padding:0;background:${TH.bg};color:${TH.text};font-family:${TH.font};overflow-x:hidden;scroll-behavior:smooth}
    ::-webkit-scrollbar{width:8px;height:8px}
    ::-webkit-scrollbar-track{background:rgba(0,0,0,0.3)}
    ::-webkit-scrollbar-thumb{background:linear-gradient(180deg,${TH.cyan},${TH.magenta});border-radius:4px}
    ::selection{background:${TH.cyan};color:#000}

    /* ── Core keyframes ─────────────────────────────────────────── */
    @keyframes omniPulse{0%,100%{filter:drop-shadow(0 0 18px ${TH.cyan}) drop-shadow(0 0 38px ${TH.magenta})}50%{filter:drop-shadow(0 0 28px ${TH.magenta}) drop-shadow(0 0 58px ${TH.cyan})}}
    @keyframes gradShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
    @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
    @keyframes flicker{0%,100%{opacity:1}50%{opacity:0.92}}
    @keyframes shimmer{0%{background-position:-200px 0}100%{background-position:calc(200px + 100%) 0}}

    /* ── Landing / entrance animations ──────────────────────────── */
    @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes scaleIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}
    @keyframes slideRight{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:translateX(0)}}
    @keyframes slideLeft{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
    @keyframes floatSlow{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-8px) rotate(2deg)}}
    @keyframes glowPulse{0%,100%{box-shadow:0 0 20px rgba(124,200,255,0.3),0 0 40px rgba(124,200,255,0.15)}50%{box-shadow:0 0 32px rgba(176,137,255,0.4),0 0 64px rgba(124,200,255,0.3)}}
    @keyframes ringRotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes warpPulse{0%,100%{opacity:0.5;transform:scaleY(1)}50%{opacity:1;transform:scaleY(1.15)}}
    @keyframes scrollHint{0%{transform:translateY(0);opacity:0}40%{opacity:1}80%{transform:translateY(14px);opacity:0}100%{opacity:0}}
    @keyframes navGlow{0%,100%{box-shadow:0 0 0 rgba(124,200,255,0)}50%{box-shadow:inset 3px 0 0 ${TH.cyan},0 0 24px rgba(124,200,255,0.25)}}
    @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
    @keyframes gridSweep{0%{background-position:0 0}100%{background-position:80px 80px}}
    @keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.55;transform:scale(1.35)}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes priceFlashUp{0%{background:rgba(74,222,160,0.32)}100%{background:transparent}}
    @keyframes priceFlashDn{0%{background:rgba(255,106,133,0.32)}100%{background:transparent}}
    @keyframes arrowPop{0%{transform:translateY(0) scale(0.5);opacity:0}30%{transform:translateY(-6px) scale(1.3);opacity:1}100%{transform:translateY(-10px) scale(0.9);opacity:0}}
    @keyframes priceBounceUp{0%{transform:translateY(4px) scale(0.95);background:rgba(74,222,160,0.32)}40%{transform:translateY(-3px) scale(1.06)}100%{transform:translateY(0) scale(1);background:transparent}}
    @keyframes priceBounceDn{0%{transform:translateY(-4px) scale(0.95);background:rgba(255,106,133,0.32)}40%{transform:translateY(3px) scale(1.06)}100%{transform:translateY(0) scale(1);background:transparent}}
    .live-price{padding:3px 10px;margin:-3px -10px;border-radius:6px;font-weight:700;position:relative;transition:background 0.3s ease,box-shadow 0.3s ease}
    .live-price.flash-up{animation:priceBounceUp 1.2s cubic-bezier(0.2,0.8,0.2,1) both;background:linear-gradient(90deg,rgba(74,222,160,0.18),rgba(74,222,160,0.06));box-shadow:inset 0 0 0 1px rgba(74,222,160,0.35),0 0 20px rgba(74,222,160,0.25)}
    .live-price.flash-down{animation:priceBounceDn 1.2s cubic-bezier(0.2,0.8,0.2,1) both;background:linear-gradient(90deg,rgba(255,106,133,0.18),rgba(255,106,133,0.06));box-shadow:inset 0 0 0 1px rgba(255,106,133,0.35),0 0 20px rgba(255,106,133,0.25)}

    /* ── Utility classes ────────────────────────────────────────── */
    .omni-title{font-family:${TH.display};font-weight:900;letter-spacing:0.22em;background:linear-gradient(90deg,${TH.cyan},${TH.magenta},${TH.gold},${TH.cyan});background-size:300% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:gradShift 6s ease infinite}
    .hero-title{font-family:${TH.display};font-weight:900;letter-spacing:0.04em;background:linear-gradient(120deg,#fff 0%,${TH.cyan} 40%,${TH.magenta} 70%,${TH.gold} 100%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:gradShift 8s ease infinite}
    .glass{background:${TH.panel};backdrop-filter:blur(16px) saturate(180%);-webkit-backdrop-filter:blur(16px) saturate(180%);border:1px solid ${TH.border}}
    .glass-hi{background:rgba(12,20,40,0.82);backdrop-filter:blur(20px) saturate(200%);-webkit-backdrop-filter:blur(20px) saturate(200%);border:1px solid ${TH.borderStrong}}
    .glass-card{background:linear-gradient(145deg,rgba(12,20,40,0.7),rgba(6,10,24,0.85));backdrop-filter:blur(18px) saturate(180%);-webkit-backdrop-filter:blur(18px) saturate(180%);border:1px solid ${TH.border};transition:all 0.35s cubic-bezier(0.2,0.8,0.2,1);position:relative;overflow:hidden}
    .glass-card::before{content:"";position:absolute;inset:0;background:linear-gradient(145deg,rgba(124,200,255,0.08),transparent 40%,rgba(176,137,255,0.06));opacity:0;transition:opacity 0.35s ease;pointer-events:none}
    .glass-card:hover{transform:translateY(-4px);border-color:${TH.borderStrong};box-shadow:0 14px 44px rgba(124,200,255,0.15),0 0 0 1px rgba(124,200,255,0.3)}
    .glass-card:hover::before{opacity:1}
    .btn-neon{background:linear-gradient(135deg,rgba(124,200,255,0.14),rgba(176,137,255,0.14));border:1px solid ${TH.borderStrong};color:${TH.text};font-family:${TH.display};font-weight:700;letter-spacing:0.08em;transition:all 0.25s cubic-bezier(0.2,0.8,0.2,1);cursor:pointer;position:relative;overflow:hidden}
    .btn-neon::after{content:"";position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);transition:left 0.6s ease}
    .btn-neon:hover{background:linear-gradient(135deg,rgba(124,200,255,0.28),rgba(176,137,255,0.28));box-shadow:0 0 24px rgba(124,200,255,0.3),inset 0 0 16px rgba(176,137,255,0.18);transform:translateY(-1px)}
    .btn-neon:hover::after{left:100%}
    .btn-primary{background:linear-gradient(135deg,${TH.cyan},${TH.magenta});border:none;color:#000;font-family:${TH.display};font-weight:900;letter-spacing:0.1em;transition:all 0.25s cubic-bezier(0.2,0.8,0.2,1);cursor:pointer;box-shadow:0 4px 20px rgba(124,200,255,0.4);position:relative;overflow:hidden}
    .btn-primary::after{content:"";position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent);transition:left 0.6s ease}
    .btn-primary:hover{transform:translateY(-2px);box-shadow:0 6px 28px rgba(124,200,255,0.6),0 0 40px rgba(176,137,255,0.4)}
    .btn-primary:hover::after{left:100%}
    .btn-ghost{background:transparent;border:1px solid ${TH.border};color:${TH.text};font-family:${TH.display};font-weight:700;letter-spacing:0.08em;transition:all 0.2s;cursor:pointer}
    .btn-ghost:hover{border-color:${TH.cyan};color:${TH.cyan};background:rgba(124,200,255,0.06)}
    .shimmer{background:linear-gradient(90deg,rgba(124,200,255,0.04) 0%,rgba(124,200,255,0.16) 50%,rgba(124,200,255,0.04) 100%);background-size:200px 100%;animation:shimmer 1.6s linear infinite}
    input,select{font-family:${TH.font}}
    input:focus,select:focus{outline:none;border-color:${TH.cyan};box-shadow:0 0 0 2px rgba(124,200,255,0.25)}

    /* ── Landing helpers ────────────────────────────────────────── */
    .anim-fadeUp{animation:fadeUp 0.9s cubic-bezier(0.2,0.8,0.2,1) both}
    .anim-fadeIn{animation:fadeIn 1.2s ease both}
    .anim-scaleIn{animation:scaleIn 0.8s cubic-bezier(0.2,0.8,0.2,1) both}
    .anim-slideR{animation:slideRight 0.8s cubic-bezier(0.2,0.8,0.2,1) both}
    .anim-slideL{animation:slideLeft 0.8s cubic-bezier(0.2,0.8,0.2,1) both}
    .anim-float{animation:float 6s ease-in-out infinite}
    .anim-floatSlow{animation:floatSlow 9s ease-in-out infinite}
    .anim-glow{animation:glowPulse 3.5s ease-in-out infinite}
    .delay-1{animation-delay:0.1s}.delay-2{animation-delay:0.25s}.delay-3{animation-delay:0.4s}.delay-4{animation-delay:0.55s}.delay-5{animation-delay:0.7s}.delay-6{animation-delay:0.85s}.delay-7{animation-delay:1s}

    .hero-grid{background-image:linear-gradient(rgba(124,200,255,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(124,200,255,0.06) 1px,transparent 1px);background-size:80px 80px;animation:gridSweep 24s linear infinite}
    .hero-glow-orb{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none;opacity:0.55;animation:float 12s ease-in-out infinite}

    /* ── Sidebar nav ────────────────────────────────────────────── */
    .nav-item{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:10px;color:${TH.dim};font-family:${TH.display};font-size:12px;font-weight:700;letter-spacing:0.12em;cursor:pointer;transition:all 0.25s cubic-bezier(0.2,0.8,0.2,1);position:relative;border:1px solid transparent;background:transparent}
    .nav-item::before{content:"";position:absolute;left:0;top:20%;bottom:20%;width:3px;border-radius:0 2px 2px 0;background:linear-gradient(180deg,${TH.cyan},${TH.magenta});transform:scaleY(0);transform-origin:center;transition:transform 0.3s cubic-bezier(0.2,0.8,0.2,1)}
    .nav-item:hover{color:${TH.text};background:rgba(124,200,255,0.05);transform:translateX(3px)}
    .nav-item:hover::before{transform:scaleY(1)}
    .nav-item.active{color:${TH.cyan};background:linear-gradient(90deg,rgba(124,200,255,0.14),rgba(176,137,255,0.06) 60%,transparent);border-color:rgba(124,200,255,0.28);box-shadow:inset 0 0 24px rgba(124,200,255,0.08)}
    .nav-item.active::before{transform:scaleY(1);box-shadow:0 0 12px ${TH.cyan}}
    .nav-item .ico{width:18px;height:18px;flex-shrink:0;transition:transform 0.3s cubic-bezier(0.2,0.8,0.2,1)}
    .nav-item:hover .ico{transform:scale(1.15)}
    .nav-item.active .ico{filter:drop-shadow(0 0 6px ${TH.cyan})}
    .nav-badge{margin-left:auto;font-family:${TH.mono};font-size:9px;padding:2px 7px;border-radius:999px;background:linear-gradient(135deg,${TH.gold},${TH.magenta});color:#000;font-weight:700;letter-spacing:0.05em}

    /* ── Top bar pill ───────────────────────────────────────────── */
    .pill{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;background:rgba(0,0,0,0.4);border:1px solid ${TH.border};font-family:${TH.mono};font-size:10px;letter-spacing:0.1em}
    .status-dot{width:8px;height:8px;border-radius:50%;animation:flicker 1.6s ease-in-out infinite}

    /* Marquee */
    .ticker-track{display:flex;animation:tickerScroll 50s linear infinite;will-change:transform}
    .ticker-track:hover{animation-play-state:paused}
    @media (prefers-reduced-motion: reduce){
      *{animation-duration:0.001s !important;animation-iteration-count:1 !important;transition-duration:0.001s !important}
    }
  `}</style>
);

/* ═══════════════════════════════════════════════════════════════════════
   1. THE NEW OMNI LOGO — "Infinite Gyrosphere"
   Concept: 6 interlocking rings on every axis (hence "omni") surrounding
   a pulsing plasma core, with orbital particles tracing infinity patterns.
   ═══════════════════════════════════════════════════════════════════════ */

export default GlobalStyles;
