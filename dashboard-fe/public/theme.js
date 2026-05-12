(function () {
  "use strict";

  const STORAGE_KEY = "uxsdk.dashboard.theme";
  const THEMES = [
    { value: "light", label: "Light" },
    { value: "midnight", label: "Midnight Ops" },
    { value: "sage", label: "Sage Control" },
  ];

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) || "light";
    } catch {
      return "light";
    }
  }

  function normalizeTheme(value) {
    const theme = String(value || "").trim();
    return THEMES.some((item) => item.value === theme) ? theme : "light";
  }

  function applyTheme(theme) {
    const next = normalizeTheme(theme);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage failures; the current page can still use the selected theme.
    }
    return next;
  }

  function createThemeSwitcher() {
    const wrapper = document.createElement("label");
    wrapper.className = "themeSwitcher";

    const text = document.createElement("span");
    text.className = "themeSwitcherLabel";
    text.textContent = "테마";

    const select = document.createElement("select");
    select.className = "themeSwitcherSelect";
    select.setAttribute("aria-label", "대시보드 테마 선택");

    THEMES.forEach((theme) => {
      const option = document.createElement("option");
      option.value = theme.value;
      option.textContent = theme.label;
      select.appendChild(option);
    });

    select.value = applyTheme(getStoredTheme());
    select.addEventListener("change", () => {
      select.value = applyTheme(select.value);
    });

    wrapper.append(text, select);
    return wrapper;
  }

  function mountThemeSwitcher() {
    const target = document.querySelector(".topActions")
      || document.querySelector(".topbarRight")
      || document.querySelector(".loginCard");
    if (!target || target.querySelector(".themeSwitcher")) return;
    const switcher = createThemeSwitcher();
    target.prepend(switcher);
  }

  applyTheme(getStoredTheme());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountThemeSwitcher, { once: true });
  } else {
    mountThemeSwitcher();
  }
})();
