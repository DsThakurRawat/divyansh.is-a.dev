async function test() {
    try {
        const handle = 'lost_boy21';
        const res = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
        const data = await res.json();
        
        if (data.status !== 'OK') throw new Error('API failed');
        const subs = data.result;
        
        const now = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        oneYearAgo.setHours(0, 0, 0, 0);

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        oneMonthAgo.setHours(0,0,0,0);

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
            if (date >= oneYearAgo) lastYearDays.add(dateStr);
            if (date >= oneMonthAgo) lastMonthDays.add(dateStr);
            
            if (sub.verdict === 'OK' && sub.problem && sub.problem.name) {
                const problemKey = sub.problem.name;
                okProblemsAllTime.add(problemKey);
                if (date >= oneYearAgo) okProblemsLastYear.add(problemKey);
                if (date >= oneMonthAgo) okProblemsLastMonth.add(problemKey);
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
                } else {
                    const diff = Math.round((cur.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
                    if (diff === 1) current++;
                    else if (diff > 1) current = 1;
                }
                maxStreak = Math.max(maxStreak, current);
                prevDate = cur;
            }
            return maxStreak;
        };

        console.log("Stats:");
        console.log("All time:", okProblemsAllTime.size, calculateStreak(allDays));
        console.log("Last year:", okProblemsLastYear.size, calculateStreak(lastYearDays));
        console.log("Last month:", okProblemsLastMonth.size, calculateStreak(lastMonthDays));
        console.log("SUCCESS");
    } catch (e) {
        console.error("ERROR", e);
    }
}
test();
