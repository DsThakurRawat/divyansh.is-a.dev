export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // Cache 1 hour

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { handle, endpoint } = req.query;

  if (!handle || !endpoint) {
    return res.status(400).json({ error: 'Missing handle or endpoint' });
  }

  try {
    const response = await fetch(`https://codeforces.com/api/${endpoint}?handle=${handle}`);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch from Codeforces API' });
  }
}
