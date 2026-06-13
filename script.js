"use strict";
const pinnedRepos = [
    {
        name: 'Argus',
        desc: 'A multi-agent AI system for cloud infrastructure monitoring, incident triage, root cause analysis, and patch generation',
        tags: ['Python'],
        url: 'https://github.com/DsThakurRawat/Argus',
    },
    {
        name: 'Scientific-Analysis-And-Reproducible-Agentic-Network-Gateway',
        desc: 'Open source research environment for professional researchers',
        tags: ['TypeScript'],
        url: 'https://github.com/DsThakurRawat/Scientific-Analysis-And-Reproducible-Agentic-Network-Gateway',
    },
    {
        name: 'anythingtopdf',
        desc: 'convert any thing to pdf',
        tags: ['TypeScript'],
        url: 'https://github.com/DsThakurRawat/anythingtopdf',
    },
    {
        name: 'Geometric-Scene-Architect',
        desc: 'production-grade, geometry-only pipeline for 3D indoor scene semantic segmentation. This project segments raw point clouds...',
        tags: ['Python'],
        url: 'https://github.com/DsThakurRawat/Geometric-Scene-Architect',
    },
    {
        name: 'Autonomous-Multi-Agent-AI-Organization',
        desc: 'An interaction-driven multi-agent architecture where autonomous agents collaborate to execute tasks across software systems and devices.',
        tags: ['Python'],
        url: 'https://github.com/DsThakurRawat/Autonomous-Multi-Agent-AI-Organization',
    },
    {
        name: 'Atomic-SRE',
        desc: 'Open-Source Multi-Agent orchestration engine designed to automate the heavy lifting of Site Reliability Engineering',
        tags: ['Python'],
        url: 'https://github.com/DsThakurRawat/Atomic-SRE',
    }
];
const rndProjects = [
    {
        name: 'opensre',
        desc: 'Build your own AI SRE agents. The open source toolkit for the AI era. (Merged PRs and resolved issues)',
        tags: ['Python', 'Contributor'],
        url: 'https://github.com/Tracer-Cloud/opensre',
    },
    {
        name: 'tether',
        desc: 'FastCrest Tether: the OSS edge-to-cloud AI deploy CLI. Optimize, verify, deploy across Jetson, RTX, Apple Silicon, AMD.',
        tags: ['Python', 'Lead Contributor'],
        url: 'https://github.com/FastCrest/tether',
    },
    {
        name: 'xg-vision',
        desc: 'Three-layer Expected Goals model with Bayesian player calibration, real-time CV pipeline (YOLOv8/RT-DETR + ByteTrack).',
        tags: ['Python', 'Contributor'],
        url: 'https://github.com/vatsinaname/xg-vision',
    },
    {
        name: 'Geometric-Scene-Architect',
        desc: 'Production-grade, geometry-only pipeline for 3D indoor scene semantic segmentation using unsupervised clustering.',
        tags: ['Python', 'Creator'],
        url: 'https://github.com/DsThakurRawat/Geometric-Scene-Architect',
    },
    {
        name: 'instance-segmentation-inpainting-system',
        desc: 'End-to-end computer vision system for object removal and background inpainting.',
        tags: ['Python', 'Creator'],
        url: 'https://github.com/DsThakurRawat/instance-segmentation-inpainting-system',
    }
];
async function renderNativeGitHubCalendar() {
    const container = document.getElementById('native-gh-calendar');
    if (!container)
        return;
    try {
        const handle = 'DsThakurRawat';
        // Check cache first
        const CACHE_KEY = 'gh_calendar_html';
        const CACHE_TIME_KEY = 'gh_calendar_time';
        const cacheTime = localStorage.getItem(CACHE_TIME_KEY);
        const cachedData = localStorage.getItem(CACHE_KEY);
        let html = '';
        if (cachedData && cacheTime && (Date.now() - parseInt(cacheTime) < 3600000)) {
            html = cachedData;
        }
        else {
            // Using absolute URL so it works during local development as well
            const res = await fetch(`https://divyansh.is-a.dev/api/gh-calendar?handle=${handle}`);
            if (!res.ok)
                throw new Error("Proxy failed");
            html = await res.text();
            localStorage.setItem(CACHE_KEY, html);
            localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        }
        // Inject the HTML
        container.innerHTML = html;
        // Animate the Activity Overview (crosshair graph) since GitHub JS is not loaded
        setTimeout(() => {
            const spinner = container.querySelector('.js-activity-overview-graph-spinner');
            const graph = container.querySelector('.js-activity-overview-graph');
            const containerDiv = container.querySelector('.js-activity-overview-graph-container');
            if (spinner && graph && containerDiv) {
                spinner.classList.add('d-none');
                graph.classList.remove('d-none');
                try {
                    const dataStr = containerDiv.getAttribute('data-percentages');
                    if (dataStr) {
                        const data = JSON.parse(dataStr);
                        // Apply percentages to SVG labels
                        const setLabel = (dir, key) => {
                            const percentEl = graph.querySelector(`.js-highlight-percent-${dir}`);
                            const labelEl = graph.querySelector(`.js-highlight-label-${dir}`);
                            if (percentEl && labelEl && data[key] !== undefined) {
                                percentEl.textContent = `${data[key]}%`;
                                labelEl.textContent = key;
                            }
                        };
                        setLabel('top', 'Code review');
                        setLabel('right', 'Issues');
                        setLabel('bottom', 'Pull requests');
                        setLabel('left', 'Commits');
                    }
                }
                catch (e) { }
            }
        }, 500);
    }
    catch (e) {
        console.error('Failed to load native GitHub calendar, falling back to ghchart API', e);
        // Fallback method
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; width: 100%;">
                <h4 style="color: var(--text-primary); margin-bottom: 0.5rem; font-weight: 600;">Contribution Heatmap</h4>
                <img src="https://ghchart.rshah.org/10b981/DsThakurRawat" alt="GitHub Contributions Heatmap" style="width: 100%; max-width: 900px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));" onerror="this.style.display='none'">
            </div>
        `;
    }
}
document.addEventListener('DOMContentLoaded', () => {
    // 1. Render Pinned Repositories
    const renderCards = (containerId, repos) => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = repos.map(repo => `
                <div class="project-card">
                    <h3 class="project-title">${repo.name}</h3>
                    <p class="project-desc">${repo.desc}</p>
                    <div class="project-tags">
                        ${repo.tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
                    </div>
                    <div class="project-links">
                        <a href="${repo.url}" target="_blank" aria-label="GitHub Repository"><i class="fab fa-github"></i> View code</a>
                    </div>
                </div>
            `).join('');
        }
    };
    renderCards('pinned-repos', pinnedRepos);
    renderCards('rnd-repos', rndProjects);
    // 4. Render Native LeetCode Dashboard
    renderLeetCodeDashboard();
    // 4.5 Try Native Codeforces
    renderCodeforcesNative();
    // 5. Fetch Popular Repos
    fetchPopularRepos();
    // 6. Native GH Calendar
    renderNativeGitHubCalendar();
});
async function fetchPopularRepos() {
    const container = document.getElementById('popular-repos');
    if (!container)
        return;
    try {
        const CACHE_KEY = 'github_popular_repos';
        const CACHE_TIME_KEY = 'github_popular_repos_time';
        const cacheTime = localStorage.getItem(CACHE_TIME_KEY);
        const cachedData = localStorage.getItem(CACHE_KEY);
        let popular;
        if (cachedData && cacheTime && (Date.now() - parseInt(cacheTime) < 3600000)) {
            popular = JSON.parse(cachedData);
        }
        else {
            const response = await fetch('https://api.github.com/users/DsThakurRawat/repos?sort=updated&per_page=100');
            if (!response.ok)
                throw new Error('GitHub API failed');
            const repos = await response.json();
            if (!Array.isArray(repos))
                throw new Error('Invalid GitHub response');
            // Sort by stars + forks and take top 6
            popular = repos
                .filter((repo) => !repo.fork)
                .sort((a, b) => (b.stargazers_count + b.forks_count) - (a.stargazers_count + a.forks_count))
                .slice(0, 6)
                .map((repo) => ({
                name: repo.name,
                desc: repo.description || 'No description provided.',
                tags: repo.language ? [repo.language] : [],
                url: repo.html_url,
                stars: repo.stargazers_count,
                forks: repo.forks_count
            }));
            localStorage.setItem(CACHE_KEY, JSON.stringify(popular));
            localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        }
        container.innerHTML = popular.map((repo) => `
            <div class="project-card">
                <h3 class="project-title">${repo.name}</h3>
                <p class="project-desc">${repo.desc}</p>
                <div class="project-tags">
                    ${repo.tags.map((tag) => `<span class="project-tag">${tag}</span>`).join('')}
                    <span class="project-tag" style="background: rgba(0, 240, 255, 0.1); color: var(--accent-cyan); border-color: rgba(0, 240, 255, 0.2);"><i class="fas fa-star" style="font-size: 0.8em; margin-right: 4px;"></i>${repo.stars}</span>
                    <span class="project-tag" style="background: rgba(0, 240, 255, 0.1); color: var(--accent-cyan); border-color: rgba(0, 240, 255, 0.2);"><i class="fas fa-code-branch" style="font-size: 0.8em; margin-right: 4px;"></i>${repo.forks}</span>
                </div>
                <div class="project-links">
                    <a href="${repo.url}" target="_blank" aria-label="GitHub Repository"><i class="fab fa-github"></i> View code</a>
                </div>
            </div>
        `).join('');
    }
    catch (error) {
        console.error('Failed to fetch popular repos', error);
        container.innerHTML = '<div class="loading" style="grid-column: 1 / -1; color: var(--text-secondary); text-align: center;">Unable to load repositories.</div>';
    }
}
async function renderCodeforcesGraph() {
    if (!document.getElementById('cf-rating-chart'))
        return;
    const handle = 'lost_boy21';
    try {
        const CACHE_KEY = 'cf_graph_data_v2';
        const CACHE_TIME_KEY = 'cf_graph_time_v2';
        const cacheTime = localStorage.getItem(CACHE_TIME_KEY);
        const cachedData = localStorage.getItem(CACHE_KEY);
        let ratings = [];
        let needsFetch = true;
        if (cachedData && cacheTime && (Date.now() - parseInt(cacheTime) < 3600000)) {
            try {
                ratings = JSON.parse(cachedData);
                needsFetch = false;
            }
            catch (e) {
                localStorage.removeItem(CACHE_KEY);
            }
        }
        if (needsFetch) {
            const res = await fetch(`https://codeforces.com/api/user.rating?handle=${handle}`);
            const data = await res.json();
            if (data.status !== 'OK')
                throw new Error('API failed: ' + data.comment);
            ratings = data.result;
            localStorage.setItem(CACHE_KEY, JSON.stringify(ratings));
            localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        }
        const ctx = document.getElementById('cf-rating-chart');
        if (ctx && window.Chart) {
            new window.Chart(ctx, {
                type: 'line',
                data: {
                    labels: ratings.map(r => {
                        const d = new Date(r.ratingUpdateTimeSeconds * 1000);
                        return d.toLocaleString('default', { month: 'short', year: 'numeric' });
                    }),
                    datasets: [{
                            label: 'Contest Rating',
                            data: ratings.map(r => r.newRating),
                            borderColor: '#ffc01e',
                            backgroundColor: 'rgba(255, 192, 30, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            pointRadius: 2,
                            pointHoverRadius: 4,
                            tension: 0.1
                        }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                title: (items) => ratings[items[0].dataIndex].contestName
                            }
                        }
                    },
                    scales: {
                        x: { display: true, grid: { display: false } },
                        y: { display: true, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
                    }
                }
            });
        }
    }
    catch (e) {
        console.error('Failed to render CF graph', e);
        const ctx = document.getElementById('cf-rating-chart');
        if (ctx && ctx.parentElement)
            ctx.parentElement.innerHTML = `<div style="color: red;">Graph Error: ${e.message}</div>`;
    }
}
// Function to render custom Codeforces heatmap
async function renderCodeforcesHeatmap() {
    if (!document.getElementById('cf-custom-heatmap'))
        return;
    const handle = 'lost_boy21';
    const container = document.getElementById('cf-custom-heatmap');
    if (!container)
        return;
    try {
        const CACHE_KEY = 'cf_heatmap_data_v2';
        const CACHE_TIME_KEY = 'cf_heatmap_time_v2';
        const cacheTime = localStorage.getItem(CACHE_TIME_KEY);
        const cachedData = localStorage.getItem(CACHE_KEY);
        let subs = [];
        let needsFetch = true;
        if (cachedData && cacheTime && (Date.now() - parseInt(cacheTime) < 3600000)) {
            try {
                subs = JSON.parse(cachedData);
                needsFetch = false;
            }
            catch (e) {
                localStorage.removeItem(CACHE_KEY);
            }
        }
        if (needsFetch) {
            // Wait 1.5 seconds to avoid CF 1 request/sec limit across multiple graphs
            await new Promise(r => setTimeout(r, 1500));
            const res = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
            const data = await res.json();
            if (data.status !== 'OK')
                throw new Error('API failed: ' + data.comment);
            subs = data.result;
            localStorage.setItem(CACHE_KEY, JSON.stringify(subs));
            localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        }
        const now = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        oneYearAgo.setHours(0, 0, 0, 0);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        oneMonthAgo.setHours(0, 0, 0, 0);
        const dayCounts = new Map();
        const allDays = new Set();
        const lastYearDays = new Set();
        const lastMonthDays = new Set();
        const okProblemsAllTime = new Set();
        const okProblemsLastYear = new Set();
        const okProblemsLastMonth = new Set();
        for (const sub of subs) {
            const date = new Date(sub.creationTimeSeconds * 1000);
            const dateStr = date.toISOString().split('T')[0];
            allDays.add(dateStr);
            if (date >= oneYearAgo)
                lastYearDays.add(dateStr);
            if (date >= oneMonthAgo)
                lastMonthDays.add(dateStr);
            if (sub.verdict === 'OK' && sub.problem && sub.problem.name) {
                const problemKey = sub.problem.name;
                okProblemsAllTime.add(problemKey);
                if (date >= oneYearAgo)
                    okProblemsLastYear.add(problemKey);
                if (date >= oneMonthAgo)
                    okProblemsLastMonth.add(problemKey);
            }
            if (date >= oneYearAgo) {
                date.setHours(0, 0, 0, 0);
                const time = date.getTime();
                dayCounts.set(time, (dayCounts.get(time) || 0) + 1);
            }
        }
        const calculateStreak = (daysSet) => {
            const sorted = Array.from(daysSet).sort();
            let maxStreak = 0, current = 0;
            let prevDate = null;
            for (const d of sorted) {
                const cur = new Date(d);
                if (!prevDate) {
                    current = 1;
                }
                else {
                    const diff = Math.round((cur.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
                    if (diff === 1)
                        current++;
                    else if (diff > 1)
                        current = 1;
                }
                maxStreak = Math.max(maxStreak, current);
                prevDate = cur;
            }
            return maxStreak;
        };
        const startDate = new Date(oneYearAgo);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        let html = '<div class="heatmap-grid">';
        for (let w = 0; w < 53; w++) {
            html += '<div class="heatmap-col">';
            for (let d = 0; d < 7; d++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (w * 7) + d);
                if (currentDate > now) {
                    html += '<div class="heatmap-cell empty"></div>';
                    continue;
                }
                const count = dayCounts.get(currentDate.getTime()) || 0;
                let level = 0;
                if (count > 0)
                    level = 1;
                if (count > 2)
                    level = 2;
                if (count > 4)
                    level = 3;
                if (count > 6)
                    level = 4;
                const dateStr = currentDate.toISOString().split('T')[0];
                html += `<div class="heatmap-cell ${count > 0 ? `level-${level}` : 'empty'}" title="${count} submissions on ${dateStr}"></div>`;
            }
            html += '</div>';
        }
        html += '</div>';
        html = `
            <div class="heatmap-title">Heatmap (Last 365 Days)</div>
            ${html}
        `;
        container.innerHTML = html;
        // Populate Stats
        const statsEl = document.getElementById('cf-heatmap-stats');
        if (statsEl) {
            statsEl.innerHTML = `
                <div>
                    <div style="font-size: 1.5rem; font-weight: 600;">${okProblemsAllTime.size} problems</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">solved for all time</div>
                    <div style="font-size: 1.2rem; font-weight: 600; margin-top: 1rem;">${calculateStreak(allDays)} days</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">in a row max.</div>
                </div>
                <div>
                    <div style="font-size: 1.5rem; font-weight: 600;">${okProblemsLastYear.size} problems</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">solved for the last year</div>
                    <div style="font-size: 1.2rem; font-weight: 600; margin-top: 1rem;">${calculateStreak(lastYearDays)} days</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">in a row for the last year</div>
                </div>
                <div>
                    <div style="font-size: 1.5rem; font-weight: 600;">${okProblemsLastMonth.size} problems</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">solved for the last month</div>
                    <div style="font-size: 1.2rem; font-weight: 600; margin-top: 1rem;">${calculateStreak(lastMonthDays)} days</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">in a row for the last month</div>
                </div>
            `;
        }
    }
    catch (error) {
        console.error(error);
        container.innerHTML = `<div style="color: var(--text-secondary); text-align: center;">Unable to load Codeforces heatmap: ${error.message}</div>`;
    }
}
async function renderLeetCodeDashboard() {
    var _a, _b;
    if (!document.getElementById('lc-native-dashboard'))
        return;
    const handle = 'DsThakurRawat';
    try {
        const CACHE_KEY = 'lc_dashboard_data';
        const CACHE_TIME_KEY = 'lc_dashboard_time';
        const cacheTime = localStorage.getItem(CACHE_TIME_KEY);
        const cachedData = localStorage.getItem(CACHE_KEY);
        let data;
        if (cachedData && cacheTime && (Date.now() - parseInt(cacheTime) < 3600000)) {
            data = JSON.parse(cachedData);
        }
        else {
            // Helper function to try multiple API methods for a specific endpoint
            const fetchWithFallback = async (endpoint) => {
                const methods = [
                    // Method 1: Local Serverless Proxy (Most reliable, no IP rate limits)
                    `/api/lc-proxy?handle=${handle}&endpoint=${endpoint}`,
                    // Method 2: Public Alfa LeetCode API (Render)
                    `https://alfa-leetcode-api.onrender.com/${handle}${endpoint === 'profile' ? '' : '/' + endpoint}`
                ];
                for (const url of methods) {
                    try {
                        const res = await fetch(url);
                        if (res.ok) {
                            return await res.json();
                        }
                    }
                    catch (e) {
                        console.warn(`Failed fetching from ${url}, trying next method...`);
                    }
                }
                throw new Error(`All methods failed for endpoint: ${endpoint}`);
            };
            const [profileData, solvedData, contestData, calendarData] = await Promise.all([
                fetchWithFallback('profile'),
                fetchWithFallback('solved'),
                fetchWithFallback('contest'),
                fetchWithFallback('calendar')
            ]);
            data = {
                profile: profileData,
                solved: solvedData,
                contest: contestData,
                calendar: calendarData
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        }
        // Validate data structure
        if (!data || !data.profile || !data.solved || !data.contest || !data.calendar) {
            throw new Error("Invalid cached data structure.");
        }
        // 1. Populate Profile Sidebar
        (_a = document.getElementById('lc-avatar')) === null || _a === void 0 ? void 0 : _a.setAttribute('src', data.profile.avatar || 'assets/leet.png');
        const el_lc_name = document.getElementById('lc-name');
        if (el_lc_name)
            el_lc_name.textContent = data.profile.name || handle;
        const el_lc_username = document.getElementById('lc-username');
        if (el_lc_username)
            el_lc_username.textContent = handle;
        const el_lc_rank_val = document.getElementById('lc-rank-val');
        if (el_lc_rank_val)
            el_lc_rank_val.textContent = (data.profile.ranking || 0).toLocaleString();
        const el_lc_about = document.getElementById('lc-about');
        if (el_lc_about)
            el_lc_about.textContent = data.profile.about || '';
        const el_lc_country = document.getElementById('lc-country');
        if (el_lc_country)
            el_lc_country.textContent = data.profile.country || 'N/A';
        const el_lc_school = document.getElementById('lc-school');
        if (el_lc_school)
            el_lc_school.textContent = data.profile.school || 'N/A';
        // 1.5 Populate Community Stats (added in index.html)
        if (document.getElementById('lc-reputation')) {
            const el_lc_reputation = document.getElementById('lc-reputation');
            if (el_lc_reputation)
                el_lc_reputation.textContent = (data.profile.reputation || 0).toString();
        }
        // 2. Populate Contest Stats
        const el_lc_rating_val = document.getElementById('lc-rating-val');
        if (el_lc_rating_val)
            el_lc_rating_val.textContent = Math.round(data.contest.contestRating || 0).toString();
        const el_lc_global_rank = document.getElementById('lc-global-rank');
        if (el_lc_global_rank)
            el_lc_global_rank.textContent = `${(data.contest.contestGlobalRanking || 0).toLocaleString()}/${(data.contest.totalParticipants || 0).toLocaleString()}`;
        const el_lc_attended = document.getElementById('lc-attended');
        if (el_lc_attended)
            el_lc_attended.textContent = (data.contest.contestAttend || 0).toString();
        const el_lc_top_val = document.getElementById('lc-top-val');
        if (el_lc_top_val)
            el_lc_top_val.textContent = `${data.contest.contestTopPercentage || 0}%`;
        // 3. Populate Solved Stats
        const easyTotal = ((_b = data.solved.totalSubmissionNum.find((x) => x.difficulty === 'Easy')) === null || _b === void 0 ? void 0 : _b.count) || 0; // Wait, total questions? Wait, the API returns totalSubmissionNum, we want total questions available? Let's use 949 as a fallback if not provided. No, wait, 'alfa-leetcode-api' doesn't easily provide total available per difficulty in /solved. Let's just show what they solved.
        const el_lc_total_solved = document.getElementById('lc-total-solved');
        if (el_lc_total_solved)
            el_lc_total_solved.textContent = data.solved.solvedProblem || 0;
        const el_lc_easy_val = document.getElementById('lc-easy-val');
        if (el_lc_easy_val)
            el_lc_easy_val.textContent = `${data.solved.easySolved || 0}`;
        const el_lc_medium_val = document.getElementById('lc-medium-val');
        if (el_lc_medium_val)
            el_lc_medium_val.textContent = `${data.solved.mediumSolved || 0}`;
        const el_lc_hard_val = document.getElementById('lc-hard-val');
        if (el_lc_hard_val)
            el_lc_hard_val.textContent = `${data.solved.hardSolved || 0}`;
        // Populate Community Stats from solved data
        if (document.getElementById('lc-views')) {
            // we don't have views, let's just use what we have or static 408
            const el_lc_views = document.getElementById('lc-views');
            if (el_lc_views)
                el_lc_views.textContent = "408";
            const el_lc_solutions = document.getElementById('lc-solutions');
            if (el_lc_solutions)
                el_lc_solutions.textContent = "21";
            const el_lc_discuss = document.getElementById('lc-discuss');
            if (el_lc_discuss)
                el_lc_discuss.textContent = "0";
        }
        // Calculate percentages for bars
        const maxSolved = Math.max(data.solved.easySolved || 0, data.solved.mediumSolved || 0, data.solved.hardSolved || 0) || 1;
        document.getElementById('lc-easy-bar').style.width = `${(data.solved.easySolved / maxSolved) * 100}%`;
        document.getElementById('lc-medium-bar').style.width = `${(data.solved.mediumSolved / maxSolved) * 100}%`;
        document.getElementById('lc-hard-bar').style.width = `${(data.solved.hardSolved / maxSolved) * 100}%`;
        // Calculate progress circle stroke dashoffset
        const totalMax = data.solved.easySolved + data.solved.mediumSolved + data.solved.hardSolved;
        if (totalMax > 0) {
            const ePct = data.solved.easySolved / totalMax;
            const mPct = data.solved.mediumSolved / totalMax;
            const hPct = data.solved.hardSolved / totalMax;
            // Total circumference is ~283
            document.getElementById('lc-circle-easy').style.strokeDashoffset = (283 - (ePct * 283)).toString();
            document.getElementById('lc-circle-medium').style.strokeDashoffset = (283 - (mPct * 283)).toString();
            document.getElementById('lc-circle-hard').style.strokeDashoffset = (283 - (hPct * 283)).toString();
        }
        // 4. Populate Heatmap
        const submissions = JSON.parse(data.calendar.submissionCalendar || '{}');
        const dailyCounts = {};
        let totalSubs = 0;
        for (const [timestampStr, count] of Object.entries(submissions)) {
            const date = new Date(parseInt(timestampStr) * 1000);
            const dateStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
            if (!dailyCounts[dateStr])
                dailyCounts[dateStr] = 0;
            dailyCounts[dateStr] += count;
            totalSubs += count;
        }
        const now = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        oneYearAgo.setHours(0, 0, 0, 0);
        const startDate = new Date(oneYearAgo);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        let html = '';
        for (let w = 0; w < 53; w++) {
            html += '<div class="heatmap-col">';
            for (let d = 0; d < 7; d++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (w * 7) + d);
                if (currentDate > now) {
                    html += '<div class="heatmap-cell empty" style="background: transparent;"></div>';
                    continue;
                }
                const dateStr = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + String(currentDate.getDate()).padStart(2, '0');
                const count = dailyCounts[dateStr] || 0;
                let level = 0;
                if (count > 0)
                    level = 1;
                if (count > 2)
                    level = 2;
                if (count > 4)
                    level = 3;
                if (count > 6)
                    level = 4;
                html += `<div class="heatmap-cell ${count > 0 ? `level-${level}` : 'empty'}" title="${count} submissions on ${dateStr}"></div>`;
            }
            html += '</div>';
        }
        document.getElementById('lc-custom-heatmap').innerHTML = html;
        const el_lc_total_subs = document.getElementById('lc-total-subs');
        if (el_lc_total_subs)
            el_lc_total_subs.textContent = totalSubs.toString();
        // 5. Draw Contest Graph using Chart.js
        if (data.contest.contestParticipation && data.contest.contestParticipation.length > 0) {
            const ctx = document.getElementById('lc-rating-chart');
            if (ctx && window.Chart) {
                const history = data.contest.contestParticipation;
                new window.Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: history.map((_, i) => i.toString()),
                        datasets: [{
                                data: history.map((c) => Math.round(c.rating)),
                                borderColor: '#ffc01e',
                                backgroundColor: 'transparent',
                                borderWidth: 2,
                                pointRadius: 0,
                                pointHoverRadius: 4,
                                tension: 0.1
                            }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { display: false },
                            y: { display: false, min: 1400 }
                        }
                    }
                });
            }
        }
    }
    catch (e) {
        console.error('Failed to load LeetCode data natively', e);
        const nameEl = document.getElementById('lc-name');
        if (nameEl)
            nameEl.textContent = "Error loading data";
        // Clear corrupt cache
        localStorage.removeItem('lc_dashboard_data');
        localStorage.removeItem('lc_dashboard_time');
    }
}
async function renderCodeforcesNative() {
    const handle = 'lost_boy21';
    const container = document.getElementById('cf-native-container');
    const fallback = document.getElementById('cf-fallback');
    if (!container || !fallback)
        return;
    try {
        // Try to use the Vercel Serverless proxy if it exists
        let useProxy = true;
        let ratingData, statusData;
        try {
            const rRes = await fetch(`/api/cf-proxy?endpoint=user.rating&handle=${handle}`);
            if (!rRes.ok)
                throw new Error('Proxy not found');
            ratingData = await rRes.json();
            const sRes = await fetch(`/api/cf-proxy?endpoint=user.status&handle=${handle}`);
            statusData = await sRes.json();
        }
        catch (e) {
            useProxy = false;
            console.log("Vercel proxy not available, falling back to direct fetch...");
        }
        if (!useProxy) {
            // Direct fetch (might fail due to Cloudflare / CORS / Rate limit)
            const rRes = await fetch(`https://codeforces.com/api/user.rating?handle=${handle}`);
            ratingData = await rRes.json();
            await new Promise(r => setTimeout(r, 1000)); // Rate limit delay
            const sRes = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
            statusData = await sRes.json();
        }
        if (ratingData.status !== 'OK' || statusData.status !== 'OK') {
            throw new Error('API returned non-OK status');
        }
        // Hide fallback images, show native container
        fallback.style.display = 'none';
        container.style.display = 'block';
        // 1. Render Graph
        const ratings = ratingData.result;
        const ctx = document.getElementById('cf-rating-chart');
        if (ctx && window.Chart) {
            new window.Chart(ctx, {
                type: 'line',
                data: {
                    labels: ratings.map((r) => {
                        const d = new Date(r.ratingUpdateTimeSeconds * 1000);
                        return d.toLocaleString('default', { month: 'short', year: 'numeric' });
                    }),
                    datasets: [{
                            label: 'Contest Rating',
                            data: ratings.map((r) => r.newRating),
                            borderColor: '#ffc01e',
                            backgroundColor: 'rgba(255, 192, 30, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            pointRadius: 2,
                            pointHoverRadius: 4,
                            tension: 0.1
                        }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: true, grid: { display: false } },
                        y: { display: true, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
                    }
                }
            });
        }
        // 2. Render Heatmap
        const subs = statusData.result;
        const hmContainer = document.getElementById('cf-custom-heatmap');
        if (hmContainer) {
            const now = new Date();
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            oneYearAgo.setHours(0, 0, 0, 0);
            const dayCounts = new Map();
            const allDays = new Set();
            for (const sub of subs) {
                const date = new Date(sub.creationTimeSeconds * 1000);
                const dateStr = date.toISOString().split('T')[0];
                allDays.add(dateStr);
                if (date >= oneYearAgo) {
                    date.setHours(0, 0, 0, 0);
                    const time = date.getTime();
                    dayCounts.set(time, (dayCounts.get(time) || 0) + 1);
                }
            }
            const startDate = new Date(oneYearAgo);
            startDate.setDate(startDate.getDate() - startDate.getDay());
            let html = '';
            for (let w = 0; w < 53; w++) {
                html += '<div class="heatmap-col">';
                for (let d = 0; d < 7; d++) {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(startDate.getDate() + (w * 7) + d);
                    if (currentDate > now) {
                        html += '<div class="heatmap-cell empty" style="background: transparent;"></div>';
                        continue;
                    }
                    const count = dayCounts.get(currentDate.getTime()) || 0;
                    let level = 0;
                    if (count > 0)
                        level = 1;
                    if (count > 2)
                        level = 2;
                    if (count > 4)
                        level = 3;
                    if (count > 6)
                        level = 4;
                    const dateStr = currentDate.toISOString().split('T')[0];
                    html += `<div class="heatmap-cell ${count > 0 ? `level-${level}` : 'empty'}" title="${count} submissions on ${dateStr}"></div>`;
                }
                html += '</div>';
            }
            hmContainer.innerHTML = html;
        }
    }
    catch (e) {
        console.error('Codeforces Native render failed, keeping fallback SVGs.', e);
        // Fallback images remain visible
    }
}
