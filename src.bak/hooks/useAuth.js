import { useState, useEffect, useCallback } from "react";
import { SiweMessage } from "../lib/siwe.js";
import { auth, getToken, clearToken } from "../lib/api.js";

/**
 * Handles the complete SIWE flow:
 *   1. Request nonce from backend
 *   2. Prompt user to sign a SIWE message via window.ethereum
 *   3. POST message + signature to backend
 *   4. Store JWT, expose user session
 */
export function useAuth() {
  const [state, setState] = useState({
    connecting: false,
    signingIn: false,
    user: null,
    error: null,
    hasToken: !!getToken(),
  });

  // On mount, check for an existing session token — if present, we *assume* it's
  // valid until a 401 proves otherwise. The app.js fetch wrapper auto-clears on 401.
  useEffect(() => {
    if (getToken()) setState(s => ({ ...s, hasToken: true }));
  }, []);

  const connect = useCallback(async (walletType = "injected") => {
    setState(s => ({ ...s, connecting: true, signingIn: false, error: null }));

    try {
      const eth = window.ethereum;
      if (!eth) throw new Error("No wallet detected. Install MetaMask, Coinbase Wallet, or Trust Wallet.");

      // 1. Request accounts
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      if (!accounts?.length) throw new Error("No accounts returned");
      const address = accounts[0];

      const chainIdHex = await eth.request({ method: "eth_chainId" });
      const chainId = parseInt(chainIdHex, 16);

      setState(s => ({ ...s, connecting: false, signingIn: true }));

      // 2. Get nonce from backend
      const { nonce } = await auth.nonce();

      // 3. Build SIWE message
      const domain = window.location.host;
      const origin = window.location.origin;
      const msg = new SiweMessage({
        domain,
        address,
        statement: "Sign in to Omni Trading. This does not move any funds.",
        uri: origin,
        version: "1",
        chainId,
        nonce,
        issuedAt: new Date().toISOString(),
      });
      const messageString = msg.prepareMessage();

      // 4. Request signature
      const signature = await eth.request({
        method: "personal_sign",
        params: [messageString, address],
      });

      // 5. Verify with backend → receive JWT
      const result = await auth.verify(messageString, signature);

      // 6. Store token, update state
      if (result?.token) {
        try { localStorage.setItem("omni:auth:token", result.token); } catch {}
      }
      setState({
        connecting: false,
        signingIn: false,
        user: result.user,
        error: null,
        hasToken: true,
      });
      return result.user;
    } catch (err) {
      setState(s => ({ ...s, connecting: false, signingIn: false, error: err.message || String(err) }));
      throw err;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try { await auth.logout(); } catch {}
    clearToken();
    setState({ connecting: false, signingIn: false, user: null, error: null, hasToken: false });
  }, []);

  return { ...state, connect, disconnect };
}
