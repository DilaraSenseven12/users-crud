import React from "react";

export default function PageHeader({
  title,
  subtitle,
  actions,
  search,
  className = "",
}) {
  const cls = ["page-header", className].filter(Boolean).join(" ");

  return (
    <div className={cls}>
      <div className="page-header__titleWrap">
        <h2 className="page-header__title">{title}</h2>

        {!!subtitle && (
          <div className="page-header__subtitle">{subtitle}</div>
        )}
      </div>

      <div className="page-header__actions">
        {!!search && <div className="page-header__search">{search}</div>}
        {actions}
      </div>
    </div>
  );
};
