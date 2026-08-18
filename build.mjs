/* ============================================================
   Static blog generator.

   Reads content/posts/*.md, writes blog/*.html, feed.xml and
   sitemap.xml. Output is committed to the repo, so Vercel keeps
   deploying a plain static site with no build step of its own and
   the pages still work opened straight off disk.

   Run: npm run build      (after editing or adding a post)
   New: npm run new "Post title"
   ============================================================ */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { marked } from 'marked';
import hljs from 'highlight.js';

const SITE = {
    url: 'https://divyansh.is-a.dev',
    title: 'Divyansh Rawat',
    author: 'Divyansh Rawat',
    x: 'DsThakurRawat',
    blogName: 'Writing',
    blogDesc: 'Notes on backend systems, agentic AI and the things I ship.',
    image: '/assets/pfp.jpeg?v=3',
};

const POSTS_DIR = 'content/posts';
const OUT_DIR = 'blog';
const WPM = 220;                     // reading-time divisor

/* ---------- tiny helpers ---------- */

const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const slugify = (s) => String(s).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// 2026-08-18 -> "18 Aug 2026". Parsed as UTC so the printed day never
// shifts with the machine's timezone.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(iso) {
    const d = new Date(iso + 'T00:00:00Z');
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
const rfc822 = (iso) => new Date(iso + 'T09:00:00Z').toUTCString();

/* ---------- frontmatter ----------
   Deliberately small: `key: value`, plus `[a, b]` or `a, b` for tags.
   Anything fancier belongs in the body, not the header. */
