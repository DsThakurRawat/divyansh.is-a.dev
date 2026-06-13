export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { handle } = req.query;

  if (!handle) {
    return res.status(400).json({ error: 'Missing handle' });
  }

  try {
    const response = await fetch(`https://github.com/users/${handle}/contributions`);
    if (!response.ok) {
      throw new Error(`Failed to fetch from GitHub: ${response.statusText}`);
    }
    let html = await response.text();
    
    // Fix relative links (like year selectors) to point to github.com
    html = html.replace(/href="\//g, 'href="https://github.com/');
    html = html.replace(/action="\//g, 'action="https://github.com/');
    
    // We only want the content inside the yearly contributions
    return res.status(200).send(html);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
