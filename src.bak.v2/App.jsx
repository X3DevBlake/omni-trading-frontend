import React, { useState, useCallback } from "react";
import { AppHeader } from "./components/AppHeader";
import { Footer } from "./components/Footer";
import { GlobalStyles } from "./components/GlobalStyles";
import { SettingsModal } from "./components/SettingsModal";
import { Sidebar } from "./components/Sidebar";
import { SpaceBackground } from "./components/SpaceBackground";
import { TickerStrip } from "./components/TickerStrip";
import { WalletModal } from "./components/WalletModal";
import { useCoinGecko } from "./hooks/useCoinGecko";
import { useLiveTicker } from "./hooks/useLiveTicker";
import { useMergedCoins } from "./hooks/useMergedCoins";
import { BuyCryptoView } from "./views/BuyCryptoView";
import { FarmsView } from "./views/FarmsView";
import { FuturesView } from "./views/FuturesView";
import { LandingPage } from "./views/LandingPage";
import { LiquidityView } from "./views/LiquidityView";
import { MarketsView } from "./views/MarketsView";
import { PortfolioView } from "./views/PortfolioView";
import { RewardsView } from "./views/RewardsView";
import { SpotView } from "./views/SpotView";
import { SwapView } from "./views/SwapView";

export function App() {
  const [view, setView] = useState("landing");
  const [walletOpen, setWalletOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [warp, setWarp] = useState(0);
  const [appTransition, setAppTransition] = useState(false);
  const { coins: restCoins, status, lastUpdate, refresh } = useCoinGecko();
  const { tick, wsStatus } = useLiveTicker();
  const coins = useMergedCoins(restCoins, tick);

  const top = coins.slice(0, 5);
  const onLanding = view === "landing";

  // Smooth warp burst when entering the app from landing
  const enterApp = useCallback((target = "markets") => {
    setWarp(1);
    setAppTransition(true);
    // Short warp burst, then ease back
    setTimeout(() => setWarp(0.15), 900);
    setTimeout(() => setWarp(0), 1800);
    setTimeout(() => {
      setView(target);
      setAppTransition(false);
    }, 950);
  }, []);

  const goHome = useCallback(() => {
    setView("landing");
    setWarp(0);
  }, []);

  // Nav change with micro warp pulse
  const handleSetView = useCallback((v) => {
    if (v === view) return;
    setWarp(0.35);
    setTimeout(() => setWarp(0), 600);
    setView(v);
    setMobileNavOpen(false);
  }, [view]);

  return (
    <div style={{ minHeight:"100vh", position:"relative" }}>
      <GlobalStyles />
      <SpaceBackground warp={warp} />

      {/* Subtle scanline overlay for texture */}
      <div style={{
        position:"fixed", inset:0, pointerEvents:"none", zIndex:1,
        background:"repeating-linear-gradient(0deg,rgba(124,200,255,0.015) 0px,rgba(124,200,255,0.015) 1px,transparent 1px,transparent 3px)",
        mixBlendMode:"overlay",
      }} />

      {onLanding ? (
        <LandingPage
          onEnter={enterApp}
          onConnect={() => setWalletOpen(true)}
          coins={coins}
          connected={connected}
          account={account}
          status={status}
        />
      ) : (
        <div style={{
          position:"relative", zIndex:2,
          display:"flex", minHeight:"100vh",
          opacity: appTransition ? 0 : 1,
          transition:"opacity 0.5s ease",
        }}>
          <Sidebar
            view={view}
            setView={handleSetView}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(v => !v)}
            onHome={goHome}
            mobileOpen={mobileNavOpen}
            onMobileClose={() => setMobileNavOpen(false)}
          />

          <div style={{
            flex:1, minWidth:0,
            marginLeft: sidebarCollapsed ? 78 : 248,
            transition:"margin-left 0.35s cubic-bezier(0.2,0.8,0.2,1)",
          }} className="responsive-main">
            <AppHeader
              view={view}
              connected={connected}
              account={account}
              onConnect={() => setWalletOpen(true)}
              onDisconnect={() => { setConnected(false); setAccount(null); }}
              onOpenSettings={() => setSettingsOpen(true)}
              status={status}
              wsStatus={wsStatus}
              lastUpdate={lastUpdate}
              refresh={refresh}
              onOpenMobileNav={() => setMobileNavOpen(true)}
            />

            <TickerStrip coins={top} />

            <main style={{ maxWidth:1600, margin:"0 auto", padding:"24px 28px 80px" }}>
              <div key={view} className="anim-fadeUp">
                {view === "markets" && <MarketsView coins={coins} status={status}
                  onOpenCoin={c => { setSelectedCoin(c); handleSetView("spot"); }} />}
                {view === "swap" && <SwapView coins={coins} account={account} />}
                {view === "spot" && <SpotView coins={coins} selectedCoin={selectedCoin} setSelectedCoin={setSelectedCoin} />}
                {view === "futures" && <FuturesView coins={coins} />}
                {view === "liquidity" && <LiquidityView coins={coins} />}
                {view === "farms" && <FarmsView coins={coins} />}
                {view === "portfolio" && <PortfolioView coins={coins} connected={connected} />}
                {view === "buy" && <BuyCryptoView coins={coins} />}
                {view === "rewards" && <RewardsView />}
              </div>
            </main>

            <Footer />
          </div>
        </div>
      )}

      {walletOpen && (
        <WalletModal
          onClose={() => setWalletOpen(false)}
          onConnect={accountData => {
            setConnected(true);
            setAccount(accountData);
            setWalletOpen(false);
          }}
        />
      )}

      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}

      <style>{`
        @media (max-width: 900px){
          .responsive-main{margin-left:0 !important}
          .sidebar-desktop{display:none !important}
        }
        @media (min-width: 901px){
          .sidebar-mobile-only{display:none !important}
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   LANDING PAGE — cinematic hero + feature highlights + live preview
   ══════════════════════════════════════════════════════════════════════ */

export default App;
