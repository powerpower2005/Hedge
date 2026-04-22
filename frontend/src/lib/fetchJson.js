export async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/**
 * @param {string} url
 * @returns {Promise<object | null>}
 */
export async function fetchJsonAllow404(url) {
  if (!url) return null;
  const r = await fetch(url);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
