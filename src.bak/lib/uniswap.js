/**
 * Real Uniswap V3 swap helper.
 *
 * Executes actual on-chain swaps through the deployed Uniswap V3 router.
 * This is real web3 — approvals, quotes, and swaps all hit real contracts.
 * Set chainId to 11155111 (Sepolia) for zero-risk testing with testnet ETH.
 *
 * USAGE:
 *   const qty = parseUnits("0.01", 18);           // 0.01 WETH
 *   const quote = await quoteSwap({
 *     chainId: 11155111,
 *     tokenIn:  SEPOLIA_TOKENS.WETH.address,
 *     tokenOut: SEPOLIA_TOKENS.USDC.address,
 *     amountIn: qty,
 *     fee: 3000,
 *   });
 *   const tx = await executeSwap({ ...quote, walletClient, account });
 */

import {
  createPublicClient, createWalletClient, custom, http,
  encodeFunctionData, parseAbi,
} from "viem";
import { uniswapFor, chainById } from "./chains.js";

// ─── Minimal ABIs (we only need a few functions, not the full ABI) ──────
const QUOTER_ABI = parseAbi([
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) returns (uint256)",
]);

const ROUTER_ABI = parseAbi([
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256)",
]);

const ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]);

// ─── Public client (read-only) ───────────────────────────────────────────
function getPublicClient(chainId) {
  const chain = chainById(chainId);
  if (!chain) throw new Error(`Unsupported chain ${chainId}`);
  return createPublicClient({
    chain: {
      id: chain.id,
      name: chain.name,
      rpcUrls: { default: { http: [chain.rpc] } },
      nativeCurrency: { name: chain.nativeSymbol, symbol: chain.nativeSymbol, decimals: 18 },
    },
    transport: http(chain.rpc),
  });
}

/**
 * Get a quote for a potential swap (read-only, no signature).
 * Returns { amountOut: bigint } for the best-case output amount.
 */
export async function quoteSwap({ chainId, tokenIn, tokenOut, amountIn, fee = 3000 }) {
  const uni = uniswapFor(chainId);
  if (!uni) throw new Error(`No Uniswap V3 deployment on chain ${chainId}`);

  const client = getPublicClient(chainId);
  try {
    const amountOut = await client.readContract({
      address: uni.quoter,
      abi: QUOTER_ABI,
      functionName: "quoteExactInputSingle",
      args: [tokenIn, tokenOut, fee, amountIn, 0n],
    });
    return { amountOut, tokenIn, tokenOut, amountIn, fee, chainId };
  } catch (err) {
    throw new Error(`Quote failed: ${err?.shortMessage || err?.message || String(err)}`);
  }
}

/**
 * Check ERC-20 allowance. If the current allowance is less than `amount`,
 * the caller needs to call `approveToken` before swapping.
 */
export async function checkAllowance({ chainId, token, owner }) {
  const uni = uniswapFor(chainId);
  const client = getPublicClient(chainId);
  return client.readContract({
    address: token,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [owner, uni.router],
  });
}

/**
 * Approve the router to spend `amount` of `token`.
 * Uses window.ethereum via viem's custom transport.
 */
export async function approveToken({ chainId, token, amount, account }) {
  const uni = uniswapFor(chainId);
  if (!window.ethereum) throw new Error("No wallet detected");

  const wallet = createWalletClient({
    account, chain: { id: chainId }, transport: custom(window.ethereum),
  });

  const data = encodeFunctionData({
    abi: ERC20_ABI, functionName: "approve", args: [uni.router, amount],
  });

  const hash = await wallet.sendTransaction({ to: token, data });
  return hash;
}

/**
 * Execute a swap via Uniswap V3 SwapRouter.exactInputSingle.
 * Requires allowance to already be set.
 *
 * @param {object} p
 * @param {number} p.chainId
 * @param {string} p.tokenIn  - address
 * @param {string} p.tokenOut - address
 * @param {bigint} p.amountIn
 * @param {bigint} p.amountOutMinimum - set below the quote to define slippage tolerance
 * @param {number} p.fee - pool fee tier (500, 3000, 10000)
 * @param {string} p.account - signing address
 * @param {number} [p.deadlineSecs=600] - deadline from now
 */
export async function executeSwap({
  chainId, tokenIn, tokenOut, amountIn, amountOutMinimum, fee = 3000,
  account, deadlineSecs = 600,
}) {
  const uni = uniswapFor(chainId);
  if (!window.ethereum) throw new Error("No wallet detected");

  const wallet = createWalletClient({
    account, chain: { id: chainId }, transport: custom(window.ethereum),
  });

  const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineSecs);

  const params = {
    tokenIn,
    tokenOut,
    fee,
    recipient: account,
    deadline,
    amountIn,
    amountOutMinimum,
    sqrtPriceLimitX96: 0n,
  };

  const data = encodeFunctionData({
    abi: ROUTER_ABI, functionName: "exactInputSingle", args: [params],
  });

  const hash = await wallet.sendTransaction({ to: uni.router, data });
  return hash;
}

/**
 * Get the on-chain ERC-20 balance of a token for an owner.
 */
export async function getTokenBalance({ chainId, token, owner }) {
  const client = getPublicClient(chainId);
  const [balance, decimals, symbol] = await Promise.all([
    client.readContract({ address: token, abi: ERC20_ABI, functionName: "balanceOf", args: [owner] }),
    client.readContract({ address: token, abi: ERC20_ABI, functionName: "decimals" }),
    client.readContract({ address: token, abi: ERC20_ABI, functionName: "symbol" }).catch(() => "???"),
  ]);
  return { balance, decimals, symbol };
}

/** Get native ETH balance for address. */
export async function getNativeBalance({ chainId, owner }) {
  const client = getPublicClient(chainId);
  const balance = await client.getBalance({ address: owner });
  return balance;
}

/**
 * Calculate amountOutMinimum from a quote + slippage tolerance.
 * slippage is a fraction (e.g. 0.005 for 0.5%).
 */
export function withSlippage(amountOut, slippage) {
  const bps = BigInt(Math.round((1 - slippage) * 10_000));
  return (amountOut * bps) / 10_000n;
}
