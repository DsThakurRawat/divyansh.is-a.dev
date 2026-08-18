/* ============================================================
   Shared chrome — runs on every page (home and blog).
   Theme toggle · sticky bar shadow · reveal on scroll
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
        // Fires when the top edge clears the fold rather than on a visible
        // ratio: an element taller than the viewport can never reach a 12%
        // ratio, and would sit invisible forever.
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
            });
        }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
        sections.forEach(function (el) { io.observe(el); });
    }

})();
