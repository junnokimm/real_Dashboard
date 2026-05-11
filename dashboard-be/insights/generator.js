const { generateDummyInsights } = require("./dummyGenerator");
const { buildInsightsPrompt } = require("./promptBuilder");
const { callOpenAIChat } = require("./openaiProvider");

const ALLOWED_PRIMARY_METRICS = new Set([
  "checkout_complete / sessions",
  "checkout_entered / sessions",
  "page_view_to_click_rate",
  "error_count / sessions",
  "price_interaction_count",
]);

function normalizeString(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeStringList(value, fallback) {
  if (!Array.isArray(value)) return fallback.slice();
  const list = value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
  return list.length ? list : fallback.slice();
}

function normalizePriority(value, fallback) {
  return value === "high" || value === "medium" || value === "low" ? value : fallback;
}

function normalizeExperiments(value, fallback) {
  if (!Array.isArray(value)) return fallback.slice();

  const normalized = value
    .map((item) => ({
      hypothesis: normalizeString(item?.hypothesis, "사용자 마찰 지점을 줄이면 전환이 개선된다"),
      change: normalizeString(item?.change, "핵심 단계의 정보 구조와 CTA를 더 명확히 조정한다"),
      primary_metric: normalizePrimaryMetric(item?.primary_metric, "checkout_complete / sessions")
    }))
    .filter((item) => item.hypothesis && item.change && item.primary_metric);

  return normalized.length ? normalized : fallback.slice();
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractPathTokens(text) {
  return Array.from(new Set(
    String(text || "").match(/\/[A-Za-z0-9._~!$&'()*+,;=:@%\/-]*/g) || []
  ));
}

function normalizePrimaryMetric(value, fallback) {
  const metric = normalizeString(value, fallback);
  return ALLOWED_PRIMARY_METRICS.has(metric) ? metric : fallback;
}

function buildLabelContext(input) {
  const map = new Map();
  for (const label of Array.isArray(input?.labels) ? input.labels : []) {
    map.set(label?.label, {
      allowedPaths: Array.isArray(label?.allowed_paths)
        ? label.allowed_paths.filter((path) => typeof path === "string" && path)
        : [],
      pathSummary: typeof label?.path_summary === "string" ? label.path_summary : "",
    });
  }
  return map;
}

function normalizeWhere(value, fallback, ctx) {
  const candidate = normalizeString(value, fallback);
  const lower = candidate.toLowerCase();
  if (lower.includes("/login") || lower.includes("/logout")) return fallback;

  const allowedPaths = Array.isArray(ctx?.allowedPaths) ? ctx.allowedPaths : [];
  const candidatePaths = extractPathTokens(candidate);
  if (!candidatePaths.length) return fallback;
  return candidatePaths.every((path) => allowedPaths.includes(path)) ? candidate : fallback;
}

function mergeInsights(input, candidateOutput) {
  const fallback = generateDummyInsights(input);
  const labelContext = buildLabelContext(input);
  const byLabel = new Map();
  for (const insight of Array.isArray(candidateOutput?.insights) ? candidateOutput.insights : []) {
    if (typeof insight?.label === "string" && insight.label) {
      byLabel.set(insight.label, insight);
    }
  }

  return {
    site_id: input?.site_id || fallback.site_id,
    generated_at: Date.now(),
    insights: fallback.insights.map((baseInsight) => {
      const candidate = byLabel.get(baseInsight.label);
      if (!candidate) return baseInsight;
      const ctx = labelContext.get(baseInsight.label);

      return {
        label: baseInsight.label,
        where: normalizeWhere(candidate.where, baseInsight.where, ctx),
        possible_causes: normalizeStringList(candidate.possible_causes, baseInsight.possible_causes),
        validation_methods: normalizeStringList(candidate.validation_methods, baseInsight.validation_methods),
        recommended_experiments: normalizeExperiments(candidate.recommended_experiments, baseInsight.recommended_experiments),
        priority: normalizePriority(candidate.priority, baseInsight.priority)
      };
    })
  };
}

function resolveProvider(opts) {
  const explicit = String(opts?.provider || "").trim().toLowerCase();
  if (explicit) return explicit;
  return String(process.env.UX_INSIGHTS_PROVIDER || "fallback").trim().toLowerCase() || "fallback";
}

async function generateInsights(input, opts) {
  const provider = resolveProvider(opts);
  const prompt = buildInsightsPrompt(input);

  if (provider === "openai") {
    try {
      const result = await callOpenAIChat(prompt, {
        apiKey: opts?.apiKey || process.env.UX_INSIGHTS_API_KEY,
        baseUrl: opts?.baseUrl || process.env.UX_INSIGHTS_BASE_URL,
        model: opts?.model || process.env.UX_INSIGHTS_MODEL
      });

      return {
        provider: "openai",
        model: result.model,
        prompt,
        output: mergeInsights(input, safeParseJson(result.content))
      };
    } catch (error) {
      return {
        provider: "fallback",
        model: null,
        prompt,
        fallbackReason: String(error),
        output: generateDummyInsights(input)
      };
    }
  }

  return {
    provider: "fallback",
    model: null,
    prompt,
    output: generateDummyInsights(input)
  };
}

module.exports = {
  generateInsights,
  mergeInsights,
  resolveProvider
};
