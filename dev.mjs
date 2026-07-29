import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import lcProxy from './api/lc-proxy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());

app.use(express.static(__dirname));

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
