---
title: The contribution heatmap on this site draws fewer weeks on a phone
date: 2026-08-18
summary: A 53-week grid is 742px wide. No phone can show that, so the grid asks how much room it has and draws only the columns that fit.
tags: [frontend, ux]
draft: false
---

Every GitHub-style contribution heatmap has the same problem on mobile. The grid is 53 columns of 7 cells. At a 12px cell with a 2px gap that is 742 pixels, and the widest phone in common use gives you about 390. Most sites solve it by putting the grid in a horizontal scroller.

That solution is worse than it looks. The most interesting part of a contribution graph is the right-hand edge, because that is this week. Put it in a scroller and the default view shows a year ago, with the part anyone cares about parked off-screen behind a gesture nobody performs.

## Ask the container first

The grid on this page measures its own host before it draws anything:

```js
function weeksThatFit(prefix) {
    var grid = document.getElementById(prefix + '-grid');
    var host = grid && grid.parentElement;
    var w = host ? host.clientWidth : 0;
    if (!w) return WEEKS_MAX;
    return Math.max(10, Math.min(WEEKS_MAX, Math.floor(w / cellStep())));
}
```

`cellStep()` returns 14 on desktop and 12 below 560px, matching the cell and gap sizes in the stylesheet. Whatever comes back is how many week-columns get rendered, ending with the current week. On a laptop that is the full 53. On a phone it is closer to 30.

The count under the grid then has to stop lying about the range:

```js
var span = WEEKS >= WEEKS_MAX
    ? 'in the last year'
    : 'in the last ' + Math.max(1, Math.round(WEEKS / 4.345)) + ' months';
```

So a phone reads "412 contributions in the last 7 months" instead of claiming a year it never drew. Fewer weeks, no scrollbar, and the label is still true.

There is one catch. Column count depends on width, so rotating the phone invalidates the layout. A resize listener re-runs `weeksThatFit` and only re-renders when the number actually changed, which is why the rendered counts are kept in memory rather than refetched.

## Shading against yourself, not against a constant

The other thing worth doing differently is the colour ramp. Fixed thresholds — 1 commit is level one, 10 is level four — make a normal month look empty next to whoever you borrowed the thresholds from.

These cells are bucketed against the quartiles of the person's own non-zero days:

```js
var q = function (p) { return vals[Math.min(vals.length - 1, Math.floor(vals.length * p))]; };
var t1 = q(0.25), t2 = q(0.5), t3 = q(0.75);
```

A quiet year still shows contrast, because the scale is relative to that year. It is a graph of your rhythm, not a leaderboard.

## Codeforces makes you work for it

The last piece is unrelated to layout but was the thing that actually kept the card blank. Codeforces rate-limits to roughly one call every two seconds, and it signals a violation by returning **HTTP 200** with `{"status":"FAILED"}` in the body.

> A 200 that means failure defeats every `fetch().then()` you have written. `r.ok` is true, `JSON.parse` succeeds, and you render a card from an error.

Two things fix it. Check `status` rather than the HTTP code, and space the calls out instead of firing them together:

```js
function cfUnwrap(d) {
    if (!d || d.status !== 'OK' || !d.result) {
        throw new Error(d && d.comment ? d.comment : 'CF request failed');
    }
    return d.result;
}
```

The card also has a serverless proxy behind it as a second route, which helps mostly because it comes from a different source IP and caches at the edge.

And when both routes fail, the card does not disappear. It renders an empty grid with a note saying the API could not be reached. A block that silently vanishes reads as a broken layout. A block that says what went wrong reads as a site someone maintains.
