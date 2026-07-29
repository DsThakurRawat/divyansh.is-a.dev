/* ============================================================
   Divyansh Rawat — portfolio interactions
   Theme toggle · scroll-spy · reveal · live CP/LeetCode stats
   ============================================================ */
(function () {
    'use strict';

    var root = document.documentElement;

    /* ---------- Theme toggle ---------- */
    var toggle = document.getElementById('theme-toggle');
    if (toggle) {
        toggle.addEventListener('click', function () {
            var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (e) {}
            var meta = document.querySelector('meta[name="theme-color"]');
            if (meta) meta.setAttribute('content', next === 'dark' ? '#0e0e10' : '#fbfbf8');
        });
    }

    /* ---------- Sticky bar shadow ---------- */
    var bar = document.querySelector('.topbar');
    var onScroll = function () {
        if (bar) bar.classList.toggle('scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Reveal on scroll ---------- */
    var sections = Array.prototype.slice.call(document.querySelectorAll('.section, .hero'));
    if ('IntersectionObserver' in window) {
        sections.forEach(function (el) { el.classList.add('reveal'); });
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
            });
        }, { threshold: 0.12 });
        sections.forEach(function (el) { io.observe(el); });
    }

    /* ---------- Scroll-spy nav ---------- */
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a'))
        .filter(function (a) {
            var href = a.getAttribute('href') || '';
            return href.charAt(0) === '#' && href.length > 1;
        });
    var targets = navLinks
        .map(function (a) { return document.querySelector(a.getAttribute('href')); })
        .filter(Boolean);
    if ('IntersectionObserver' in window && targets.length) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                var id = e.target.id;
                navLinks.forEach(function (a) {
                    a.classList.toggle('active', a.getAttribute('href') === '#' + id);
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        targets.forEach(function (t) { spy.observe(t); });
    }

    /* ---------- Live stats (best-effort, fail silently) ---------- */
    var GH_USER = 'DsThakurRawat';
    var LC_USER = 'DsThakurRawat';
    var CF_USER = 'lost_boy21';

    function setText(id, text) {
        var el = document.getElementById(id);
        if (el && text != null && text !== '') el.textContent = text;
    }

    function getJSON(url) {
        return fetch(url, { cache: 'no-store' }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        });
    }

    // These are free third-party endpoints; a single transient failure should
    // not blank a card. Retry once after a short pause before giving up.
    function getJSONRetry(url, delayMs) {
        return getJSON(url).catch(function () {
            return new Promise(function (res) { setTimeout(res, delayMs || 1500); })
                .then(function () { return getJSON(url); });
        });
    }

    /* ---------- Heatmap rendering ---------- */
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var WEEKS_MAX = 53;

    // Rendered data per card, so a resize can re-lay-out without refetching.
    var hmState = {};

    function isNarrow() {
        return window.matchMedia('(max-width: 560px)').matches;
    }

    // Must track the cell + gap sizes in the stylesheet's 560px breakpoint.
    function cellStep() { return isNarrow() ? 12 : 14; }

    // How many week-columns actually fit the card. A 53-week grid is ~742px,
    // which no phone can show — rather than a horizontal scrollbar hiding the
    // recent weeks, draw only the columns that fit and say so in the label.
    function weeksThatFit(prefix) {
        var grid = document.getElementById(prefix + '-grid');
        var host = grid && grid.parentElement;
        var w = host ? host.clientWidth : 0;
        if (!w) return WEEKS_MAX;
        return Math.max(10, Math.min(WEEKS_MAX, Math.floor(w / cellStep())));
    }

    function stampNow() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function isoDay(d) {
        return d.getFullYear() + '-' +
            ('0' + (d.getMonth() + 1)).slice(-2) + '-' +
            ('0' + d.getDate()).slice(-2);
    }

    // Sunday of the week containing `date`, at local midnight.
    function weekStart(date) {
        var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        d.setDate(d.getDate() - d.getDay());
        return d;
    }

    // Thresholds from the non-zero distribution so a quiet year still shows contrast.
    function levelScale(counts) {
        var vals = [];
        for (var k in counts) {
            if (Object.prototype.hasOwnProperty.call(counts, k) && counts[k] > 0) vals.push(counts[k]);
        }
        if (!vals.length) return function () { return 0; };
        vals.sort(function (a, b) { return a - b; });
        var q = function (p) { return vals[Math.min(vals.length - 1, Math.floor(vals.length * p))]; };
        var t1 = q(0.25), t2 = q(0.5), t3 = q(0.75);
        return function (n) {
            if (!n) return 0;
            if (n <= t1) return 1;
            if (n <= t2) return 2;
            if (n <= t3) return 3;
            return 4;
        };
    }

    // counts: { 'YYYY-MM-DD': n }. Renders as many weeks as the card can show,
    // ending with the current week.
    function renderHeatmap(prefix, counts, noun, state) {
        var grid = document.getElementById(prefix + '-grid');
        var months = document.getElementById(prefix + '-months');
        if (!grid) return;

        var st = hmState[prefix] = {
            counts: counts,
            noun: noun,
            stamp: (state && state.stamp) || stampNow(),
            note: state && state.note
        };

        var WEEKS = weeksThatFit(prefix);
        st.weeks = WEEKS;
        grid.setAttribute('data-weeks', WEEKS);

        var today = new Date();
        var end = weekStart(today);
        var start = new Date(end.getTime());
        start.setDate(start.getDate() - (WEEKS - 1) * 7);

        var levelOf = levelScale(counts);
        var gridFrag = document.createDocumentFragment();
        var monthFrag = document.createDocumentFragment();
        var total = 0;
        var lastMonth = -1;

        for (var w = 0; w < WEEKS; w++) {
            var colStart = new Date(start.getTime());
            colStart.setDate(colStart.getDate() + w * 7);

            // Month label whenever a new month begins in this column.
            var label = document.createElement('span');
            if (colStart.getMonth() !== lastMonth && colStart.getDate() <= 7) {
                label.textContent = MONTHS[colStart.getMonth()];
                lastMonth = colStart.getMonth();
            }
            monthFrag.appendChild(label);

            for (var d = 0; d < 7; d++) {
                var day = new Date(colStart.getTime());
                day.setDate(day.getDate() + d);

                var cell = document.createElement('div');
                cell.className = 'hm-cell';

                if (day.getTime() > today.getTime()) {
                    cell.className += ' pad';   // future days in the current week
                } else {
                    var key = isoDay(day);
                    var n = counts[key] || 0;
                    total += n;
                    cell.setAttribute('data-l', levelOf(n));
                    cell.title = n + ' ' + noun + (n === 1 ? '' : 's') + ' on ' + key;
                }
                gridFrag.appendChild(cell);
            }
        }

        grid.textContent = '';
        grid.appendChild(gridFrag);
        if (months) {
            months.textContent = '';
            months.appendChild(monthFrag);
        }

        var span = WEEKS >= WEEKS_MAX
            ? 'in the last year'
            : 'in the last ' + Math.max(1, Math.round(WEEKS / 4.345)) + ' months';
        setText(prefix + '-count',
            total.toLocaleString() + ' ' + noun + (total === 1 ? '' : 's') + ' ' + span);

        var note = document.getElementById(prefix + '-note');
        if (note) note.textContent = st.note || ('Updated ' + st.stamp);
    }

    // Re-lay-out on resize / orientation change; the column count is width
    // dependent, so a rotate would otherwise leave a clipped or stunted grid.
    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            for (var p in hmState) {
                if (!Object.prototype.hasOwnProperty.call(hmState, p)) continue;
                var st = hmState[p];
                if (weeksThatFit(p) !== st.weeks) {
                    renderHeatmap(p, st.counts, st.noun, st);
                }
            }
        }, 180);
    }, { passive: true });

    // Never hide the card — an empty grid plus an honest note beats a block
    // that silently vanishes and looks like a layout bug.
    function failCard(prefix, noun) {
        renderHeatmap(prefix, {}, noun, {
            note: 'Could not reach the API — open the profile above.'
        });
        var count = document.getElementById(prefix + '-count');
        if (count) count.textContent = 'Live data unavailable';
    }

    /* ---------- GitHub ---------- */
    function loadGitHub() {
        return getJSONRetry('https://github-contributions-api.jogruber.de/v4/' + GH_USER + '?y=last')
            .then(function (d) {
                var list = d && d.contributions;
                if (!list || !list.length) throw new Error('empty');
                var counts = {};
                list.forEach(function (c) { counts[c.date] = c.count; });
                renderHeatmap('gh', counts, 'contribution');
            })
            .catch(function () { failCard('gh', 'contribution'); });
    }

    /* ---------- LeetCode (no CORS on leetcode.com, so: proxy first) ----------
       The proxy only exists when the site is served by dev.mjs or deployed to
       Vercel. Opening index.html straight off disk has no /api, so fall back to
       a public mirror rather than showing an empty card. */
    var LC_FALLBACK = 'https://alfa-leetcode-api.onrender.com/' + LC_USER;

    function lcGet(endpoint, fallbackPath) {
        return getJSON('/api/lc-proxy?handle=' + LC_USER + '&endpoint=' + endpoint)
            .catch(function () { return getJSON(LC_FALLBACK + fallbackPath); });
    }

    function loadLeetCode() {
        var solved = lcGet('solved', '/solved')
            .then(function (d) {
                var total = d.solvedProblem != null ? d.solvedProblem : d.totalSolved;
                if (total == null) throw new Error('empty');
                setText('lc-solved', total);
                if (d.easySolved != null && d.mediumSolved != null && d.hardSolved != null) {
                    setText('lc-breakdown', d.easySolved + ' easy · ' + d.mediumSolved + ' med · ' + d.hardSolved + ' hard');
                }
            })
            .catch(function () {});

        var contest = lcGet('contest', '/contest')
            .then(function (d) {
                if (d.contestRating == null) throw new Error('empty');
                setText('lc-contest', Math.round(d.contestRating));
                var sub = [];
                if (d.contestAttend != null) sub.push(d.contestAttend + ' contests');
                if (d.contestTopPercentage != null) sub.push('top ' + d.contestTopPercentage.toFixed(1) + '%');
                if (sub.length) setText('lc-contest-sub', sub.join(' · '));
            })
            .catch(function () {});

        var calendar = lcGet('calendar', '/calendar')
            .then(function (d) {
                // submissionCalendar is { unixSeconds: count } — a JSON *string*
                // from our proxy, already an object from the fallback mirror.
                var raw = d.submissionCalendar;
                if (typeof raw === 'string') raw = JSON.parse(raw || '{}');
                if (!raw || !Object.keys(raw).length) throw new Error('empty');
                var counts = {};
                for (var ts in raw) {
                    if (!Object.prototype.hasOwnProperty.call(raw, ts)) continue;
                    counts[isoDay(new Date(parseInt(ts, 10) * 1000))] = raw[ts];
                }
                renderHeatmap('lc', counts, 'submission');
            })
            .catch(function () { failCard('lc', 'submission'); });

        return Promise.all([solved, contest, calendar]);
    }

    /* ---------- Codeforces (public API, CORS-enabled) ----------
       Codeforces rate-limits to roughly one call every two seconds and answers
       violations with HTTP 200 + {"status":"FAILED"}. So: check status, and run
       the two calls in sequence rather than firing both at once. */
    function cfUnwrap(d) {
        if (!d || d.status !== 'OK' || !d.result) {
            throw new Error(d && d.comment ? d.comment : 'CF request failed');
        }
        return d.result;
    }

    // Two independent routes to the same data: straight to codeforces.com,
    // then through our own proxy (different source IP, cached response) if that
    // fails. Either one alone drops out often enough to blank the card.
    function cfGet(endpoint, query) {
        var direct = 'https://codeforces.com/api/' + endpoint + (query ? '?' + query : '');
        var viaProxy = '/api/cf-proxy?endpoint=' + encodeURIComponent(endpoint) + (query ? '&' + query : '');
        return getJSON(direct).then(cfUnwrap).catch(function () {
            return new Promise(function (res) { setTimeout(res, 1200); })
                .then(function () { return getJSON(viaProxy); })
                .then(cfUnwrap);
        });
    }

    function loadCodeforces() {
        return cfGet('user.info', 'handles=' + CF_USER)
            .then(function (result) {
                var u = result[0];
                if (u) {
                    if (u.rating != null) setText('cf-rating', u.rating);
                    var rank = u.rank ? u.rank.replace(/\b\w/g, function (c) { return c.toUpperCase(); }) : null;
                    if (rank) setText('cf-rank', rank + (u.maxRating ? ' · max ' + u.maxRating : ''));
                }
            })
            .catch(function () {})
            .then(function () {
                return new Promise(function (res) { setTimeout(res, 2100); });
            })
            .then(function () {
                return cfGet('user.status', 'handle=' + CF_USER + '&from=1&count=4000');
            })
            .then(function (subs) {
                var counts = {};
                var solvedSet = {};
                subs.forEach(function (s) {
                    var day = isoDay(new Date(s.creationTimeSeconds * 1000));
                    counts[day] = (counts[day] || 0) + 1;
                    if (s.verdict === 'OK' && s.problem) {
                        solvedSet[s.problem.contestId + '-' + s.problem.index] = 1;
                    }
                });
                setText('cf-solved', Object.keys(solvedSet).length);
                setText('cf-solved-sub', subs.length.toLocaleString() + ' submissions');
                renderHeatmap('cf', counts, 'submission');
            })
            .catch(function () { failCard('cf', 'submission'); });
    }

    /* ---------- Load + keep fresh ---------- */
    function refreshAll() {
        loadGitHub();
        loadLeetCode();
        loadCodeforces();
    }

    refreshAll();

    // Poll every 10 minutes, and catch up when the tab regains focus (skip if
    // we refreshed in the last 2 minutes so tab-switching doesn't hammer the APIs).
    var lastRefresh = Date.now();
    function refreshTracked() {
        lastRefresh = Date.now();
        refreshAll();
    }
    setInterval(function () {
        if (document.visibilityState === 'visible') refreshTracked();
    }, 10 * 60 * 1000);
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible' && Date.now() - lastRefresh > 2 * 60 * 1000) {
            refreshTracked();
        }
    });

})();
