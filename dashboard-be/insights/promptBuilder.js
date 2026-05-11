function summarizeRepresentative(rep) {
  const summary = rep?.summary || {};
  return {
    session_id: rep?.session_id || "",
    anon_user_id: rep?.anon_user_id || "",
    top_paths: Array.isArray(summary.unique_paths) ? summary.unique_paths.slice(0, 5) : [],
    metrics: {
      duration_ms: summary.duration_ms || 0,
      page_views: summary.page_views || 0,
      clicks: summary.clicks || 0,
      depth: summary.depth || 0,
      error_count: summary.error_count || 0,
      rage_clicks_count: summary.rage_clicks_count || 0,
      price_interaction_count: summary.price_interaction_count || 0,
      checkout_entered: Boolean(summary.checkout_entered),
      checkout_complete: Boolean(summary.checkout_complete),
      max_step: summary.max_step || "unknown"
    },
    evidence: Array.isArray(rep?.evidence) ? rep.evidence.slice(0, 5) : []
  };
}

function buildInsightsPrompt(input) {
  const safeInput = {
    site_id: input?.site_id || "",
    generated_at: input?.generated_at || Date.now(),
    labels: Array.isArray(input?.labels)
        ? input.labels.map((label) => ({
            label: label?.label || "unknown",
            sessions: label?.sessions || 0,
            share: label?.share || 0,
            path_summary: typeof label?.path_summary === "string" ? label.path_summary : "경로 근거 부족",
            allowed_paths: Array.isArray(label?.allowed_paths) ? label.allowed_paths.slice(0, 8) : [],
            representative_steps: Array.isArray(label?.representative_steps) ? label.representative_steps.slice(0, 6) : [],
            representatives: Array.isArray(label?.representatives)
              ? label.representatives.slice(0, 3).map(summarizeRepresentative)
              : []
        }))
      : []
  };

  return {
    system: [
      "You are a senior UX analyst.",
      "Return JSON only.",
      "Write insight text in Korean.",
      "Follow this schema exactly:",
      "{\"site_id\":string,\"generated_at\":number,\"insights\":[{\"label\":string,\"where\":string,\"possible_causes\":string[],\"validation_methods\":string[],\"recommended_experiments\":[{\"hypothesis\":string,\"change\":string,\"primary_metric\":string}],\"priority\":\"high\"|\"medium\"|\"low\"}]}",
      "Ground every insight in the provided summaries and evidence.",
      "Do not invent product facts outside the input.",
      "For `where`, use only actual path tokens from allowed_paths, path_summary, or representative evidence paths.",
      "Never invent generic page categories like browse page, product detail page, or cart page unless those exact path tokens appear in the input.",
      "If path evidence is weak, explicitly say 경로 근거 부족 instead of generalizing.",
      "Use only one of these primary metrics: checkout_complete / sessions, checkout_entered / sessions, page_view_to_click_rate, error_count / sessions, price_interaction_count."
    ].join(" "),
    user: JSON.stringify(safeInput, null, 2)
  };
}

module.exports = {
  buildInsightsPrompt
};
