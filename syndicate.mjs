/* ============================================================
   Cross-post to dev.to from the command line.

     npm run syndicate -- <slug>              → creates a DRAFT on dev.to
     npm run syndicate -- <slug> --publish    → publishes it

   Runs locally on purpose. A /api/publish endpoint on the deployed site
   would need the API key in Vercel's env, and anything that can POST to
   it can post to the dev.to account — so the key stays on the machine
   that owns it.

   Medium is not here because it cannot be: Medium stopped issuing API
   tokens on 1 Jan 2025 and archived the API docs. Use the "Import to
   Medium" button on the post instead — its import tool sets
   rel=canonical back to the original by itself.

   Setup: export DEVTO_API_KEY=... (dev.to → Settings → Extensions → API keys)
   ============================================================ */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const SITE = 'https://divyansh.is-a.dev';
const POSTS_DIR = 'content/posts';

const args = process.argv.slice(2);
const publish = args.includes('--publish');
const slugArg = args.find((a) => !a.startsWith('--'));

if (!slugArg) {
    console.error('Usage: npm run syndicate -- <slug> [--publish]');
    process.exit(1);
}

const key = process.env.DEVTO_API_KEY;
if (!key) {
    console.error('DEVTO_API_KEY is not set.');
    console.error('  dev.to → Settings → Extensions → API keys, then:');
    console.error('  export DEVTO_API_KEY=your_key');
    process.exit(1);
}

function parseFrontmatter(raw) {
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!m) return { meta: {}, body: raw };
    const meta = {};
    for (const line of m[1].split(/\r?\n/)) {
        const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
        if (!kv) continue;
        let [, k, v] = kv;
        v = v.trim().replace(/^["'](.*)["']$/, '$1');
        if (k === 'tags') {
            meta.tags = v.replace(/^\[|\]$/g, '').split(',').map((t) => t.trim()).filter(Boolean);
        } else if (v === 'true' || v === 'false') meta[k] = v === 'true';
        else meta[k] = v;
    }
    return { meta, body: m[2] };
}

const files = await readdir(POSTS_DIR);
const file = files.find((f) => f.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '') === slugArg);
if (!file) {
    console.error(`No post matching "${slugArg}" in ${POSTS_DIR}/`);
    console.error('Available: ' + files.filter((f) => f.endsWith('.md'))
        .map((f) => f.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '')).join(', '));
    process.exit(1);
}

const { meta, body } = parseFrontmatter(await readFile(join(POSTS_DIR, file), 'utf8'));
if (meta.draft) {
    console.error(`"${slugArg}" is still a draft here. Publish it on your own site first —`);
    console.error('the canonical URL has to resolve before syndicating.');
    process.exit(1);
}

const canonical = `${SITE}/blog/${slugArg}`;
// dev.to: max 4 tags, alphanumeric only.
const tags = (meta.tags || []).map((t) => t.replace(/[^a-z0-9]/gi, '').toLowerCase())
    .filter(Boolean).slice(0, 4);

const res = await fetch('https://dev.to/api/articles', {
    method: 'POST',
    headers: { 'api-key': key, 'Content-Type': 'application/json', accept: 'application/vnd.forem.api-v1+json' },
    body: JSON.stringify({
        article: {
            title: meta.title,
            body_markdown: body.trim(),
            published: publish,
            canonical_url: canonical,
            description: meta.summary || '',
            tags,
        },
    }),
});

const data = await res.json().catch(() => ({}));
if (!res.ok) {
    console.error(`dev.to responded ${res.status}: ${data.error || JSON.stringify(data)}`);
    process.exit(1);
}

console.log(`${publish ? 'Published' : 'Created as draft'} on dev.to: ${data.url || data.id}`);
console.log(`canonical → ${canonical}`);
if (!publish) console.log('Review it there, then hit publish (or re-run with --publish).');
