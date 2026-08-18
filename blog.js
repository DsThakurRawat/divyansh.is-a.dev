/* ============================================================
   Post-page behaviour.
   Reading progress · copy code · copy link · Medium import ·
   speed reader (RSVP)
   Loaded only on /blog/* — the homepage's live-stats polling in
   main.js has no business running here.
   ============================================================ */
(function () {
    'use strict';

    var body = document.querySelector('.post-body');

    /* ---------- Reading progress ---------- */
    var bar = document.getElementById('read-progress');
    if (bar && body) {
        var tick = function () {
            var start = body.offsetTop;
            var span = body.offsetHeight - window.innerHeight;
            var pct = span > 0 ? (window.scrollY - start) / span : 1;
            bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, pct)) + ')';
        };
        window.addEventListener('scroll', tick, { passive: true });
        window.addEventListener('resize', tick, { passive: true });
        tick();
    }

    /* ---------- Copy helpers ---------- */
    // navigator.clipboard needs a secure context; file:// and plain http
    // don't get one, so keep the textarea path as a fallback.
    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        }
        return new Promise(function (resolve, reject) {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy') ? resolve() : reject(); }
            catch (e) { reject(e); }
            document.body.removeChild(ta);
        });
    }

    function flash(btn, msg) {
        var old = btn.getAttribute('data-label') || btn.textContent;
        btn.setAttribute('data-label', old);
        btn.textContent = msg;
        btn.classList.add('ok');
        setTimeout(function () {
            btn.textContent = old;
            btn.classList.remove('ok');
        }, 1600);
    }

    document.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest('.code-copy');
        if (!btn) return;
        var code = btn.parentElement.querySelector('code');
        if (!code) return;
        copyText(code.textContent).then(function () { flash(btn, 'Copied'); },
                                        function () { flash(btn, 'Press ⌘C'); });
    });

    var copyLink = document.getElementById('copy-link');
    if (copyLink) {
        copyLink.addEventListener('click', function () {
            copyText(copyLink.getAttribute('data-url')).then(
                function () { flash(copyLink, 'Copied'); },
                function () { flash(copyLink, 'Copy failed'); });
        });
    }

    /* ---------- Medium ----------
       Medium stopped issuing API tokens on 1 Jan 2025, so there is no
       supported way to POST a story. Its import tool is the sanctioned
       path and it sets rel=canonical back to this page by itself, which
       is what actually matters for search. Copy the URL, open import,
       paste. */
    var toMedium = document.getElementById('to-medium');
    if (toMedium) {
        toMedium.addEventListener('click', function () {
            var url = toMedium.getAttribute('data-url');
            copyText(url).then(function () { flash(toMedium, 'URL copied — paste it'); },
                               function () {})
                .then(function () {
                    window.open('https://medium.com/p/import?url=' + encodeURIComponent(url),
                                '_blank', 'noopener');
                });
        });
    }

    /* ============================================================
       Speed reader (RSVP)

       One word at a time, fixed at the eye's focus point so it never
       has to travel. The pivot letter is offset the way Spritz does it
       and tinted, because the eye lands slightly left of centre.
       ============================================================ */

    var srBtn = document.getElementById('speedread');
    if (!srBtn || !body) return;

    var WPM_MIN = 150, WPM_MAX = 900, WPM_STEP = 25;
    var wpm = 400;
    try {
        var saved = parseInt(localStorage.getItem('sr-wpm'), 10);
        if (saved >= WPM_MIN && saved <= WPM_MAX) wpm = saved;
    } catch (e) {}

    // Prose only. Code blocks are skipped outright: nobody reads a config
    // dump one token at a time, and they wreck the pacing.
    function collect() {
        var out = [];
        var nodes = body.querySelectorAll('p, h2, h3, h4, li, blockquote');
        Array.prototype.forEach.call(nodes, function (el) {
            if (el.closest('.code-wrap, pre, figure')) return;
            var clone = el.cloneNode(true);
            Array.prototype.forEach.call(clone.querySelectorAll('.anchor, .code-wrap, pre'),
                function (n) { n.remove(); });
            var text = (clone.textContent || '').replace(/\s+/g, ' ').trim();
            if (!text) return;
            var heading = /^H[234]$/.test(el.tagName);
            text.split(' ').forEach(function (w, i) {
                out.push({ w: w, head: heading, first: i === 0 });
            });
        });
        return out;
    }

    var words = collect();
    if (!words.length) { srBtn.disabled = true; return; }

    // Spritz-style pivot: roughly a third in, clamped, so long words stay put.
    function pivotIndex(w) {
        var n = w.length;
        if (n <= 1) return 0;
        if (n <= 5) return 1;
        if (n <= 9) return 2;
        if (n <= 13) return 3;
        return 4;
    }

    // Punctuation and headings earn extra time; the pause is what makes it
    // legible instead of a blur.
    function delayFor(item) {
        var base = 60000 / wpm;
        var w = item.w, mult = 1;
        if (/[.!?…]["')\]]?$/.test(w)) mult = 2.2;
        else if (/[,;:—-]$/.test(w)) mult = 1.6;
        else if (w.length > 8) mult = 1.25;
        if (item.head) mult *= 1.3;
        if (item.first && item.head) mult *= 1.8;
        return base * mult;
    }

    var overlay, wordEl, idx = 0, playing = false, timer = null, lastFocus = null;

    function build() {
        overlay = document.createElement('div');
        overlay.className = 'sr-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Speed reader');
        overlay.innerHTML =
            '<div class="sr-panel">' +
              '<button class="sr-close" type="button" aria-label="Close speed reader">Esc ✕</button>' +
              '<div class="sr-stage">' +
                '<div class="sr-guide sr-guide-top"></div>' +
                '<div class="sr-word" id="sr-word"><span class="sr-pre"></span><span class="sr-piv"></span><span class="sr-post"></span></div>' +
                '<div class="sr-guide sr-guide-bot"></div>' +
              '</div>' +
              '<div class="sr-progress" id="sr-progress" role="progressbar" aria-label="Progress" tabindex="0">' +
                '<div class="sr-progress-fill" id="sr-fill"></div>' +
              '</div>' +
              '<div class="sr-controls">' +
                '<button class="sr-btn" id="sr-back" type="button" aria-label="Back 10 words">−10</button>' +
                '<button class="sr-btn sr-play" id="sr-play" type="button" aria-label="Play or pause">Pause</button>' +
                '<button class="sr-btn" id="sr-fwd" type="button" aria-label="Forward 10 words">+10</button>' +
                '<span class="sr-wpm-group">' +
                  '<button class="sr-btn sr-mini" id="sr-slower" type="button" aria-label="Slower">−</button>' +
                  '<span class="sr-wpm" id="sr-wpm">' + wpm + ' wpm</span>' +
                  '<button class="sr-btn sr-mini" id="sr-faster" type="button" aria-label="Faster">+</button>' +
                '</span>' +
              '</div>' +
              '<p class="sr-status" id="sr-status"></p>' +
              '<p class="sr-help">space play/pause · ← → skip · ↑ ↓ speed · esc close</p>' +
            '</div>';
        document.body.appendChild(overlay);
        wordEl = overlay.querySelector('#sr-word');

        overlay.querySelector('.sr-close').addEventListener('click', close);
        overlay.querySelector('#sr-play').addEventListener('click', toggle);
        overlay.querySelector('#sr-back').addEventListener('click', function () { seek(idx - 10); });
        overlay.querySelector('#sr-fwd').addEventListener('click', function () { seek(idx + 10); });
        overlay.querySelector('#sr-slower').addEventListener('click', function () { setWpm(wpm - WPM_STEP); });
        overlay.querySelector('#sr-faster').addEventListener('click', function () { setWpm(wpm + WPM_STEP); });
        overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

        // On a phone the word area is the biggest target on screen, so it
        // is the play/pause control. No aiming for a small button.
        overlay.querySelector('.sr-stage').addEventListener('click', toggle);

        var prog = overlay.querySelector('#sr-progress');
        prog.addEventListener('click', function (e) {
            var r = prog.getBoundingClientRect();
            seek(Math.round(((e.clientX - r.left) / r.width) * words.length));
        });
    }

    function paint() {
        var item = words[idx];
        if (!item) return;
        var w = item.w, p = Math.min(pivotIndex(w), w.length - 1);
        wordEl.querySelector('.sr-pre').textContent = w.slice(0, p);
        wordEl.querySelector('.sr-piv').textContent = w.charAt(p);
        wordEl.querySelector('.sr-post').textContent = w.slice(p + 1);
        wordEl.classList.toggle('is-head', !!item.head);

        var pct = (idx / words.length) * 100;
        overlay.querySelector('#sr-fill').style.width = pct + '%';
        overlay.querySelector('#sr-progress').setAttribute('aria-valuenow', Math.round(pct));

        var left = Math.max(0, words.length - idx);
        var mins = Math.max(1, Math.round(left / wpm));
        overlay.querySelector('#sr-status').textContent =
            idx.toLocaleString() + ' / ' + words.length.toLocaleString() + ' words · ~' + mins + ' min left';
    }

    function step() {
        if (!playing) return;
        if (idx >= words.length) { finish(); return; }
        paint();
        var d = delayFor(words[idx]);
        idx++;
        timer = setTimeout(step, d);
    }

    function play() {
        if (idx >= words.length) idx = 0;
        playing = true;
        overlay.querySelector('#sr-play').textContent = 'Pause';
        step();
    }

    function pause() {
        playing = false;
        clearTimeout(timer);
        overlay.querySelector('#sr-play').textContent = 'Play';
    }

    function toggle() { playing ? pause() : play(); }

    function finish() {
        pause();
        idx = words.length;
        paint();
        overlay.querySelector('#sr-play').textContent = 'Restart';
        overlay.querySelector('#sr-status').textContent = 'Done · ' + words.length.toLocaleString() + ' words';
    }

    function seek(to) {
        idx = Math.min(words.length - 1, Math.max(0, to));
        paint();
    }

    function setWpm(v) {
        wpm = Math.min(WPM_MAX, Math.max(WPM_MIN, v));
        try { localStorage.setItem('sr-wpm', wpm); } catch (e) {}
        overlay.querySelector('#sr-wpm').textContent = wpm + ' wpm';
        paint();
    }

    function onKey(e) {
        if (e.key === 'Escape') { close(); return; }
        if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); toggle(); return; }
        if (e.key === 'ArrowLeft') { e.preventDefault(); pause(); seek(idx - 10); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); pause(); seek(idx + 10); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); setWpm(wpm + WPM_STEP); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); setWpm(wpm - WPM_STEP); return; }
        // Keep tabbing inside the dialog while it owns the screen.
        if (e.key === 'Tab') {
            var f = overlay.querySelectorAll('button, [tabindex="0"]');
            if (!f.length) return;
            var first = f[0], last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    }

    function onHide() { if (document.visibilityState === 'hidden' && playing) pause(); }

    function open() {
        lastFocus = document.activeElement;
        if (!overlay) build();
        overlay.classList.add('on');
        document.body.classList.add('sr-lock');
        document.addEventListener('keydown', onKey);
        document.addEventListener('visibilitychange', onHide);
        idx = 0;
        paint();
        overlay.querySelector('#sr-play').focus();
        // Someone who asked for reduced motion gets to press play themselves.
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) pause();
        else play();
    }

    function close() {
        pause();
        overlay.classList.remove('on');
        document.body.classList.remove('sr-lock');
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('visibilitychange', onHide);
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    srBtn.addEventListener('click', open);

})();
