import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import cfProxy from './api/cf-proxy.js';
import lcProxy from './api/lc-proxy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());

// cleanUrls: true in vercel.json — serve /blog/slug as blog/slug.html here too.
app.use(express.static(__dirname, { extensions: ['html'] }));

app.get('/api/cf-proxy', async (req, res) => {
    try {
        await cfProxy(req, res);
    } catch (e) {
        console.error(e);
        if (!res.headersSent) res.status(500).json({ error: e.message });
    }
});

app.get('/api/lc-proxy', async (req, res) => {
    try {
        await lcProxy(req, res);
    } catch (e) {
        console.error(e);
        if (!res.headersSent) res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Development server running at http://localhost:${PORT}`);
});
