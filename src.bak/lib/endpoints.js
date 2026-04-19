export const CG_URL = "https://api.coingecko.com/api/v3/coins/markets" +
  "?vs_currency=usd&order=market_cap_desc&per_page=250&page=1" +
  "&sparkline=true&price_change_percentage=1h%2C24h%2C7d";
// Simple price-only fallback endpoint (smaller, more likely to succeed on throttling)

export const CG_URL_PRICES = "https://api.coingecko.com/api/v3/coins/markets" +
  "?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false";
// CryptoCompare fallback — returns top coins with prices

export const CC_URL = "https://min-api.cryptocompare.com/data/top/mktcapfull?limit=100&tsym=USD";

// Stable CDN icon URL for a symbol (jsDelivr-hosted open-source icon pack)
// ── Icon CDNs — all return SVG with full CORS ─────────────────────────────
// Primary: spothq/cryptocurrency-icons via npm (SVG color variants, 2,000+ coins)

export const svgUrlSpot  = (sym) => `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/${sym}.svg`;
// Secondary: Cryptofonts/cryptoicons (newer coins like sui, apt, pepe, wif, jup, bonk, tao, etc.)

export const svgUrlCfont = (sym) => `https://cdn.jsdelivr.net/gh/Cryptofonts/cryptoicons@master/SVG/${sym}.svg`;
// Tertiary: PNG fallback for edge cases where SVG is missing

export const pngUrlSpot  = (sym) => `https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/${sym}.png`;

export const iconUrl = (sym) => sym ? svgUrlSpot(sym.toLowerCase()) : null;

// ── INLINE SVG MAP — top 25 coins embedded directly. Zero network dependency.

export const LIVE_PAIRS = [
  "BTC-USD", "ETH-USD", "SOL-USD", "XRP-USD", "DOGE-USD",
  "ADA-USD", "AVAX-USD", "LINK-USD", "LTC-USD", "BCH-USD",
  "DOT-USD", "MATIC-USD", "UNI-USD", "ATOM-USD", "NEAR-USD",
  "APT-USD", "ARB-USD", "OP-USD", "SUI-USD", "SHIB-USD",
];

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Attempt one fetch with timeout


// Convert a CryptoCompare top-mktcap response into the CoinGecko shape
// that the rest of the app expects.
