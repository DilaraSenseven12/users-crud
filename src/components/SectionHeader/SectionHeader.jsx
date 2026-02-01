import React from "react";

export default function SectionHeader({
  title,
  filters,
  search,
  actions,
  className = "",
}) {
  const cls = ["section-header", className].filter(Boolean).join(" ");

  return (
    <div className={cls}>
      <div className="section-header__left">
        <div className="section-header__title">{title}</div>
        {filters}
      </div>

      <div className="section-header__right">
        {search && <div className="section-header__search">{search}</div>}
        {actions}
      </div>
    </div>
  );
}
