const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const { computeLabeledSessionSummaries, buildInsightsInput, isInsightEligibleSummary } = require("../analytics/pipeline");
const { generateInsights, mergeInsights } = require("../insights/generator");

test("generateInsights returns fallback insight output matching labeled data", async () => {
  const fixture = path.join(__dirname, "..", "eval", "sample-events.jsonl");
  const labeled = await computeLabeledSessionSummaries(fixture, {
    site_id: "ab-sample",
    session_ttl_ms: 30 * 60 * 1000
  });

  const input = buildInsightsInput("ab-sample", labeled, { perLabelRepresentatives: 2 });
  const result = await generateInsights(input, { provider: "fallback" });

  assert.equal(result.provider, "fallback");
  assert.equal(result.output.site_id, "ab-sample");
  assert.equal(Array.isArray(result.output.insights), true);
  assert.equal(result.output.insights.length > 0, true);

  for (const insight of result.output.insights) {
    assert.equal(typeof insight.label, "string");
    assert.equal(typeof insight.where, "string");
    assert.equal(Array.isArray(insight.possible_causes), true);
    assert.equal(Array.isArray(insight.validation_methods), true);
    assert.equal(Array.isArray(insight.recommended_experiments), true);
  }
});

test("buildInsightsInput excludes login-only low-signal sessions", () => {
  const loginOnly = {
    summary: {
      session_id: "s_login",
      anon_user_id: "u_login",
      duration_ms: 72,
      page_views: 0,
      clicks: 0,
      depth: 1,
      unique_paths: ["/login"],
      checkout_entered: false,
      checkout_complete: false,
      error_count: 0,
      rage_clicks_count: 0,
      price_interaction_count: 0,
      filter_count: 0,
      search_count: 0,
      cart_add_count: 0,
      cart_remove_count: 0,
      payment_attempt_count: 0,
      max_step: "browse",
    },
    label: { label: "window_shopper", confidence: 0.8, evidence: [{ path: "/login" }] },
  };
  const valid = {
    summary: {
      session_id: "s_real",
      anon_user_id: "u_real",
      duration_ms: 17745,
      page_views: 1,
      clicks: 0,
      depth: 2,
      unique_paths: ["/", "/cart"],
      checkout_entered: false,
      checkout_complete: false,
      error_count: 0,
      rage_clicks_count: 0,
      price_interaction_count: 0,
      filter_count: 0,
      search_count: 0,
      cart_add_count: 0,
      cart_remove_count: 0,
      payment_attempt_count: 0,
      max_step: "cart",
    },
    label: { label: "window_shopper", confidence: 0.55, evidence: [{ path: "/" }, { path: "/cart" }] },
  };

  assert.equal(isInsightEligibleSummary(loginOnly.summary), false);
  assert.equal(isInsightEligibleSummary(valid.summary), true);

  const input = buildInsightsInput("legend-ecommerce", [loginOnly, valid], { perLabelRepresentatives: 2 });
  const bucket = input.labels.find((label) => label.label === "window_shopper");
  assert.ok(bucket);
  assert.equal(bucket.sessions, 1);
  assert.deepEqual(bucket.allowed_paths, ["/", "/cart"]);
  assert.equal(bucket.representatives.length, 1);
  assert.deepEqual(bucket.representatives[0].summary.unique_paths, ["/", "/cart"]);
});

test("mergeInsights falls back when where is not grounded in allowed paths", () => {
  const input = {
    site_id: "legend-ecommerce",
    generated_at: Date.now(),
    labels: [{
      label: "window_shopper",
      sessions: 1,
      share: 1,
      path_summary: "/, /cart",
      representative_steps: ["cart"],
      allowed_paths: ["/", "/cart"],
      representatives: [{
        session_id: "s_real",
        anon_user_id: "u_real",
        summary: { duration_ms: 17745, depth: 2, unique_paths: ["/", "/cart"] },
        evidence: [{ path: "/" }, { path: "/cart" }],
      }],
    }],
  };

  const merged = mergeInsights(input, {
    insights: [{
      label: "window_shopper",
      where: "browse and cart pages",
      possible_causes: ["x"],
      validation_methods: ["y"],
      recommended_experiments: [{
        hypothesis: "h",
        change: "c",
        primary_metric: "not_a_real_metric",
      }],
      priority: "high",
    }],
  });

  const insight = merged.insights[0];
  assert.notEqual(insight.where, "browse and cart pages");
  assert.equal(insight.where.includes("/cart") || insight.where.includes("/") , true);
  assert.equal(insight.recommended_experiments[0].primary_metric, "checkout_complete / sessions");
});
