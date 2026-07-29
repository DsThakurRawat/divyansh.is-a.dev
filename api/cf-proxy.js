// Server-side fallback for the Codeforces API.
//
// The browser normally calls codeforces.com directly (it sends CORS headers),
// but that path fails often enough to matter: CF rate-limits to roughly one
// call every two seconds and answers violations with HTTP 200 + status FAILED.
// Going through here gets a different source IP and a cached response.

const ALLOWED_ENDPOINTS = new Set([
  'user.info',
  'user.status',
  'user.rating',
]);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { endpoint, ...params } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint' });
  }

  // Whitelisted so this can't be used as a general-purpose open proxy.
  if (!ALLOWED_ENDPOINTS.has(endpoint)) {
    return res.status(400).json({ error: 'Unsupported endpoint' });
  }

  const qs = new URLSearchParams(params).toString();
  const url = `https://codeforces.com/api/${endpoint}${qs ? '?' + qs : ''}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Pass CF's own failure through as a real error status so the client's
    // catch() fires instead of it silently parsing a FAILED body as success.
    if (data.status !== 'OK') {
      return res.status(502).json({ error: data.comment || 'Codeforces returned FAILED' });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(502).json({ error: 'Failed to fetch from Codeforces API' });
  }
}
