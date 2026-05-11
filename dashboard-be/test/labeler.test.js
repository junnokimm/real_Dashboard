const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const { computeLabeledSessionSummaries } = require("../analytics/pipeline");
const { ruleOverExplorer, ruleWindowShopper, labelSessionSummary } = require("../analytics/labeler");

test("rules labeler assigns expected labels for fixture sessions", async () => {
  const fixture = path.join(__dirname, "..", "eval", "sample-events.jsonl");
  const expectedPath = path.join(__dirname, "..", "eval", "expected-labels.json");
  const expected = require(expectedPath);

  const labeled = await computeLabeledSessionSummaries(fixture, {
    site_id: "ab-sample",
    session_ttl_ms: 30 * 60 * 1000
  });

  const bySid = new Map();
  for (const x of labeled) {
    const sid = x.summary?.session_id;
    if (sid) bySid.set(sid, x.label?.label);
  }

  for (const [sid, expLabel] of Object.entries(expected)) {
    assert.equal(bySid.get(sid), expLabel, `session ${sid} label mismatch`);
  }
});

test("window shopper only matches short low-depth low-action browsing", () => {
  const shortSession = {
    checkout_entered: false,
    checkout_complete: false,
    page_views: 2,
    clicks: 1,
    depth: 2,
    duration_ms: 18000,
  };
  const longSession = {
    checkout_entered: false,
    checkout_complete: false,
    page_views: 2,
    clicks: 0,
    depth: 2,
    duration_ms: 180000,
  };

  assert.equal(ruleWindowShopper(shortSession)?.label, "window_shopper");
  assert.equal(ruleWindowShopper(longSession), null);
});

test("over explorer captures long low-action browse sessions", () => {
  const longBrowse = {
    checkout_entered: false,
    checkout_complete: false,
    page_views: 3,
    clicks: 0,
    depth: 2,
    duration_ms: 240000,
  };

  assert.equal(ruleOverExplorer(longBrowse)?.label, "over_explorer");
  assert.equal(labelSessionSummary(longBrowse).label, "over_explorer");
});
