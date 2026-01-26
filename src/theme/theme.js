const THEME_KEY = "theme";

const getSystemPref = () =>
  !!window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;

const applyTheme = (isDark) => {
  const themeValue = isDark ? "dark" : "light";

  document.documentElement.setAttribute("data-theme", themeValue);
};

export const initTheme = () => {
  const saved = localStorage.getItem(THEME_KEY);
  const isDark = saved ? saved === "dark" : getSystemPref();
  applyTheme(isDark);
};

export const setTheme = (isDark) => {
  applyTheme(!!isDark);
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
};

export const getTheme = () => {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return getSystemPref() ? "dark" : "light";
};
