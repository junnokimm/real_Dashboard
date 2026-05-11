// analytics/funnel.js

const STEPS = [
  "home",
  "browse",
  "product",
  "cart",
  "checkout",
  "payment"
];

const DEFAULT_PATH_MAPPINGS = {
  home:     ["/", "/home"],
  browse:   ["/collection", "/category", "/search"],
  product:  ["/detail", "/product"],
  cart:     ["/cart"],
  checkout: ["/checkout"],
  payment:  ["/order-complete"],
};

function stepIndex(step) {
  const i = STEPS.indexOf(step);
  return i >= 0 ? i : 0;
}

function inferStepFromPath(pathname, pathMappings) {
  const p = String(pathname || "");
  const mappings = (pathMappings && typeof pathMappings === "object") ? pathMappings : DEFAULT_PATH_MAPPINGS;

  // operators may configure "purchase" key instead of "payment" — treat both as "payment"
  const stepsToCheck = [...STEPS];
  if (!stepsToCheck.includes("purchase") && Array.isArray(mappings["purchase"])) {
    stepsToCheck.push("purchase");
  }

  for (const step of stepsToCheck) {
    const prefixes = Array.isArray(mappings[step]) ? mappings[step] : (DEFAULT_PATH_MAPPINGS[step] || []);
    for (const prefix of prefixes) {
      const src = String(prefix || "").trim();
      if (!src) continue;
      if (src === "/" ? p === "/" : p.startsWith(src)) {
        return step === "purchase" ? "payment" : step;
      }
    }
  }

  return "browse";
}

function inferStepFromEvent(e, pathMappings) {
  if (!e) return "browse";
  if (e.event_name === "checkout_complete") return "payment";
  if (e.event_name === "checkout_start") return "checkout";
  if (e.event_name === "payment_attempt") return "payment";
  if (e.event_name === "add_to_cart" || e.event_name === "remove_from_cart") return "cart";

  if (e.event_name === "page_view") return inferStepFromPath(e.path, pathMappings);

  const props = e.props || {};
  const elid = typeof props.element_id === "string" ? props.element_id : "";
  if (elid.includes("pay") || elid.includes("payment")) return "payment";
  if (elid.includes("checkout")) return "checkout";
  if (elid.includes("cart")) return "cart";
  if (elid.includes("detail") || elid.includes("product")) return "product";

  return inferStepFromPath(e.path, pathMappings);
}

function maxStep(steps) {
  let m = "home";
  for (const s of steps || []) {
    if (stepIndex(s) > stepIndex(m)) m = s;
  }
  return m;
}

module.exports = {
  STEPS,
  DEFAULT_PATH_MAPPINGS,
  inferStepFromEvent,
  inferStepFromPath,
  maxStep,
  stepIndex
};