function parseFrontmatter(raw) {
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!m) return { meta: {}, body: raw };
    const meta = {};
    for (const line of m[1].split(/\r?\n/)) {
        const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
        if (!kv) continue;
        let [, key, val] = kv;
        val = val.trim().replace(/^["'](.*)["']$/, '$1');
        if (key === 'tags') {
            meta.tags = val.replace(/^\[|\]$/g, '').split(',')
                .map((t) => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
        } else if (val === 'true' || val === 'false') {
            meta[key] = val === 'true';
        } else {
            meta[key] = val;
        }
    }
    return { meta, body: m[2] };
}

/* ---------- markdown ---------- */

const usedIds = new Set();
function headingId(text) {
    let id = slugify(text) || 'section';
    let n = 2;
    while (usedIds.has(id)) id = `${slugify(text)}-${n++}`;
    usedIds.add(id);
    return id;
}

marked.use({
    renderer: {
        // Highlighted at build time, so the reader downloads zero JS for it.
        code(token) {
            const lang = (token.lang || '').split(/\s+/)[0];
            const known = lang && hljs.getLanguage(lang);
            const html = known
                ? hljs.highlight(token.text, { language: lang }).value
                : esc(token.text);
            const label = known ? `<span class="code-lang">${esc(lang)}</span>` : '';
            return `<div class="code-wrap">${label}` +
                `<button class="code-copy" type="button" aria-label="Copy code">Copy</button>` +
                `<pre><code class="hljs${known ? ' language-' + esc(lang) : ''}">${html}</code></pre></div>\n`;
        },
        heading(token) {
            const inner = this.parser.parseInline(token.tokens);
            const id = headingId(token.text);
            const d = token.depth;
            return `<h${d} id="${id}">${inner}` +
                `<a class="anchor" href="#${id}" aria-label="Link to this section">#</a></h${d}>\n`;
        },
        // Off-site links open in a new tab; in-page anchors must not.
        link(token) {
            const href = token.href || '';
            const inner = this.parser.parseInline(token.tokens);
            const ext = /^https?:\/\//i.test(href) && !href.startsWith(SITE.url);
            const attrs = ext ? ' target="_blank" rel="noopener"' : '';
            const title = token.title ? ` title="${esc(token.title)}"` : '';
            return `<a href="${esc(href)}"${title}${attrs}>${inner}</a>`;
        },
        image(token) {
            const title = token.title ? ` title="${esc(token.title)}"` : '';
            return `<img src="${esc(token.href)}" alt="${esc(token.text)}"${title} loading="lazy" decoding="async">`;
        },
    },
});

/* ---------- page shell ---------- */

function head({ title, desc, canonical, ogType = 'website', jsonld, robots }) {
    return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <link rel="canonical" href="${esc(canonical)}">
    <meta name="description" content="${esc(desc)}">
    <meta name="author" content="${esc(SITE.author)}">
${robots ? `    <meta name="robots" content="${esc(robots)}">\n` : ''}    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(desc)}">
    <meta property="og:url" content="${esc(canonical)}">
    <meta property="og:type" content="${ogType}">
    <meta property="og:image" content="${SITE.url}${SITE.image}">
    <meta property="og:site_name" content="${esc(SITE.title)}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:site" content="@${SITE.x}">
    <meta name="twitter:creator" content="@${SITE.x}">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(desc)}">
    <meta name="twitter:image" content="${SITE.url}${SITE.image}">
    <meta name="theme-color" content="#0e0e10">
    <link rel="icon" type="image/jpeg" href="/assets/pfp.jpeg?v=3">
    <link rel="alternate" type="application/rss+xml" title="${esc(SITE.title)} — ${esc(SITE.blogName)}" href="/feed.xml">

    <!-- Prevent theme flash: set theme before paint -->
    <script>
        (function () {
            try {
                var saved = localStorage.getItem('theme');
                document.documentElement.setAttribute('data-theme', saved || 'dark');
            } catch (e) {}
        })();
    </script>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/styles.css?v=10">
${jsonld ? `    <script type="application/ld+json">\n${jsonld}\n    </script>\n` : ''}</head>
<body>
    <header class="topbar">
        <div class="topbar-inner">
            <nav class="nav" aria-label="Section navigation">
                <a href="/">Home</a>
                <a href="/#work"><span class="nav-full">Featured Work</span><span class="nav-short">Work</span></a>
                <a href="/#rnd"><span class="nav-full">Research &amp; Development</span><span class="nav-short">R&amp;D</span></a>
                <a href="/blog" class="active">Writing</a>
            </nav>
            <button id="theme-toggle" class="theme-toggle" type="button" aria-label="Toggle color theme" title="Toggle theme">
                <svg class="icon-sun" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
                <svg class="icon-moon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
            </button>
        </div>
    </header>
`;
}

const foot = (scripts) => `
    <footer class="footer">
        <p>© ${new Date().getUTCFullYear()} ${esc(SITE.author)} · <a href="/feed.xml">RSS</a> · Hand-written HTML, no framework.</p>
    </footer>
${scripts}</body>
</html>
`;

/* ---------- post page ---------- */

function postPage(post, prev, next) {
    const canonical = `${SITE.url}/blog/${post.slug}`;
    const jsonld = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.summary,
        datePublished: post.date,
        dateModified: post.updated || post.date,
        author: { '@type': 'Person', name: SITE.author, url: SITE.url + '/' },
        publisher: { '@type': 'Person', name: SITE.author, url: SITE.url + '/' },
        mainEntityOfPage: canonical,
        url: canonical,
        image: SITE.url + SITE.image,
        keywords: (post.tags || []).join(', '),
        wordCount: post.words,
    }, null, 2).split('\n').map((l) => '    ' + l).join('\n');

    const shareText = encodeURIComponent(`${post.title}\n\n${canonical}`);
    const tags = (post.tags || []).length
        ? `<span class="tags">${post.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</span>`
        : '';

    return head({
        title: `${post.title} — ${SITE.author}`,
        desc: post.summary,
        canonical: post.canonical || canonical,
        ogType: 'article',
        jsonld,
        robots: post.draft ? 'noindex, nofollow' : '',
    }) + `
    <main class="wrap post-wrap">
        <article class="post">
            <header class="post-head">
                <a class="post-back" href="/blog">← Writing</a>
                <h1 class="post-title">${esc(post.title)}</h1>
                <p class="post-meta">
                    <time datetime="${post.date}">${fmtDate(post.date)}</time>
                    <span class="dot-sep">·</span>${post.minutes} min read
                    ${post.updated ? `<span class="dot-sep">·</span>updated ${fmtDate(post.updated)}` : ''}
                    ${tags}
                </p>
                ${post.draft ? '<p class="post-draft">Draft — not listed or indexed.</p>' : ''}
                <div class="post-tools">
                    <button class="tool-btn" id="speedread" type="button">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 3 14h8l-1 8 10-12h-8z"/></svg>
                        Speed read
                    </button>
                    <span class="tool-hint">${post.words.toLocaleString()} words</span>
                </div>
            </header>

            <div class="post-body">
${post.html}
            </div>

            <footer class="post-foot">
                <div class="post-share">
                    <span class="share-label">Share</span>
                    <a href="https://x.com/intent/post?text=${shareText}" target="_blank" rel="noopener">Post on X</a>
                    <a href="https://news.ycombinator.com/submitlink?u=${encodeURIComponent(canonical)}&t=${encodeURIComponent(post.title)}" target="_blank" rel="noopener">Hacker News</a>
                    <button class="link-btn" id="copy-link" type="button" data-url="${esc(canonical)}">Copy link</button>
                </div>
                <div class="post-syndicate">
                    <span class="share-label">Republish</span>
                    <!-- Medium closed its publishing API to new integrations on
                         1 Jan 2025, so this copies the canonical URL and opens
                         Medium's import tool, which sets rel=canonical back here
                         automatically. -->
                    <button class="link-btn" id="to-medium" type="button" data-url="${esc(canonical)}">Import to Medium</button>
                    <a href="https://dev.to/new" target="_blank" rel="noopener">dev.to</a>
                </div>
            </footer>
        </article>

        <nav class="post-nav" aria-label="More posts">
            ${prev ? `<a class="post-nav-item" href="/blog/${prev.slug}"><span>Previous</span>${esc(prev.title)}</a>` : '<span></span>'}
            ${next ? `<a class="post-nav-item post-nav-next" href="/blog/${next.slug}"><span>Next</span>${esc(next.title)}</a>` : '<span></span>'}
        </nav>
    </main>

    <div class="read-progress" id="read-progress" aria-hidden="true"></div>
` + foot('    <script src="/site.js?v=1"></script>\n    <script src="/blog.js?v=1"></script>\n');
}

/* ---------- index page ---------- */

function indexPage(posts) {
    const canonical = `${SITE.url}/blog`;
    const jsonld = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: `${SITE.author} — ${SITE.blogName}`,
        description: SITE.blogDesc,
        url: canonical,
        author: { '@type': 'Person', name: SITE.author, url: SITE.url + '/' },
        blogPost: posts.map((p) => ({
            '@type': 'BlogPosting',
            headline: p.title,
            datePublished: p.date,
            url: `${SITE.url}/blog/${p.slug}`,
        })),
    }, null, 2).split('\n').map((l) => '    ' + l).join('\n');

    const rows = posts.map((p) => `                <li class="post-row">
                    <a class="post-row-link" href="/blog/${p.slug}">
                        <time class="post-row-date" datetime="${p.date}">${fmtDate(p.date)}</time>
                        <span class="post-row-body">
                            <span class="post-row-title">${esc(p.title)}</span>
                            <span class="post-row-sum">${esc(p.summary)}</span>
                            <span class="post-row-meta">${p.minutes} min${(p.tags || []).length ? ' · ' + p.tags.map(esc).join(' · ') : ''}</span>
                        </span>
                    </a>
                </li>`).join('\n');

    const empty = `                <li class="post-row"><p class="post-empty">Nothing published yet. The first one is being written.</p></li>`;

    return head({
        title: `${SITE.blogName} — ${SITE.author}`,
        desc: SITE.blogDesc,
        canonical,
        jsonld,
    }) + `
    <main class="wrap">
        <section class="section blog-hero">
            <h1 class="blog-title">${SITE.blogName}</h1>
            <p class="blog-lede">${esc(SITE.blogDesc)} <a href="/feed.xml">RSS</a>.</p>
        </section>

        <section class="section">
            <ul class="post-list">
${posts.length ? rows : empty}
            </ul>
        </section>
    </main>
` + foot('    <script src="/site.js?v=1"></script>\n');
}

/* ---------- feeds ---------- */

function rss(posts) {
    const items = posts.map((p) => `        <item>
            <title>${esc(p.title)}</title>
            <link>${SITE.url}/blog/${p.slug}</link>
            <guid isPermaLink="true">${SITE.url}/blog/${p.slug}</guid>
            <pubDate>${rfc822(p.date)}</pubDate>
            <description>${esc(p.summary)}</description>
            <content:encoded><![CDATA[${p.html.replace(/]]>/g, ']]&gt;')}]]></content:encoded>
