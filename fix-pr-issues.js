import fs from 'fs';

const htmlFiles = ['index.html', 'about.html', 'github.html', 'projects-oss.html', 'rnd.html', 'cp.html'];

htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Fix og:image
    content = content.replace(
        '<meta property="og:image" content="https://divyansh.is-a.dev/pfp.jpeg">',
        '<meta property="og:image" content="https://divyansh.is-a.dev/assets/pfp.jpeg">'
    );

    // Remove chart.js if not cp.html
    if (file !== 'cp.html') {
        content = content.replace('<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\n', '');
        content = content.replace('    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\n', '');
    }

    // Fix stray section in github.html
    if (file === 'github.html') {
        content = content.replace('        </section>\n        </section>', '        </section>');
    }
    
    // Fix blink animation in index.html
    if (file === 'index.html') {
        content = content.replace('animation: blink 2s infinite;', 'animation: pulse 2s infinite;');
    }

    fs.writeFileSync(file, content);
    console.log(`Fixed issues in ${file}`);
});
