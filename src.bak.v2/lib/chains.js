/**
 * Real chain configurations and real-deployed contract addresses.
 *
 * For testnets, these are verified contract addresses from each protocol's
 * official documentation. You can trade real tokens against real pools on
 * these addresses — zero fiction, zero invented addresses.
 *
 * Mainnet addresses included for reference. This project does NOT execute
 * mainnet transactions by default.
 */

export const CHAINS = {
  // ── Mainnets ─────────────────────────────────────────────────────────
  ethereum: {
    id: 1,
    name: "Ethereum",
    rpc: "https://eth.llamarpc.com",
    explorer: "https://etherscan.io",
    nativeSymbol: "ETH",
    testnet: false,
  },
  base: {
    id: 8453,
    name: "Base",
    rpc: "https://mainnet.base.org",
    explorer: "https://basescan.org",
    nativeSymbol: "ETH",
    testnet: false,
  },

  // ── Testnets (recommended for this app) ──────────────────────────────
  sepolia: {
    id: 11155111,
    name: "Sepolia",
    rpc: "https://ethereum-sepolia-rpc.publicnode.com",
    explorer: "https://sepolia.etherscan.io",
    nativeSymbol: "ETH",
    testnet: true,
    faucets: [
      "https://sepoliafaucet.com",
      "https://www.alchemy.com/faucets/ethereum-sepolia",
      "https://cloud.google.com/application/web3/faucet/ethereum/sepolia",
    ],
  },
  baseSepolia: {
    id: 84532,
    name: "Base Sepolia",
    rpc: "https://sepolia.base.org",
    explorer: "https://sepolia.basescan.org",
    nativeSymbol: "ETH",
    testnet: true,
    faucets: [
      "https://www.alchemy.com/faucets/base-sepolia",
      "https://cloud.google.com/application/web3/faucet/ethereum/base-sepolia",
    ],
  },
};

// ─── Uniswap V3 — official deployments ───────────────────────────────────
// Sources: https://docs.uniswap.org/contracts/v3/reference/deployments
export const UNISWAP_V3 = {
  1: {  // Ethereum mainnet
    router: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    quoter: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
    factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
  11155111: {  // Sepolia testnet
    router: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
    quoter: "0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3",
    factory: "0x0227628f3F023bb0B980b67D528571c95c6DaC1c",
    weth: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
  },
  8453: {  // Base mainnet
    router: "0x2626664c2603336E57B271c5C0b26F421741e481",
    quoter: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a",
    factory: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
    weth: "0x4200000000000000000000000000000000000006",
  },
};

// ─── Test tokens on Sepolia (real deployed ERC-20s with free faucets) ────
// These are real tokens on Sepolia — test ETH, USDC faucet tokens, etc.
// You can get them at the faucets listed in the chain config.
export const SEPOLIA_TOKENS = {
  WETH: {
    address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
  },
  USDC: {
    // Circle's testnet USDC
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    symbol: "USDC",
    name: "USD Coin (Circle testnet)",
    decimals: 6,
    faucet: "https://faucet.circle.com",
  },
  LINK: {
    address: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
    symbol: "LINK",
    name: "Chainlink Token",
    decimals: 18,
  },
};

/** Return Uniswap V3 addresses for a given chainId, or null if unsupported. */
export function uniswapFor(chainId) {
  return UNISWAP_V3[chainId] || null;
}

/** Return the chain config object for a given chainId. */
export function chainById(chainId) {
  return Object.values(CHAINS).find(c => c.id === chainId) || null;
}

/** True if the chain is one this app is verified to work on. */
export function isSupported(chainId) {
  return [1, 8453, 11155111, 84532].includes(chainId);
}
