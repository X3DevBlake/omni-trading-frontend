import { useState, useEffect } from "react";
import { createPublicClient, http, parseAbi, formatUnits } from "viem";

/**
 * Fetches user's on-chain holdings across multiple EVM chains.
 *
 * NON-CUSTODIAL: we only read balances from the user's connected wallet.
 * No funds move to or from the platform — the Assets page is a portfolio viewer.
 *
 * Returns an array of holdings: { chain, symbol, name, amount, decimals,
 *   usdValue, logo, contractAddress }
 */

// Popular ERC-20s we check by address per chain (since we don't have an
// indexed explorer API key). We could add more here or swap to
// Alchemy/Covalent/Moralis for automatic token discovery.
const TOKEN_LISTS = {
  1: {  // Ethereum
    name: "Ethereum",
    nativeSymbol: "ETH",
    rpc: "https://eth.llamarpc.com",
    explorer: "https://etherscan.io",
    tokens: [
      { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", name: "Tether USD",  decimals: 6 },
      { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", name: "USD Coin",   decimals: 6 },
      { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI",  name: "Dai",        decimals: 18 },
      { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", symbol: "WBTC", name: "Wrapped BTC",decimals: 8 },
      { address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", symbol: "LINK", name: "Chainlink",  decimals: 18 },
      { address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", symbol: "UNI",  name: "Uniswap",    decimals: 18 },
      { address: "0xc00e94Cb662C3520282E6f5717214004A7f26888", symbol: "COMP", name: "Compound",   decimals: 18 },
      { address: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8", symbol: "PYUSD",name: "PayPal USD", decimals: 6 },
    ],
  },
  8453: {  // Base
    name: "Base",
    nativeSymbol: "ETH",
    rpc: "https://mainnet.base.org",
    explorer: "https://basescan.org",
    tokens: [
      { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC", name: "USD Coin",       decimals: 6 },
      { address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", symbol: "DAI",  name: "Dai",            decimals: 18 },
      { address: "0x4200000000000000000000000000000000000006", symbol: "WETH", name: "Wrapped Ether",  decimals: 18 },
    ],
  },
  137: {  // Polygon
    name: "Polygon",
    nativeSymbol: "MATIC",
    rpc: "https://polygon-rpc.com",
    explorer: "https://polygonscan.com",
    tokens: [
      { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", symbol: "USDT",  name: "Tether USD",    decimals: 6 },
      { address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", symbol: "USDC",  name: "USD Coin",      decimals: 6 },
      { address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", symbol: "WETH",  name: "Wrapped Ether", decimals: 18 },
    ],
  },
  42161: {  // Arbitrum
    name: "Arbitrum One",
    nativeSymbol: "ETH",
    rpc: "https://arb1.arbitrum.io/rpc",
    explorer: "https://arbiscan.io",
    tokens: [
      { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", symbol: "USDC", name: "USD Coin",  decimals: 6 },
      { address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", symbol: "USDT", name: "Tether",    decimals: 6 },
      { address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", symbol: "WBTC", name: "Wrapped BTC",decimals: 8 },
      { address: "0x912CE59144191C1204E64559FE8253a0e49E6548", symbol: "ARB",  name: "Arbitrum",  decimals: 18 },
    ],
  },
  10: {  // Optimism
    name: "Optimism",
    nativeSymbol: "ETH",
    rpc: "https://mainnet.optimism.io",
    explorer: "https://optimistic.etherscan.io",
    tokens: [
      { address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", symbol: "USDC", name: "USD Coin", decimals: 6 },
      { address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", symbol: "USDT", name: "Tether",    decimals: 6 },
      { address: "0x4200000000000000000000000000000000000042", symbol: "OP",   name: "Optimism", decimals: 18 },
    ],
  },
  11155111: {  // Sepolia testnet
    name: "Sepolia",
    nativeSymbol: "ETH",
    rpc: "https://ethereum-sepolia-rpc.publicnode.com",
    explorer: "https://sepolia.etherscan.io",
    testnet: true,
    tokens: [
      { address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", symbol: "WETH", name: "Wrapped Ether", decimals: 18 },
      { address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", symbol: "USDC", name: "USD Coin (Circle testnet)", decimals: 6 },
      { address: "0x779877A7B0D9E8603169DdbD7836e478b4624789", symbol: "LINK", name: "Chainlink",     decimals: 18 },
    ],
  },
};

const ERC20_ABI = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
]);

// Gets a rough USD price from CoinGecko's "simple price" endpoint, keyed by symbol
async function getPrices(symbols) {
  // Map known symbols → CoinGecko IDs
  const idMap = {
    ETH: "ethereum",      MATIC: "matic-network", BTC: "bitcoin",
    USDT: "tether",        USDC: "usd-coin",       DAI: "dai",
    WETH: "weth",         WBTC: "wrapped-bitcoin",
    LINK: "chainlink",     UNI: "uniswap",          COMP: "compound-governance-token",
    PYUSD: "paypal-usd",  ARB: "arbitrum",         OP: "optimism",
  };
  const ids = symbols
    .map(s => idMap[s.toUpperCase()])
    .filter(Boolean);
  if (!ids.length) return {};
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${[...new Set(ids)].join(",")}&vs_currencies=usd`;
    const res = await fetch(url);
    if (!res.ok) return {};
    const data = await res.json();
    // Map back to symbol
    const bySymbol = {};
    for (const [sym, id] of Object.entries(idMap)) {
      if (data[id]?.usd != null) bySymbol[sym] = data[id].usd;
    }
    return bySymbol;
  } catch (_) {
    return {};
  }
}

export function useOnchainHoldings(address, chainIds = [1, 8453, 137, 42161, 10]) {
  const [state, setState] = useState({
    holdings: [], loading: false, error: null, totalUsd: 0,
  });

  useEffect(() => {
    if (!address) return;
    let alive = true;

    (async () => {
      setState(s => ({ ...s, loading: true, error: null }));
      try {
        const allHoldings = [];

        // Fetch balances across all chains in parallel
        await Promise.all(chainIds.map(async (chainId) => {
          const cfg = TOKEN_LISTS[chainId];
          if (!cfg) return;
          let client;
          try {
            client = createPublicClient({
              chain: { id: chainId, name: cfg.name, rpcUrls: { default: { http: [cfg.rpc] } },
                       nativeCurrency: { name: cfg.nativeSymbol, symbol: cfg.nativeSymbol, decimals: 18 } },
              transport: http(cfg.rpc),
            });
          } catch (_) { return; }

          // Native balance
          try {
            const nativeWei = await client.getBalance({ address });
            const nativeAmount = Number(formatUnits(nativeWei, 18));
            if (nativeAmount > 0) {
              allHoldings.push({
                chain: cfg.name,
                chainId,
                explorer: cfg.explorer,
                symbol: cfg.nativeSymbol,
                name: cfg.name + " Native",
                amount: nativeAmount,
                decimals: 18,
                contractAddress: null,
                isNative: true,
                testnet: !!cfg.testnet,
              });
            }
          } catch (_) {}

          // ERC-20 balances (parallel)
          await Promise.all(cfg.tokens.map(async (tok) => {
            try {
              const raw = await client.readContract({
                address: tok.address,
                abi: ERC20_ABI,
                functionName: "balanceOf",
                args: [address],
              });
              if (raw > 0n) {
                allHoldings.push({
                  chain: cfg.name,
                  chainId,
                  explorer: cfg.explorer,
                  symbol: tok.symbol,
                  name: tok.name,
                  amount: Number(formatUnits(raw, tok.decimals)),
                  decimals: tok.decimals,
                  contractAddress: tok.address,
                  isNative: false,
                  testnet: !!cfg.testnet,
                });
              }
            } catch (_) {}
          }));
        }));

        if (!alive) return;

        // Fetch USD prices
        const symbols = [...new Set(allHoldings.map(h => h.symbol))];
        const prices = await getPrices(symbols);

        const withPrices = allHoldings.map(h => {
          const price = prices[h.symbol] || 0;
          return { ...h, price, usdValue: price * h.amount };
        });

        // Sort: by USD value desc (non-testnet first), then testnet last
        withPrices.sort((a, b) => {
          if (a.testnet !== b.testnet) return a.testnet ? 1 : -1;
          return (b.usdValue || 0) - (a.usdValue || 0);
        });

        const totalUsd = withPrices.reduce((s, h) => s + (h.usdValue || 0), 0);

        setState({ holdings: withPrices, totalUsd, loading: false, error: null });
      } catch (err) {
        if (alive) setState(s => ({ ...s, loading: false, error: err?.message || String(err) }));
      }
    })();

    return () => { alive = false; };
  }, [address, chainIds.join(",")]);

  return state;
}
