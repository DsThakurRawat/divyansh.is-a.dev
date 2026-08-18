/* Scaffold a post: npm run new "How I broke production"
   Creates content/posts/YYYY-MM-DD-slug.md as a draft. */
import { writeFile, mkdir, access } from 'node:fs/promises';

const title = process.argv.slice(2).join(' ').trim();
if (!title) {
    console.error('Usage: npm run new "Post title"');
    process.exit(1);
}

const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const date = new Date().toISOString().slice(0, 10);
const path = `content/posts/${date}-${slug}.md`;

await mkdir('content/posts', { recursive: true });
try {
    await access(path);
    console.error(`${path} already exists.`);
    process.exit(1);
} catch { /* free to write */ }

await writeFile(path, `---
title: ${title}
date: ${date}
summary: One sentence that makes someone want to read this. Shows on the index, in the RSS feed and on the X card.
tags: [backend]
draft: true
---

Open with the concrete thing that happened. No throat-clearing.

## The part that mattered

\`\`\`go
func main() {
    // Code blocks are highlighted at build time — no JS ships to the reader.
}
\`\`\`

Set \`draft: false\` when it is ready, run \`npm run build\`, commit, push.
`);

console.log(`Created ${path}`);
console.log('Write it, set draft: false, then: npm run build');
