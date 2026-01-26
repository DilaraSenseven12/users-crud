import { useEffect, useMemo, useState, useCallback } from "react";
import { Select, Space, Switch, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { getTheme, setTheme as setThemeGlobal } from "../../theme/theme"; 
import "./AppHeader.scss";

const { Title } = Typography;

const LANG_KEY = "app_lang";

const LANG_OPTIONS = [
  { label: "TR", value: "tr" },
  { label: "EN", value: "en" },
];

export default function AppHeader() {
  const { t, i18n } = useTranslation();

  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem(LANG_KEY);
    return saved || i18n.language || "tr";
  });

  const [theme, setTheme] = useState(() => getTheme()); 


  useEffect(() => {
    if (i18n.language !== lang) i18n.changeLanguage(lang);
    localStorage.setItem(LANG_KEY, lang);
  }, [lang, i18n]);

  const isDark = theme === "dark";

  const onLangChange = useCallback((value) => setLang(value), []);

  const onThemeChange = useCallback((checked) => {
    const next = checked ? "dark" : "light";
    setTheme(next);
    setThemeGlobal(checked); 
  }, []);

  const themeLabel = useMemo(
    () => (isDark ? t("Common.dark") : t("Common.light")),
    [isDark, t]
  );

  return (
    <header className="app-header" role="banner">
      <div className="app-header__inner">
        <Title className="app-header__title" level={4}>
          {t("App.title")}
        </Title>

        <Space className="app-header__right" size={10} align="center">
          <Select
            className="app-header__lang"
            dropdownClassName="app-header__langDropdown"
            value={lang}
            onChange={onLangChange}
            options={LANG_OPTIONS}
          />

          <span className="app-header__themeLabel">{themeLabel}</span>

          <Switch
            className="app-header__themeSwitch"
            size="small"
            checked={isDark}
            onChange={onThemeChange}
          />
        </Space>
      </div>
    </header>
  );
}