${(p.tags || []).map((t) => `            <category>${esc(t)}</category>`).join('\n')}
        </item>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>${esc(SITE.author)} — ${esc(SITE.blogName)}</title>
        <link>${SITE.url}/blog</link>
        <atom:link href="${SITE.url}/feed.xml" rel="self" type="application/rss+xml"/>
        <description>${esc(SITE.blogDesc)}</description>
        <language>en</language>
${items}
    </channel>
</rss>
`;
}

function sitemap(posts) {
    const urls = [
        { loc: `${SITE.url}/`, freq: 'monthly', pri: '1.0' },
        { loc: `${SITE.url}/blog`, freq: 'weekly', pri: '0.8' },
        ...posts.map((p) => ({ loc: `${SITE.url}/blog/${p.slug}`, freq: 'yearly', pri: '0.7', mod: p.updated || p.date })),
    ];
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>${u.mod ? `\n    <lastmod>${u.mod}</lastmod>` : ''}
    <changefreq>${u.freq}</changefreq>
    <priority>${u.pri}</priority>
  </url>`).join('\n')}
</urlset>
`;
}

/* ---------- run ---------- */

async function main() {
    await mkdir(OUT_DIR, { recursive: true });
    let files = [];
    try {
        files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith('.md'));
    } catch {
        console.error(`No ${POSTS_DIR}/ directory — nothing to build.`);
    }

    const all = [];
    for (const file of files) {
        const raw = await readFile(join(POSTS_DIR, file), 'utf8');
        const { meta, body } = parseFrontmatter(raw);
        if (!meta.title || !meta.date) {
            console.warn(`  skipped ${file}: needs both title and date in frontmatter`);
            continue;
        }
        usedIds.clear();
        const html = marked.parse(body).trim();
        // Reading time and the word count shown on the page both ignore code
        // blocks — nobody reads a config dump at prose speed.
        const prose = body.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ');
        const words = (prose.match(/[A-Za-z0-9'’-]+/g) || []).length;

        all.push({
            slug: meta.slug || slugify(basename(file, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '')),
            title: meta.title,
            date: meta.date,
            updated: meta.updated || '',
            summary: meta.summary || '',
            tags: meta.tags || [],
            draft: !!meta.draft,
            canonical: meta.canonical || '',
            html: html.split('\n').map((l) => '                ' + l).join('\n'),
            words,
            minutes: Math.max(1, Math.round(words / WPM)),
        });
    }

    all.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const live = all.filter((p) => !p.draft);

    // Prev/next walk the published list so a draft never becomes a dead end.
    for (const post of all) {
        const i = live.findIndex((p) => p.slug === post.slug);
        const prev = i >= 0 ? live[i + 1] : null;   // older
        const next = i > 0 ? live[i - 1] : null;    // newer
        await writeFile(join(OUT_DIR, `${post.slug}.html`), postPage(post, prev, next));
    }

    await writeFile(join(OUT_DIR, 'index.html'), indexPage(live));
    await writeFile('feed.xml', rss(live));
    await writeFile('sitemap.xml', sitemap(live));

    const drafts = all.length - live.length;
    console.log(`Built ${live.length} post${live.length === 1 ? '' : 's'}` +
        `${drafts ? ` (+${drafts} draft${drafts === 1 ? '' : 's'}, noindex)` : ''} ` +
        `→ ${OUT_DIR}/, feed.xml, sitemap.xml`);
    for (const p of all) console.log(`  ${p.draft ? 'draft ' : '      '}/blog/${p.slug}  ${p.minutes} min`);
}

main().catch((e) => { console.error(e); process.exit(1); });
