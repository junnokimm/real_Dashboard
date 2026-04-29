const { createFileEventStore } = require("../stores/event-store");

function createEventsService({ eventsFile, eventStore }) {
  const resolvedEventStore = eventStore || createFileEventStore({ eventsFile });

  function getEventTs(event) {
    if (typeof event?.ts === "number") return event.ts;
    if (typeof event?.received_at === "number") return event.received_at;
    return null;
  }

  function createTrendBuckets(events, fromTs, toTs) {
    const now = Date.now();
    const start = typeof fromTs === "number" ? fromTs : Math.min(...events.map((e) => getEventTs(e)).filter((ts) => typeof ts === "number"));
    const end = typeof toTs === "number" ? toTs : Math.max(...events.map((e) => getEventTs(e)).filter((ts) => typeof ts === "number"), now);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];

    const span = end - start;
    const bucketMs = span <= 24 * 60 * 60 * 1000
      ? 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;

    const bucketMap = new Map();

    for (let ts = start; ts <= end; ts += bucketMs) {
      const key = Math.floor(ts / bucketMs) * bucketMs;
      if (!bucketMap.has(key)) bucketMap.set(key, { ts: key, event_count: 0, sessions: new Set() });
    }

    for (const event of events) {
      const ts = getEventTs(event);
      if (typeof ts !== "number") continue;
      const key = Math.floor(ts / bucketMs) * bucketMs;
      if (!bucketMap.has(key)) bucketMap.set(key, { ts: key, event_count: 0, sessions: new Set() });
      const bucket = bucketMap.get(key);
      bucket.event_count += 1;
      if (event.session_id) bucket.sessions.add(event.session_id);
    }

    return Array.from(bucketMap.values())
      .sort((a, b) => a.ts - b.ts)
      .map((bucket) => ({
        ts: bucket.ts,
        session_count: bucket.sessions.size,
        event_count: bucket.event_count,
      }));
  }

  function getEventSummary({ siteId, page, fromTs, toTs }) {
    const events = resolvedEventStore.readAll().filter((e) => {
      if (e.site_id !== siteId) return false;
      const ts = getEventTs(e);
      if ((typeof fromTs === "number" || typeof toTs === "number") && typeof ts !== "number") return false;
      if (typeof fromTs === "number" && ts < fromTs) return false;
      if (typeof toTs === "number" && ts > toTs) return false;
      return true;
    });
    const filtered = page ? events.filter((e) => (e.path || "").startsWith(page)) : events;

    const pageViews = new Map();
    const elementClicks = new Map();
    const sessionTimeline = new Map();
    let checkoutComplete = 0;
    let checkoutPageViews = 0;
    let detailPageViews = 0;

    for (const e of filtered) {
      if (e.event_name === "page_view") {
        pageViews.set(e.path || "/", (pageViews.get(e.path || "/") || 0) + 1);
        if (e.path === "/checkout") checkoutPageViews += 1;
        if (e.path === "/detail") detailPageViews += 1;
      }
      if (e.event_name === "click") {
        const elementId = e.props?.element_id || "(unknown)";
        elementClicks.set(elementId, (elementClicks.get(elementId) || 0) + 1);
      }
      if (e.event_name === "checkout_complete") checkoutComplete += 1;

      const sid = e.session_id || "no_session";
      if (!sessionTimeline.has(sid)) sessionTimeline.set(sid, []);
      sessionTimeline.get(sid).push({ ts: e.ts || e.received_at || 0, path: e.path || "/" });
    }

    const transitionCount = new Map();
    for (const list of sessionTimeline.values()) {
      list.sort((a, b) => a.ts - b.ts);
      for (let i = 1; i < list.length; i += 1) {
        const prev = list[i - 1].path;
        const next = list[i].path;
        if (prev === next) continue;
        const key = `${prev}=>${next}`;
        transitionCount.set(key, (transitionCount.get(key) || 0) + 1);
      }
    }

    const topPages = Array.from(pageViews.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    const topElements = Array.from(elementClicks.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([element_id, count]) => ({ element_id, count }));

    const flow = Array.from(transitionCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([edge, count]) => {
        const [from, to] = edge.split("=>");
        return { from, to, count };
      });

    return {
      ok: true,
      site_id: siteId,
      from_ts: fromTs,
      to_ts: toTs,
      total_events: filtered.length,
      top_pages: topPages,
      top_elements: topElements,
      page_flow: flow,
      trend: createTrendBuckets(filtered, fromTs, toTs),
      funnel: {
        detail_page_view: detailPageViews,
        checkout_page_view: checkoutPageViews,
        checkout_complete: checkoutComplete,
        checkout_completion_rate: checkoutPageViews > 0 ? checkoutComplete / checkoutPageViews : 0,
      },
    };
  }

  return { getEventSummary };
}

module.exports = { createEventsService };
