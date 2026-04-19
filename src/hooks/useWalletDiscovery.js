import { useState, useEffect } from "react";

/**
 * EIP-6963 Multi Injected Provider Discovery.
 * https://eips.ethereum.org/EIPS/eip-6963
 *
 * Each installed wallet announces itself via `eip6963:announceProvider` events.
 * We collect them into a list so the user can pick specifically which wallet to use.
 * This replaces the old single-wallet `window.ethereum` approach which becomes
 * ambiguous when multiple wallets are installed.
 *
 * Returns: [{ info: { uuid, name, icon, rdns }, provider: EIP1193Provider }, ...]
 */
export function useWalletDiscovery() {
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    const onAnnounce = (event) => {
      const detail = event.detail;
      if (!detail?.info || !detail?.provider) return;
      setProviders(prev => {
        // Dedupe by UUID
        if (prev.find(p => p.info.uuid === detail.info.uuid)) return prev;
        return [...prev, detail];
      });
    };

    window.addEventListener("eip6963:announceProvider", onAnnounce);
    // Ask all installed wallets to announce themselves
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    // Fallback: legacy window.ethereum for wallets that haven't adopted 6963 yet
    const legacyTimer = setTimeout(() => {
      if (typeof window.ethereum !== "undefined") {
        const eth = window.ethereum;
        setProviders(prev => {
          // Don't duplicate if this same provider already announced via 6963
          if (prev.find(p => p.provider === eth)) return prev;
          return [
            ...prev,
            {
              info: {
                uuid: "legacy-ethereum",
                name: eth.isMetaMask ? "MetaMask"
                  : eth.isCoinbaseWallet ? "Coinbase Wallet"
                  : eth.isTrust ? "Trust Wallet"
                  : eth.isRabby ? "Rabby"
                  : eth.isBraveWallet ? "Brave Wallet"
                  : "Browser Wallet",
                icon: "",
                rdns: "legacy",
              },
              provider: eth,
            },
          ];
        });
      }
    }, 500);

    return () => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      clearTimeout(legacyTimer);
    };
  }, []);

  return providers;
}

/**
 * WalletConnect-compatible wallets (mobile apps) that don't inject providers.
 * Shown in the UI as "Mobile" options — tapping them opens the wallet's
 * deep link. Real WalletConnect integration would need a project ID.
 */
export const MOBILE_WALLETS = [
  { id: "walletconnect", name: "WalletConnect", description: "300+ mobile wallets", icon: "🔗" },
  { id: "trust",         name: "Trust Wallet",  description: "Mobile wallet app",  icon: "🛡️" },
  { id: "rainbow",       name: "Rainbow",       description: "Mobile wallet app",  icon: "🌈" },
  { id: "argent",        name: "Argent",        description: "Smart wallet",        icon: "🔷" },
  { id: "phantom",       name: "Phantom",       description: "Solana + EVM",        icon: "👻" },
];
