export async function fetchWithTimeout(url, opts = {}, ms = 9000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    return r;
  } finally {
    clearTimeout(timer);
  }
}
