// public/dashboard.js
(function () {
  const DEFAULT_SITE_ID = "legend-ecommerce";
  const SITE_STORAGE_KEY = "uxsdk.dashboard.siteId";

  const expTbody = document.getElementById("expTbody");
  const expTableWrap = document.getElementById("expTableWrap");
  const expEmptyState = document.getElementById("expEmptyState");
  const refreshBtn = document.getElementById("refreshBtn");
  const siteSelect = document.getElementById("siteSelect");
  const authUserLabel = document.getElementById("authUserLabel");
  const logoutBtn = document.getElementById("logoutBtn");
  const siteIdText = document.getElementById("siteIdText");
  const topEditorLink = document.getElementById("topEditorLink");
  const emptyEditorLink = document.getElementById("emptyEditorLink");
  const quickTestLinks = document.getElementById("quickTestLinks");
  const quickTestHint = document.getElementById("quickTestHint");
  const sessionsSourceLabel = document.getElementById("sessionsSourceLabel");
  const periodPreset = document.getElementById("periodPreset");
  const customDateRange = document.getElementById("customDateRange");
  const customFromDate = document.getElementById("customFromDate");
  const customToDate = document.getElementById("customToDate");
  const periodStatusText = document.getElementById("periodStatusText");
  const trendChartCard = document.getElementById("trendChartCard");
  const labelDonut = document.getElementById("labelDonut");
  const labelDonutTotal = document.getElementById("labelDonutTotal");
  const uxSessionHint = document.getElementById("uxSessionHint");
  const uxTopLabelHint = document.getElementById("uxTopLabelHint");
  const uxPriorityHint = document.getElementById("uxPriorityHint");

  const settingsBtn = document.getElementById("settingsBtn");
  const userManagementDialog = document.getElementById("userManagementDialog");
  const closeDialogBtn = document.getElementById("closeDialogBtn");
  const usersTbody = document.getElementById("usersTbody");
  const userCountText = document.getElementById("userCountText");
  const createUserForm = document.getElementById("createUserForm");
  const userUsernameInput = document.getElementById("userUsernameInput");
  const userDisplayNameInput = document.getElementById("userDisplayNameInput");
  const userPasswordInput = document.getElementById("userPasswordInput");
  const userActiveInput = document.getElementById("userActiveInput");
  const userSiteChecklist = document.getElementById("userSiteChecklist");
  const createUserBtn = document.getElementById("createUserBtn");
  const resetUserFormBtn = document.getElementById("resetUserFormBtn");
  const userFormStatus = document.getElementById("userFormStatus");

  const metricsCard = document.getElementById("metricsCard");
  const metricKeyEl = document.getElementById("metricKey");
  const cvrA = document.getElementById("cvrA");
  const cvrB = document.getElementById("cvrB");
  const ctrA = document.getElementById("ctrA");
  const ctrB = document.getElementById("ctrB");
  const brA = document.getElementById("brA");
  const brB = document.getElementById("brB");
  const countsBox = document.getElementById("countsBox");
  const topA = document.getElementById("topA");
  const topB = document.getElementById("topB");

  const uxTotalSessions = document.getElementById("uxTotalSessions");
  const uxTopLabel = document.getElementById("uxTopLabel");
  const uxHighPriorityCount = document.getElementById("uxHighPriorityCount");
  const labelBars = document.getElementById("labelBars");
  const opportunityList = document.getElementById("opportunityList");
  const labelSummaryBody = document.getElementById("labelSummaryBody");
  const sessionsBody = document.getElementById("sessionsBody");
  const insightsList = document.getElementById("insightsList");
  const copilotExperimentKey = document.getElementById("copilotExperimentKey");
  const copilotDraftStatus = document.getElementById("copilotDraftStatus");
  const saveDraftBtn = document.getElementById("saveDraftBtn");
  const openDraftInEditorBtn = document.getElementById("openDraftInEditorBtn");

  const DRAFT_STORAGE_KEY = "uxsdk.analyticsCopilotDraft";
  const state = {
    siteId: resolveSiteId(),
    sites: [],
    siteConfig: null,
    experiments: [],
    selectedExperimentKey: null,
    latestDraft: null,
    chatWidget: null,
    sessionsSource: "analytics",
    authUser: null,
    users: [],
    userFetchError: null,
    newUserSiteIds: [],
    periodPreset: "7d",
    customFromDate: "",
    customToDate: "",
  };

  // ─── 한국어 라벨 매핑 ───
  const LABEL_KO = {
    ux_friction_dropper: "불편 겪고 이탈",
    checkout_abandoner: "결제 전 이탈",
    price_sensitive_dropper: "가격·혜택 비교형",
    over_explorer: "여러 화면 오래 탐색",
    window_shopper: "가볍게 둘러보기",
  };

  const STATUS_KO = {
    running: "진행 중",
    paused: "멈춤",
    draft: "작성 중",
    archived: "보관함",
  };

  const LABEL_ORDER = [
    "over_explorer",
    "price_sensitive_dropper",
    "window_shopper",
    "ux_friction_dropper",
    "checkout_abandoner",
  ];

  const LABEL_DESC = {
    over_explorer: "여러 화면을 오래 둘러보지만 결정을 미루는 패턴",
    price_sensitive_dropper: "가격·혜택·배송 조건을 비교하다 이탈하는 패턴",
    window_shopper: "가볍게 둘러보다 구매 행동 없이 종료하는 패턴",
    ux_friction_dropper: "불편이나 오류를 겪은 뒤 흐름을 이탈하는 패턴",
    checkout_abandoner: "장바구니·결제 단계에서 구매 완료로 이어지지 않는 패턴",
  };

  const LABEL_COLORS = ["#5b76fe", "#7d92ff", "#ff7a45", "#ffb14a", "#ff5f7a"];

  function labelName(label) {
    return LABEL_KO[label] || label || "알 수 없음";
  }

  function statusName(status) {
    return STATUS_KO[status] || status || "—";
  }

  function labelDescription(label) {
    return LABEL_DESC[label] || "아직 설명이 준비되지 않았습니다.";
  }

  // ─── 도우미 ───
  function fmtPct(x) {
    if (typeof x !== "number" || !isFinite(x)) return "—";
    return (x * 100).toFixed(2) + "%";
  }
  function fmtDate(ts) {
    if (!ts) return "—";
    return new Date(ts).toLocaleString("ko-KR");
  }
  function fmtInt(x) {
    if (typeof x !== "number" || !isFinite(x)) return "—";
    return Math.round(x).toLocaleString("ko-KR");
  }
  function fmtDuration(ms) {
    if (typeof ms !== "number" || !isFinite(ms)) return "—";
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}초`;
  }
  function fmtSignedPct(value) {
    if (typeof value !== "number" || !isFinite(value)) return "—";
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  }
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function toDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseDateRangeStart(value) {
    if (!value) return null;
    return new Date(`${value}T00:00:00`).getTime();
  }

  function parseDateRangeEnd(value) {
    if (!value) return null;
    return new Date(`${value}T23:59:59.999`).getTime();
  }

  function syncPeriodInputs() {
    const today = new Date();
    const defaultTo = toDateInputValue(today);
    const defaultFrom = toDateInputValue(new Date(today.getTime() - (6 * 24 * 60 * 60 * 1000)));
    if (!state.customFromDate) state.customFromDate = defaultFrom;
    if (!state.customToDate) state.customToDate = defaultTo;
    if (periodPreset) periodPreset.value = state.periodPreset;
    if (customFromDate) customFromDate.value = state.customFromDate;
    if (customToDate) customToDate.value = state.customToDate;
    if (customDateRange) customDateRange.hidden = state.periodPreset !== "custom";
  }

  function getPeriodRange() {
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (state.periodPreset === "today") {
      return { label: "오늘", fromTs: today.getTime(), toTs: now };
    }
    if (state.periodPreset === "30d") {
      return { label: "최근 30일", fromTs: now - (29 * 24 * 60 * 60 * 1000), toTs: now };
    }
    if (state.periodPreset === "custom") {
      const fromTs = parseDateRangeStart(state.customFromDate);
      const toTs = parseDateRangeEnd(state.customToDate);
      if (typeof fromTs === "number" && typeof toTs === "number" && fromTs <= toTs) {
        return { label: "사용자 지정 기간", fromTs, toTs };
      }
      return { label: "사용자 지정 기간", fromTs: null, toTs: null };
    }
    return { label: "최근 7일", fromTs: now - (6 * 24 * 60 * 60 * 1000), toTs: now };
  }

  function buildPeriodQuery() {
    const range = getPeriodRange();
    const params = new URLSearchParams();
    if (typeof range.fromTs === "number") params.set("from_ts", String(range.fromTs));
    if (typeof range.toTs === "number") params.set("to_ts", String(range.toTs));
    return { range, query: params.toString() };
  }

  function updatePeriodStatus() {
    syncPeriodInputs();
    if (!periodStatusText) return;
    const range = getPeriodRange();
    if (state.periodPreset === "custom" && (range.fromTs == null || range.toTs == null)) {
      periodStatusText.textContent = "사용자 지정 기간을 선택하려면 시작일과 종료일을 모두 입력해 주세요.";
      return;
    }
    const fromText = typeof range.fromTs === "number" ? new Date(range.fromTs).toLocaleDateString("ko-KR") : "—";
    const toText = typeof range.toTs === "number" ? new Date(range.toTs).toLocaleDateString("ko-KR") : "—";
    periodStatusText.textContent = `${range.label} · ${fromText} ~ ${toText} 기준으로 카드와 그래프를 집계합니다.`;
  }

  // ─── 도움말 팝오버 ───
  const helpButtons = Array.from(document.querySelectorAll(".helpBtn"));
  function closeHelpPopovers() {
    helpButtons.forEach((button) => {
      button.setAttribute("aria-expanded", "false");
      const p = document.getElementById(button.dataset.helpTarget || "");
      if (p) p.classList.remove("is-open");
    });
  }
  function toggleHelpPopover(button) {
    const popover = document.getElementById(button?.dataset.helpTarget || "");
    if (!popover) return;
    const willOpen = !popover.classList.contains("is-open");
    closeHelpPopovers();
    if (willOpen) {
      popover.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
    }
  }

  // ─── 인증 ───
  async function fetchAuthMe() {
    const r = await fetch("/api/auth/me");
    if (r.status === 401) {
      location.href = `/login?next=${encodeURIComponent(location.pathname + location.search)}`;
      throw new Error("unauthorized");
    }
    const j = await r.json();
    if (!j?.ok || !j.user) throw new Error(j?.reason || "auth fetch failed");
    return j.user;
  }

  function enforceAuthorizedSiteId() {
    const allowed = Array.isArray(state.authUser?.allowed_site_ids) ? state.authUser.allowed_site_ids : [];
    if (allowed.length === 0) { state.siteId = DEFAULT_SITE_ID; return; }
    if (!allowed.includes(state.siteId)) {
      state.siteId = state.authUser.default_site_id || allowed[0];
    }
  }

  function resolveSiteId() {
    const params = new URLSearchParams(location.search);
    return (params.get("site_id") || "").trim()
      || (localStorage.getItem(SITE_STORAGE_KEY) || "").trim()
      || DEFAULT_SITE_ID;
  }

  function setSiteInUrl(siteId) {
    const url = new URL(location.href);
    url.searchParams.set("site_id", siteId);
    history.replaceState({}, "", url.toString());
  }

  function ensureSiteOption(siteId) {
    if (!siteSelect || !siteId) return;
    if (!Array.from(siteSelect.options).some((o) => o.value === siteId)) {
      const o = document.createElement("option");
      o.value = siteId;
      o.textContent = siteId;
      siteSelect.appendChild(o);
    }
  }

  function getCurrentSiteId() { return state.siteId || DEFAULT_SITE_ID; }

  // ─── API ───
  async function fetchSites() {
    const r = await fetch("/api/sites");
    const j = await r.json();
    if (!j?.ok) throw new Error(j?.reason || "sites fetch failed");
    return Array.isArray(j.sites) ? j.sites : [];
  }

  async function parseJsonResponse(response, fallbackMessage) {
    const text = await response.text();
    try { return text ? JSON.parse(text) : {}; }
    catch (_) { throw new Error(text || fallbackMessage); }
  }

  async function fetchUsers() {
    const r = await fetch("/api/users");
    if (r.status === 401) {
      location.href = `/login?next=${encodeURIComponent(location.pathname + location.search)}`;
      throw new Error("unauthorized");
    }
    const j = await parseJsonResponse(r, "users fetch failed");
    if (!j?.ok) throw new Error(j?.reason || "users fetch failed");
    return Array.isArray(j.users) ? j.users : [];
  }

  async function fetchExperiments() {
    const r = await fetch(`/api/experiments?site_id=${encodeURIComponent(getCurrentSiteId())}`);
    const j = await r.json();
    if (!j?.ok) throw new Error("experiments fetch failed");
    return j.experiments || [];
  }

  async function setStatus(id, status) {
    const siteId = getCurrentSiteId();
    const r = await fetch(`/api/experiments/${encodeURIComponent(id)}?site_id=${encodeURIComponent(siteId)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, site_id: siteId }),
    });
    const j = await r.json();
    if (!j?.ok) throw new Error(j?.reason || "status update failed");
    return j.experiment;
  }

  async function saveDraftExperiment(payload) {
    const r = await fetch("/api/experiments/draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!j?.ok) throw new Error(j?.reason || "draft save failed");
    return j.experiment;
  }

  async function deleteExp(id) {
    const r = await fetch(`/api/experiments/${encodeURIComponent(id)}?site_id=${encodeURIComponent(getCurrentSiteId())}`, { method: "DELETE" });
    const j = await r.json();
    if (!j?.ok) throw new Error(j?.reason || "delete failed");
  }

  async function fetchMetrics(key) {
    const r = await fetch(`/api/metrics?site_id=${encodeURIComponent(getCurrentSiteId())}&key=${encodeURIComponent(key)}`);
    const j = await r.json();
    if (!j?.ok) throw new Error(j?.reason || "metrics failed");
    return j;
  }

  async function fetchEventSummary() {
    const { query } = buildPeriodQuery();
    const suffix = query ? `&${query}` : "";
    const r = await fetch(`/api/event-summary?site_id=${encodeURIComponent(getCurrentSiteId())}${suffix}`);
    const j = await r.json();
    if (!j?.ok) throw new Error(j?.reason || "event summary failed");
    return j;
  }

  async function fetchSessions() {
    const siteId = encodeURIComponent(getCurrentSiteId());
    const { query } = buildPeriodQuery();
    const suffix = query ? `&${query}` : "";
    try {
      if (state.periodPreset === "today") {
        const rr = await fetch(`/api/realtime/sessions?site_id=${siteId}&limit=12`);
        const rj = await rr.json();
        if (rj?.ok) {
          state.sessionsSource = rj.source || "redis";
          return Array.isArray(rj.sessions) ? rj.sessions : [];
        }
      }
    } catch (_) { /* fallback */ }

    const r = await fetch(`/api/sessions?site_id=${siteId}&limit=12${suffix}`);
    const j = await r.json();
    if (!j?.ok) throw new Error(j?.reason || "sessions failed");
    state.sessionsSource = "analytics";
    return j.sessions || [];
  }

  async function fetchLabelsSummary() {
    const { query } = buildPeriodQuery();
    const suffix = query ? `&${query}` : "";
    const r = await fetch(`/api/labels/summary?site_id=${encodeURIComponent(getCurrentSiteId())}${suffix}`);
    const j = await r.json();
    if (!j?.ok) throw new Error(j?.reason || "labels summary failed");
    return j.summary || [];
  }

  async function fetchInsights(periodAware) {
    const suffix = periodAware ? (() => {
      const { query } = buildPeriodQuery();
      return query ? `&${query}` : "";
    })() : "";
    const r = await fetch(`/api/insights?site_id=${encodeURIComponent(getCurrentSiteId())}&reps=3${suffix}`);
    const j = await r.json();
    if (!j?.ok) throw new Error(j?.reason || "insights failed");
    return j;
  }

  // ─── 사이트 UI ───
  function getCurrentSiteConfig() {
    if (state.siteConfig?.site_id === getCurrentSiteId()) return state.siteConfig;
    return state.sites.find((s) => s.site_id === getCurrentSiteId()) || null;
  }

  function populateSiteSelect() {
    if (!siteSelect) return;
    const current = getCurrentSiteId();
    siteSelect.innerHTML = "";
    const sites = state.sites.length ? state.sites : [{ site_id: current, name: current }];
    sites.forEach((site) => {
      const o = document.createElement("option");
      o.value = site.site_id;
      o.textContent = site.name ? `${site.name} (${site.site_id})` : site.site_id;
      siteSelect.appendChild(o);
    });
    ensureSiteOption(current);
    siteSelect.value = current;
  }

  function renderQuickTestLinks() {
    if (!quickTestLinks) return;
    const site = getCurrentSiteConfig();
    const targets = Array.isArray(site?.preview_targets) ? site.preview_targets.slice(0, 3) : [];
    if (targets.length === 0) {
      quickTestLinks.innerHTML = '<span class="emptyState" style="padding:var(--space-3);">미리볼 주소가 설정돼 있지 않아요.</span>';
      return;
    }
    quickTestLinks.innerHTML = targets.map((t) =>
      `<a class="btnPrimary" href="${escapeHtml(t.live_url || t.preview_url || "/")}" target="_blank" rel="noopener">${escapeHtml(t.label || t.url_prefix || "열기")}</a>`
    ).join("");
  }

  function getEditorUrl(extraParams) {
    const url = new URL("/editor", location.origin);
    url.searchParams.set("site_id", getCurrentSiteId());
    if (extraParams && typeof extraParams === "object") {
      Object.entries(extraParams).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).trim() !== "") url.searchParams.set(k, String(v));
      });
    }
    return `${url.pathname}${url.search}`;
  }

  function updateSiteContextUI() {
    enforceAuthorizedSiteId();
    const siteId = getCurrentSiteId();
    state.siteConfig = getCurrentSiteConfig();
    ensureSiteOption(siteId);
    populateSiteSelect();
    if (siteIdText) siteIdText.textContent = siteId;
    if (authUserLabel) authUserLabel.textContent = state.authUser ? (state.authUser.display_name || state.authUser.username) : "";
    if (settingsBtn) settingsBtn.style.display = state.authUser?.is_admin ? "" : "none";
    if (topEditorLink) topEditorLink.href = getEditorUrl();
    if (emptyEditorLink) emptyEditorLink.href = getEditorUrl();
    renderQuickTestLinks();
    if (quickTestHint) {
      quickTestHint.textContent = "한 브라우저에서는 A·B 중 하나에 고정돼요. 다른 조합을 보려면 시크릿 창을 쓰면 됩니다.";
    }
  }

  // ─── 사용자 관리 (모달) ───
  function normalizeUserAccess(user) {
    const fallbackRole = String(user?.role || user?.user_role || "").trim();
    const bySiteId = new Map();
    function pushAccess(siteId, role) {
      const sid = String(siteId || "").trim();
      if (!sid) return;
      const r = String(role || "").trim();
      if (!bySiteId.has(sid)) { bySiteId.set(sid, { site_id: sid, role: r }); return; }
      const cur = bySiteId.get(sid);
      if (cur && !cur.role && r) cur.role = r;
    }
    function pushEntry(entry) {
      if (!entry) return;
      if (typeof entry === "string") { pushAccess(entry, fallbackRole); return; }
      if (typeof entry !== "object") return;
      pushAccess(entry.site_id || entry.siteId || entry.id || entry.value, entry.role || entry.site_role || entry.access_role || fallbackRole);
    }
    [user?.site_access, user?.siteAccess, user?.access, user?.sites, user?.site_roles, user?.roles].forEach((l) => { if (Array.isArray(l)) l.forEach(pushEntry); });
    [user?.allowed_site_ids, user?.accessible_site_ids, user?.site_ids].forEach((l) => { if (Array.isArray(l)) l.forEach((sid) => pushAccess(sid, fallbackRole)); });
    [user?.roles_by_site, user?.role_by_site, user?.site_roles].forEach((m) => {
      if (!m || typeof m !== "object" || Array.isArray(m)) return;
      Object.entries(m).forEach(([sid, role]) => pushAccess(sid, role));
    });
    return Array.from(bySiteId.values()).sort((a, b) => a.site_id.localeCompare(b.site_id));
  }

  function normalizeUserRecord(user) {
    const username = String(user?.username || user?.user_name || "").trim() || "—";
    const displayName = String(user?.display_name || user?.displayName || "").trim() || username;
    return {
      id: String(user?.id || username),
      username,
      display_name: displayName,
      is_admin: user?.is_admin === true,
      active: user?.active !== false && user?.disabled !== true && String(user?.status || "").trim().toLowerCase() !== "inactive",
      access: normalizeUserAccess(user),
      updated_at: user?.updated_at || user?.updatedAt || user?.created_at || user?.createdAt || null,
    };
  }

  function renderUsers(users) {
    const list = Array.isArray(users) ? users.map(normalizeUserRecord) : [];
    state.users = list;
    if (userCountText) {
      userCountText.textContent = state.userFetchError
        ? "(목록을 불러오지 못했어요)"
        : list.length ? `· ${fmtInt(list.length)}명` : "";
    }
    if (!usersTbody) return;
    if (state.userFetchError) {
      usersTbody.innerHTML = `<tr><td colspan="5" class="emptyState">${escapeHtml(state.userFetchError)}</td></tr>`;
      return;
    }
    if (list.length === 0) {
      usersTbody.innerHTML = '<tr><td colspan="5" class="emptyState">아직 만든 계정이 없어요.</td></tr>';
      return;
    }
    usersTbody.innerHTML = list.map((u) => {
      const accessHtml = u.access.length
        ? `<div class="tagRow">${u.access.map((e) => `<span class="badge label">${escapeHtml(e.role ? `${e.role} · ${e.site_id}` : e.site_id)}</span>`).join("")}</div>`
        : '<span class="muted">없음</span>';
      const statusBadge = u.active ? '<span class="badge running">활성</span>' : '<span class="badge paused">비활성</span>';
      const adminBadge = u.is_admin ? ' <span class="badge label">관리자</span>' : '';
      return `<tr>
        <td class="mono">${escapeHtml(u.username)}</td>
        <td>${escapeHtml(u.display_name)}</td>
        <td>${statusBadge}${adminBadge}</td>
        <td>${accessHtml}</td>
        <td>${fmtDate(u.updated_at)}</td>
      </tr>`;
    }).join("");
  }

  function getAvailableUserSiteIds() {
    return state.sites.map((s) => String(s?.site_id || "").trim()).filter(Boolean);
  }
  function deriveDefaultNewUserSiteIds() {
    const av = getAvailableUserSiteIds();
    if (!av.length) return [];
    const cur = getCurrentSiteId();
    return av.includes(cur) ? [cur] : [av[0]];
  }
  function syncNewUserSiteIds(siteIds) {
    const allowed = new Set(getAvailableUserSiteIds());
    const next = (Array.isArray(siteIds) ? siteIds : state.newUserSiteIds).map((s) => String(s || "").trim()).filter((s) => allowed.has(s));
    state.newUserSiteIds = Array.from(new Set(next));
    if (!state.newUserSiteIds.length) state.newUserSiteIds = deriveDefaultNewUserSiteIds();
  }

  function setUserFormStatus(message, isError) {
    if (!userFormStatus) return;
    userFormStatus.textContent = String(message || "").trim() || "본인에게 열려 있는 사이트만 고를 수 있어요.";
    userFormStatus.style.color = isError ? "var(--color-danger)" : "";
  }

  function renderUserSiteOptions() {
    if (!userSiteChecklist) return;
    const sites = state.sites || [];
    if (!sites.length) {
      userSiteChecklist.innerHTML = '<span class="muted">고를 수 있는 사이트가 없어요.</span>';
      return;
    }
    syncNewUserSiteIds();
    userSiteChecklist.innerHTML = sites.map((site) => {
      const sid = String(site?.site_id || "").trim();
      const checked = state.newUserSiteIds.includes(sid);
      const label = site?.name ? `${site.name} (${sid})` : sid;
      return `<label class="siteCheckLabel"><input type="checkbox" value="${escapeHtml(sid)}" ${checked ? "checked" : ""} /><span>${escapeHtml(label)}</span></label>`;
    }).join("");
  }

  function buildCreateUserPayload() {
    const username = String(userUsernameInput?.value || "").trim();
    const displayName = String(userDisplayNameInput?.value || "").trim();
    const password = String(userPasswordInput?.value || "");
    const siteIds = Array.from(new Set(state.newUserSiteIds.map((s) => String(s || "").trim()).filter(Boolean)));
    if (!username) throw new Error("아이디를 입력해 주세요.");
    if (!displayName) throw new Error("이름을 입력해 주세요.");
    if (!password) throw new Error("비밀번호를 입력해 주세요.");
    if (!siteIds.length) throw new Error("사이트를 하나 이상 골라 주세요.");
    return {
      username, display_name: displayName, displayName, password,
      active: Boolean(userActiveInput?.checked),
      site_ids: siteIds, sites: siteIds,
      site_access: siteIds.map((site_id) => ({ site_id })),
      allowed_site_ids: siteIds, accessible_site_ids: siteIds,
    };
  }

  function resetCreateUserForm() {
    if (createUserForm) createUserForm.reset();
    if (userActiveInput) userActiveInput.checked = true;
    syncNewUserSiteIds(deriveDefaultNewUserSiteIds());
    renderUserSiteOptions();
    setUserFormStatus("", false);
  }

  async function submitCreateUser(event) {
    event.preventDefault();
    if (!createUserBtn) return;
    try {
      createUserBtn.disabled = true;
      setUserFormStatus("계정을 만드는 중이에요…", false);
      const payload = buildCreateUserPayload();
      const r = await fetch("/api/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const j = await parseJsonResponse(r, "user create failed");
      if (!j?.ok) throw new Error(j?.reason || "user create failed");
      state.userFetchError = null;
      renderUsers(await fetchUsers());
      resetCreateUserForm();
      setUserFormStatus(`${payload.display_name} 계정을 만들었어요.`, false);
    } catch (err) {
      setUserFormStatus(String(err), true);
      alert(String(err));
    } finally { createUserBtn.disabled = false; }
  }

  // ─── Copilot / Draft ───
  function updateCopilotExperimentUI() {
    if (copilotExperimentKey) copilotExperimentKey.textContent = state.selectedExperimentKey || "미선택";
    if (state.chatWidget) state.chatWidget.setSelectedExperimentKey(state.selectedExperimentKey);
  }

  function stageDraftForEditor(draft, changes) {
    if (!draft && !Array.isArray(changes)) return;
    const payload = { draft: draft || null, changesB: Array.isArray(changes) ? changes : [], selectedExperimentKey: state.selectedExperimentKey, savedAt: Date.now() };
    state.latestDraft = payload;
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    if (openDraftInEditorBtn) openDraftInEditorBtn.disabled = false;
    if (saveDraftBtn) saveDraftBtn.disabled = false;
    const cnt = payload.changesB.length;
    if (copilotDraftStatus) copilotDraftStatus.textContent = draft ? `초안 있음 · ${draft.key || "draft"} · 수정 ${cnt}건` : `수정 ${cnt}건 반영 대기`;
  }

  function stageExperimentForEditor(exp) {
    const payload = {
      draft: { key: exp.key, target_page: exp.url_prefix, hypothesis: exp.hypothesis || "" },
      changesB: Array.isArray(exp?.variants?.B) ? exp.variants.B : [],
      selectedExperimentKey: exp.parent_key || exp.key || null,
      savedAt: Date.now(),
    };
    state.latestDraft = payload;
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    if (openDraftInEditorBtn) openDraftInEditorBtn.disabled = false;
    if (saveDraftBtn) saveDraftBtn.disabled = exp.status === "draft";
    if (copilotDraftStatus) copilotDraftStatus.textContent = `${exp.status === "draft" ? "초안" : "실험"} 불러옴 · ${exp.key}`;
  }

  async function persistLatestDraft() {
    if (!state.latestDraft) return;
    const draft = state.latestDraft.draft || {};
    const changesB = Array.isArray(state.latestDraft.changesB) ? state.latestDraft.changesB : [];
    const payload = {
      site_id: getCurrentSiteId(),
      key: draft.key || state.selectedExperimentKey || `exp_copilot_${Date.now()}`,
      url_prefix: draft.target_page || "/",
      traffic: { A: 50, B: 50 },
      goals: [draft.primary_goal || "checkout_complete"],
      variants: { A: [], B: changesB },
      hypothesis: draft.hypothesis || "AI 도우미에서 만든 초안",
      source: "analytics_copilot",
    };
    const saved = await saveDraftExperiment(payload);
    stageExperimentForEditor(saved);
    await render();
    return saved;
  }

  // ─── 렌더링: 실험 테이블 ───
  function badge(status) {
    const cls = status === "running" ? "running" : status === "draft" ? "draft" : status === "archived" ? "label" : "paused";
    return `<span class="badge ${cls}">${escapeHtml(statusName(status))}</span>`;
  }

  function rowHtml(exp) {
    const status = exp.status || "paused";
    const key = exp.key || "(코드 없음)";
    const urlPrefix = exp.url_prefix || "/";
    const version = exp.version || 0;

    const btnToggle = status === "running"
      ? `<button class="btn danger" data-act="pause" data-id="${exp.id}">중지</button>`
      : status === "draft"
        ? `<button class="btn" data-act="edit-draft" data-id="${exp.id}" data-key="${key}">초안 이어쓰기</button>`
        : status === "archived"
          ? `<span class="muted">보관함</span>`
          : `<button class="btn good" data-act="run" data-id="${exp.id}">다시 켜기</button>`;

    const archiveBtn = (status === "draft" || status === "paused")
      ? `<button class="btn danger" data-act="archive" data-id="${exp.id}">보관으로</button>` : "";

    const metricsBtn = status === "draft"
      ? `<button class="btn" data-act="edit-draft" data-id="${exp.id}" data-key="${key}">편집기에서 열기</button>`
      : `<button class="btn" data-act="metrics" data-key="${key}">결과 보기</button>`;

    return `<tr>
      <td class="mono">${escapeHtml(key)}</td>
      <td>${badge(status)}</td>
      <td class="mono">${escapeHtml(urlPrefix)}</td>
      <td class="mono">v${version}</td>
      <td>${fmtDate(exp.updated_at)}</td>
      <td><div style="display:flex;gap:6px;flex-wrap:wrap;">${metricsBtn}${btnToggle}${archiveBtn}<a class="btn" href="${getEditorUrl()}" target="_blank" rel="noopener">편집기</a><button class="btn danger" data-act="del" data-id="${exp.id}">삭제</button></div></td>
    </tr>`;
  }

  // ─── 렌더링: Metrics ───
  function renderTop(list) {
    if (!Array.isArray(list) || !list.length) return "—";
    return list.map((x) => `${String(x.element_id).padEnd(18)}  ${x.count}`).join("\n");
  }

  function mergeLabelSummary(summary) {
    const byLabel = new Map(Array.isArray(summary) ? summary.map((item) => [item.label, item]) : []);
    return LABEL_ORDER.map((label, index) => {
      const current = byLabel.get(label);
      return {
        label,
        color: LABEL_COLORS[index % LABEL_COLORS.length],
        sessions: Number(current?.sessions) || 0,
        share: typeof current?.share === "number" ? current.share : 0,
        metrics: current?.metrics || {
          avg_duration_ms: 0,
          avg_depth: 0,
          checkout_complete_rate: 0,
        },
      };
    });
  }

  function buildDonutGradient(summary) {
    const segments = [];
    let start = 0;
    summary.forEach((item) => {
      const pct = Math.max(0, Math.min(1, Number(item.share) || 0));
      const end = start + (pct * 360);
      segments.push(`${item.color} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`);
      start = end;
    });
    if (start < 360) segments.push(`#eef2f8 ${start.toFixed(2)}deg 360deg`);
    return `conic-gradient(${segments.join(", ")})`;
  }

  function renderTrendChart(summary) {
    if (!trendChartCard) return;
    const trend = Array.isArray(summary?.trend) ? summary.trend : [];
    if (!trend.length) {
      trendChartCard.innerHTML = '<div class="chartState">해당 기간에 수집된 로그가 없습니다.</div>';
      return;
    }

    const sessions = trend.map((item) => Number(item.session_count) || 0);
    const events = trend.map((item) => Number(item.event_count) || 0);
    const maxValue = Math.max(1, ...sessions, ...events);
    const width = 960;
    const height = 220;
    const padX = 32;
    const padTop = 16;
    const padBottom = 24;
    const usableWidth = width - (padX * 2);
    const usableHeight = height - padTop - padBottom;
    const count = trend.length;

    const pointX = (index) => count === 1 ? width / 2 : padX + ((usableWidth / (count - 1)) * index);
    const pointY = (value) => padTop + (usableHeight - ((value / maxValue) * usableHeight));
    const toPolyline = (values) => values.map((value, index) => `${pointX(index)},${pointY(value)}`).join(" ");

    const labels = trend.map((item) => {
      const date = new Date(item.ts);
      return state.periodPreset === "today"
        ? date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
        : date.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
    });

    trendChartCard.innerHTML = `
      <div class="trendChartWrap">
        <svg class="trendSvg" viewBox="0 0 ${width} ${height}" role="img" aria-label="세션 수와 이벤트 수 추이 그래프">
          <line x1="${padX}" y1="${height - padBottom}" x2="${width - padX}" y2="${height - padBottom}" stroke="#d6deed" stroke-width="1" />
          <polyline fill="none" stroke="#5b76fe" stroke-width="3" points="${toPolyline(sessions)}"></polyline>
          <polyline fill="none" stroke="#ff7a45" stroke-width="3" points="${toPolyline(events)}"></polyline>
          ${trend.map((item, index) => `
            <g>
              <circle cx="${pointX(index)}" cy="${pointY(sessions[index])}" r="4" fill="#5b76fe">
                <title>${labels[index]} · 세션 ${fmtInt(sessions[index])}</title>
              </circle>
              <circle cx="${pointX(index)}" cy="${pointY(events[index])}" r="4" fill="#ff7a45">
                <title>${labels[index]} · 이벤트 ${fmtInt(events[index])}</title>
              </circle>
            </g>
          `).join("")}
        </svg>
        <div class="trendAxisLabelRow" style="grid-template-columns: repeat(${count}, minmax(0, 1fr));">${labels.map((label) => `<span class="trendAxisLabel">${escapeHtml(label)}</span>`).join("")}</div>
      </div>`;
  }

  async function showMetrics(key) {
    metricsCard.style.display = "block";
    metricKeyEl.textContent = key;
    state.selectedExperimentKey = key;
    updateCopilotExperimentUI();

    cvrA.textContent = cvrB.textContent = "…";
    ctrA.textContent = ctrB.textContent = "…";
    brA.textContent = brB.textContent = "…";
    countsBox.textContent = "불러오는 중…";
    topA.textContent = topB.textContent = "…";

    const m = await fetchMetrics(key);
    cvrA.textContent = fmtPct(m.A.cvr);
    cvrB.textContent = fmtPct(m.B.cvr);
    ctrA.textContent = fmtPct(m.A.ctr);
    ctrB.textContent = fmtPct(m.B.ctr);
    brA.textContent = fmtPct(m.A.bounce_rate);
    brB.textContent = fmtPct(m.B.bounce_rate);

    countsBox.textContent =
      `A안 · 방문자 ${m.A.users}명 · 세션 ${m.A.sessions} · 화면 ${m.A.page_views} · 클릭 ${m.A.clicks} · 전환 ${m.A.conversions}\n` +
      `B안 · 방문자 ${m.B.users}명 · 세션 ${m.B.sessions} · 화면 ${m.B.page_views} · 클릭 ${m.B.clicks} · 전환 ${m.B.conversions}\n` +
      `이벤트 합계 ${m.totals.events}건 · 목표 ${(m.goals || []).join(", ")}`;

    topA.textContent = renderTop(m.A.top_clicked_elements);
    topB.textContent = renderTop(m.B.top_clicked_elements);
  }

  // ─── 렌더링: 라벨 분포 바 ───
  function renderLabelBars(summary) {
    const fullSummary = mergeLabelSummary(summary);
    const totalSessions = fullSummary.reduce((sum, item) => sum + item.sessions, 0);
    if (labelDonutTotal) labelDonutTotal.textContent = fmtInt(totalSessions);
    if (labelDonut) {
      labelDonut.classList.toggle("empty", totalSessions === 0);
      labelDonut.style.setProperty("--donut-bg", buildDonutGradient(fullSummary));
    }
    labelBars.innerHTML = fullSummary.map((item) => {
      const share = typeof item.share === "number" ? item.share : 0;
      const pct = Math.max(0, Math.min(100, share * 100));
      return `<div class="barRow ${item.sessions === 0 ? "mutedBar" : ""}">
        <div class="barMeta"><span>${escapeHtml(labelName(item.label))}</span><span class="mono">${fmtInt(item.sessions)} / ${fmtPct(share)}</span></div>
        <div class="labelDescription">${escapeHtml(item.sessions === 0 ? "아직 감지되지 않음" : labelDescription(item.label))}</div>
        <div class="barTrack"><div class="barFill" style="width:${pct.toFixed(2)}%;background:${escapeHtml(item.color)}"></div></div>
      </div>`;
    }).join("");
  }

  // ─── 렌더링: 개선 기회 ───
  function renderOpportunities(insights) {
    if (!Array.isArray(insights) || !insights.length) {
      opportunityList.innerHTML = '<div class="emptyState">인사이트가 생기면 요약이 여기에 올라옵니다.</div>';
      if (uxPriorityHint) uxPriorityHint.textContent = "우선 확인이 필요한 항목을 아직 만들지 못했습니다.";
      return;
    }
    const priorityKo = { high: "긴급", medium: "보통", low: "낮음" };
    const topItem = insights[0];
    if (uxPriorityHint) {
      uxPriorityHint.textContent = topItem
        ? `${labelName(topItem.label)} · ${topItem.where || "우선 확인 포인트"}`
        : "우선 확인이 필요한 항목 수";
    }
    opportunityList.innerHTML = insights.slice(0, 3).map((i) => `
      <div class="opportunityItem">
        <div class="opportunityTitle">
          <strong>${escapeHtml(i.where || labelName(i.label))}</strong>
          <span class="badge ${escapeHtml(i.priority || "low")}">${escapeHtml(priorityKo[i.priority] || i.priority || "낮음")}</span>
        </div>
        <div class="opportunityMeta">
          <span class="badge label">${escapeHtml(labelName(i.label))}</span>
          ${i.where ? `<span class="badge label">${escapeHtml(i.where)}</span>` : ""}
        </div>
        <div class="opportunityDesc">${escapeHtml((Array.isArray(i.possible_causes) && i.possible_causes[0]) || i.where || "최근 수집된 UX 패턴을 기반으로 우선 확인이 필요한 항목입니다.")}</div>
        <div class="opportunityAction"><strong>권장 액션</strong> · ${escapeHtml((Array.isArray(i.validation_methods) && i.validation_methods[0]) || (Array.isArray(i.recommended_experiments) && (i.recommended_experiments[0]?.hypothesis || i.recommended_experiments[0]?.change)) || "관련 페이지와 사용자 행동을 먼저 확인해 주세요.")}</div>
      </div>
    `).join("");
  }

  // ─── 렌더링: 라벨 요약 테이블 ───
  function renderLabelSummary(summary) {
    if (!Array.isArray(summary) || !summary.length) {
      labelSummaryBody.innerHTML = '<tr><td colspan="6" class="emptyState">세션 데이터가 없어요.</td></tr>';
      return;
    }
    labelSummaryBody.innerHTML = summary.map((item) => `<tr>
      <td><span class="badge label">${escapeHtml(labelName(item.label))}</span></td>
      <td class="mono">${fmtInt(item.sessions)}</td>
      <td class="mono">${fmtPct(item.share)}</td>
      <td class="mono">${fmtDuration(item.metrics?.avg_duration_ms)}</td>
      <td class="mono">${typeof item.metrics?.avg_depth === "number" ? item.metrics.avg_depth.toFixed(1) : "—"}</td>
      <td class="mono">${fmtPct(item.metrics?.checkout_complete_rate)}</td>
    </tr>`).join("");
  }

  // ─── 렌더링: 최근 세션 ───
  function renderSessions(sessions) {
    if (sessionsSourceLabel) {
      sessionsSourceLabel.textContent = state.sessionsSource === "redis"
        ? "실시간(연동 시)"
        : "최근 방문 기록";
    }
    if (!Array.isArray(sessions) || !sessions.length) {
      sessionsBody.innerHTML = '<tr><td colspan="9" class="emptyState">세션 데이터가 없어요.</td></tr>';
      return;
    }
    if (state.sessionsSource === "redis") {
      sessionsBody.innerHTML = sessions.map((s) => `<tr>
        <td class="mono">${escapeHtml(s.session_id || "—")}</td>
        <td><span class="badge running">라이브</span></td>
        <td class="mono">—</td>
        <td class="mono">${fmtDuration((Number(s.last_ts) || 0) - (Number(s.started_at) || 0))}</td>
        <td class="mono">${fmtInt(s.page_view_count)}</td>
        <td class="mono">${fmtInt(s.click_count)}</td>
        <td class="mono">${fmtInt(s.event_count)}</td>
        <td class="mono">${escapeHtml(s.max_step || "—")}</td>
        <td class="mono">${s.checkout_completed ? "완료" : (s.checkout_started ? "진입" : "없음")}</td>
      </tr>`).join("");
      return;
    }
    sessionsBody.innerHTML = sessions.map((entry) => {
      const sm = entry.summary || {};
      const lb = entry.label || {};
      return `<tr>
        <td class="mono">${escapeHtml(sm.session_id || "—")}</td>
        <td><span class="badge label">${escapeHtml(labelName(lb.label))}</span></td>
        <td class="mono">${fmtPct(lb.confidence)}</td>
        <td class="mono">${fmtDuration(sm.duration_ms)}</td>
        <td class="mono">${fmtInt(sm.page_views)}</td>
        <td class="mono">${fmtInt(sm.clicks)}</td>
        <td class="mono">${fmtInt(sm.depth)}</td>
        <td class="mono">${escapeHtml(sm.max_step || "—")}</td>
        <td class="mono">${sm.checkout_complete ? "완료" : (sm.checkout_entered ? "진입" : "없음")}</td>
      </tr>`;
    }).join("");
  }

  // ─── 렌더링: 인사이트 ───
  function renderInsights(data) {
    const insights = Array.isArray(data?.output?.insights) ? data.output.insights : [];
    const priorityKo = { high: "긴급", medium: "보통", low: "낮음" };

    uxHighPriorityCount.textContent = String(insights.filter((i) => i.priority === "high").length);

    if (!insights.length) {
      insightsList.innerHTML = '<div class="emptyState">인사이트가 없거나 아직 생성 중이에요.</div>';
      return;
    }

    insightsList.innerHTML = insights.map((insight) => {
      const experiments = Array.isArray(insight.recommended_experiments) ? insight.recommended_experiments : [];
      const causes = Array.isArray(insight.possible_causes) ? insight.possible_causes : [];
      const validations = Array.isArray(insight.validation_methods) ? insight.validation_methods : [];
      return `<article class="insightCard">
        <div class="insightHead">
          <div>
            <div class="insightTitle">${escapeHtml(labelName(insight.label))}</div>
            <div class="muted">${escapeHtml(insight.where || "")}</div>
          </div>
          <span class="badge ${escapeHtml(insight.priority || "low")}">${escapeHtml(priorityKo[insight.priority] || "낮음")}</span>
        </div>
        <div class="insightText"><strong>가능한 원인</strong></div>
        <ul class="compactList">${causes.map((c) => `<li>${escapeHtml(c)}</li>`).join("") || "<li>—</li>"}</ul>
        <div class="insightText"><strong>확인해 볼 것</strong></div>
        <ul class="compactList">${validations.map((v) => `<li>${escapeHtml(v)}</li>`).join("") || "<li>—</li>"}</ul>
        <div class="insightText"><strong>다음 실험 아이디어</strong></div>
        <ul class="compactList">${experiments.map((e) => `<li>${escapeHtml(e.hypothesis || "")} · ${escapeHtml(e.change || "")} (${escapeHtml(e.primary_metric || "")})</li>`).join("") || "<li>—</li>"}</ul>
      </article>`;
    }).join("");

    renderOpportunities(insights);
  }

  // ─── 렌더링: UX 개요 ───
  function renderUxOverview(summary, insightData) {
    const mergedSummary = mergeLabelSummary(summary);
    const totalSessions = mergedSummary.reduce((s, i) => s + (Number(i.sessions) || 0), 0);
    const top = mergedSummary.slice().sort((a, b) => b.sessions - a.sessions)[0] || null;

    uxTotalSessions.textContent = totalSessions > 0 ? fmtInt(totalSessions) : "—";
    uxTopLabel.textContent = top && top.sessions > 0 ? labelName(top.label) : "—";
    if (uxTopLabelHint) {
      uxTopLabelHint.textContent = top && top.sessions > 0
        ? `${labelName(top.label)}이 전체 세션의 ${fmtPct(top.share)}로 가장 높습니다. ${labelDescription(top.label)}`
        : "아직 가장 두드러진 이탈 유형이 감지되지 않았습니다.";
    }
    renderLabelBars(mergedSummary);
    renderInsights(insightData);
  }

  // ─── 메인 렌더 ───
  async function render() {
    state.authUser = await fetchAuthMe();
    enforceAuthorizedSiteId();
    updatePeriodStatus();
    if (trendChartCard) trendChartCard.innerHTML = '<div class="chartState">불러오는 중…</div>';

    const [sites, exps, sessions, labelSummary, insightData, opportunityData, eventSummary, usersResult] = await Promise.all([
      fetchSites(),
      fetchExperiments(),
      fetchSessions(),
      fetchLabelsSummary(),
      fetchInsights(true),
      fetchInsights(false),
      fetchEventSummary().catch((error) => ({ ok: false, reason: String(error) })),
      state.authUser?.is_admin === true
        ? fetchUsers().then((users) => ({ users, error: null })).catch((error) => ({ users: [], error: String(error) }))
        : Promise.resolve({ users: [], error: null }),
    ]);

    state.sites = sites;
    state.siteConfig = getCurrentSiteConfig();
    state.experiments = exps;
    state.userFetchError = usersResult.error;
    syncNewUserSiteIds();

    if (!state.selectedExperimentKey && exps.length > 0) {
      state.selectedExperimentKey = exps[0].key || null;
      updateCopilotExperimentUI();
    }

    if (exps.length === 0) {
      if (expTableWrap) expTableWrap.style.display = "none";
      if (expEmptyState) expEmptyState.style.display = "";
    } else {
      if (expTableWrap) expTableWrap.style.display = "";
      if (expEmptyState) expEmptyState.style.display = "none";
      expTbody.innerHTML = exps.map(rowHtml).join("");
    }

    renderSessions(sessions);
    renderLabelSummary(labelSummary);
    renderUxOverview(labelSummary, insightData);
    renderOpportunities(Array.isArray(opportunityData?.output?.insights) ? opportunityData.output.insights : []);
    if (eventSummary?.ok) {
      renderTrendChart(eventSummary);
      if (uxSessionHint) {
        uxSessionHint.textContent = `${getPeriodRange().label} 동안 세션 ${fmtInt(labelSummary.reduce((sum, item) => sum + (Number(item.sessions) || 0), 0))}건 · 이벤트 ${fmtInt(eventSummary.total_events || 0)}건`;
      }
    } else if (trendChartCard) {
      trendChartCard.innerHTML = `<div class="chartState">그래프를 불러오지 못했어요.<br/>${escapeHtml(eventSummary?.reason || "잠시 후 다시 시도해 주세요.")}</div>`;
      if (uxSessionHint) uxSessionHint.textContent = "세션 카드와 그래프는 선택한 기간 기준으로 집계됩니다.";
    }

    if (state.authUser?.is_admin === true) {
      renderUserSiteOptions();
      renderUsers(usersResult.users);
      if (state.userFetchError) setUserFormStatus(state.userFetchError, true);
    }
    updateSiteContextUI();
  }

  // ─── 이벤트 리스너 ───
  expTbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    try {
      if (act === "metrics") { await showMetrics(btn.dataset.key); }
      else if (act === "edit-draft") {
        const exp = state.experiments.find((i) => i.id === btn.dataset.id);
        if (!exp) throw new Error("초안을 찾을 수 없습니다.");
        stageExperimentForEditor(exp);
        window.open(getEditorUrl({ from: "copilot" }), "_blank", "noopener");
      }
      else if (act === "pause") { await setStatus(btn.dataset.id, "paused"); await render(); }
      else if (act === "run") { await setStatus(btn.dataset.id, "running"); await render(); }
      else if (act === "archive") { await setStatus(btn.dataset.id, "archived"); await render(); }
      else if (act === "del") { if (!confirm("정말 삭제할까요?")) return; await deleteExp(btn.dataset.id); await render(); }
    } catch (err) { alert(String(err)); }
  });

  helpButtons.forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); toggleHelpPopover(b); }));
  document.addEventListener("click", (e) => { if (!e.target.closest(".helpBtn, .helpPopover")) closeHelpPopovers(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeHelpPopovers(); });

  refreshBtn.addEventListener("click", () => render());

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      location.href = "/login";
    });
  }

  if (siteSelect) {
    siteSelect.addEventListener("change", () => {
      const next = String(siteSelect.value || "").trim() || DEFAULT_SITE_ID;
      state.siteId = next;
      state.selectedExperimentKey = null;
      metricsCard.style.display = "none";
      localStorage.setItem(SITE_STORAGE_KEY, next);
      setSiteInUrl(next);
      updateSiteContextUI();
      render().catch((e) => alert(String(e)));
    });
  }

  if (periodPreset) {
    periodPreset.addEventListener("change", () => {
      state.periodPreset = String(periodPreset.value || "7d");
      updatePeriodStatus();
      const range = getPeriodRange();
      if (state.periodPreset !== "custom" || (range.fromTs != null && range.toTs != null)) {
        render().catch((e) => alert(String(e)));
      }
    });
  }

  if (customFromDate) {
    customFromDate.addEventListener("change", () => {
      state.customFromDate = String(customFromDate.value || "");
      updatePeriodStatus();
      const range = getPeriodRange();
      if (state.periodPreset === "custom" && range.fromTs != null && range.toTs != null) {
        render().catch((e) => alert(String(e)));
      }
    });
  }

  if (customToDate) {
    customToDate.addEventListener("change", () => {
      state.customToDate = String(customToDate.value || "");
      updatePeriodStatus();
      const range = getPeriodRange();
      if (state.periodPreset === "custom" && range.fromTs != null && range.toTs != null) {
        render().catch((e) => alert(String(e)));
      }
    });
  }

  // 사용자 관리 모달
  if (settingsBtn && userManagementDialog) {
    settingsBtn.addEventListener("click", () => {
      userManagementDialog.showModal();
    });
  }
  if (closeDialogBtn && userManagementDialog) {
    closeDialogBtn.addEventListener("click", () => userManagementDialog.close());
  }
  if (userManagementDialog) {
    userManagementDialog.addEventListener("click", (e) => {
      if (e.target === userManagementDialog) userManagementDialog.close();
    });
  }

  if (userSiteChecklist) {
    userSiteChecklist.addEventListener("change", (e) => {
      if (!(e.target instanceof HTMLInputElement) || e.target.type !== "checkbox") return;
      const checked = Array.from(userSiteChecklist.querySelectorAll('input[type="checkbox"]:checked')).map((i) => String(i.value || "").trim()).filter(Boolean);
      syncNewUserSiteIds(checked);
      renderUserSiteOptions();
    });
  }
  if (createUserForm) createUserForm.addEventListener("submit", submitCreateUser);
  if (resetUserFormBtn) resetUserFormBtn.addEventListener("click", resetCreateUserForm);

  if (saveDraftBtn) {
    saveDraftBtn.addEventListener("click", async () => {
      try {
        saveDraftBtn.disabled = true;
        const saved = await persistLatestDraft();
        if (copilotDraftStatus) copilotDraftStatus.textContent = `초안 저장됨 · ${saved.key}`;
      } catch (err) {
        alert(String(err));
        saveDraftBtn.disabled = !state.latestDraft;
      }
    });
  }
  if (openDraftInEditorBtn) {
    openDraftInEditorBtn.addEventListener("click", () => {
      if (!state.latestDraft) return;
      window.open(getEditorUrl({ from: "copilot" }), "_blank", "noopener");
    });
  }

  if (window.AnalyticsChatWidget) {
    state.chatWidget = window.AnalyticsChatWidget.init({
      fabId: "chatbotFab",
      panelId: "analyticsChatPanel",
      closeBtnId: "chatbotCloseBtn",
      messagesId: "chatMessages",
      inputId: "chatInput",
      sendBtnId: "chatSendBtn",
      selectedExperimentId: "chatSelectedExperiment",
      storageKey: "dashboard",
      onExperimentDraft(draft) { stageDraftForEditor(draft, draft?.variant_b_changes || []); },
      onEditorChanges(changes, draft) { stageDraftForEditor(draft, changes); },
    });
    updateCopilotExperimentUI();
  }

  localStorage.setItem(SITE_STORAGE_KEY, getCurrentSiteId());
  setSiteInUrl(getCurrentSiteId());
  syncPeriodInputs();
  updatePeriodStatus();
  updateSiteContextUI();
  render().catch((e) => alert(String(e)));
})();
