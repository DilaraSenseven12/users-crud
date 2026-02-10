import React, { useMemo } from "react";
import { Card, Col, Row, Tooltip } from "antd";
import {
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import "./UsersStatsCards.scss";

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export default function UsersStatsCards({
  stats,
  loading = false,
  selectedKey,
  onSelect,
}) {
  const { t } = useTranslation();

  const active = Number(stats?.active ?? 0);
  const total = Number(stats?.total ?? 0);

  // ✅ activePct güvenli hesap
  const activePct = useMemo(() => {
    const raw = stats?.activePct;

    // Eğer dışarıdan yüzde (0-100) veya oran (0-1) geliyorsa yakala
    if (typeof raw === "number" && Number.isFinite(raw)) {
      const asPercent = raw <= 1 ? raw * 100 : raw; // 0.78 -> 78
      return clamp(Math.round(asPercent), 0, 100);
    }

    // Yoksa active/total'dan üret
    if (total <= 0) return 0;
    return clamp(Math.round((active / total) * 100), 0, 100);
  }, [stats?.activePct, active, total]);

  const items = useMemo(
    () => [
      {
        key: "all",
        title: t("UsersPage.stats.total", { defaultValue: "Total Users" }),
        value: Number(stats?.total ?? 0),
        icon: <UserOutlined />,
        variant: "total",
        selectable: true,
      },
      {
        key: "active",
        title: t("UsersPage.stats.active", { defaultValue: "Active" }),
        value: Number(stats?.active ?? 0),
        icon: <CheckCircleOutlined />,
        variant: "active",
        selectable: true,
      },
      {
        key: "inactive",
        title: t("UsersPage.stats.inactive", { defaultValue: "Inactive" }),
        value: Number(stats?.inactive ?? 0),
        icon: <CloseCircleOutlined />,
        variant: "inactive",
        selectable: true,
      },
      {
        key: "rate",
        title: t("UsersPage.stats.activeRate", { defaultValue: "Active Rate" }),
        value: activePct, // ✅ artık doğru
        icon: <span className="users-statCard__percentIcon">%</span>,
        variant: "rate",
        selectable: false,
      },
    ],
    [t, stats, activePct]
  );

  const rateTip = useMemo(() => {
    return t("UsersPage.stats.activeRateTip", {
      defaultValue: "{{active}} / {{total}} users are active",
      active,
      total,
    });
  }, [t, active, total]);

  return (
    <div className="users-stats">
      <Row gutter={[12, 12]}>
        {items.map((it) => {
          const hasOnSelect = typeof onSelect === "function";
          const selectable = hasOnSelect && it.selectable !== false;
          const selected = selectable && selectedKey === it.key;

          const card = (
            <Card
              bordered={false}
              loading={loading}
              className={[
                "users-statCard",
                `users-statCard--${it.variant}`,
                selectable ? "is-clickable" : "",
                selected ? "is-selected" : "",
              ].join(" ")}
              onClick={selectable ? () => onSelect(it.key) : undefined}
              role={selectable ? "button" : undefined}
              tabIndex={selectable ? 0 : undefined}
              onKeyDown={
                selectable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") onSelect(it.key);
                    }
                  : undefined
              }
            >
              <div className="users-statCard__inner">
                <div className="users-statCard__icon">{it.icon}</div>

                <div className="users-statCard__meta">
                  <div className="users-statCard__title">{it.title}</div>

                  <div className="users-statCard__value">
                    {it.key === "rate" ? `${it.value}%` : it.value}
                  </div>

                  {it.key === "rate" && (
                    <div className="users-statCard__sub">
                      {active} / {total}
                    </div>
                  )}

                  {it.key === "rate" && (
                    <div className="users-statCard__bar" aria-hidden="true">
                      <span
                        className="users-statCard__barFill"
                        style={{ width: `${clamp(Number(it.value), 0, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );

          return (
            <Col key={it.key} xs={24} sm={12} lg={6}>
              {it.key === "rate" ? (
                <Tooltip title={rateTip} placement="top">
                  <div>{card}</div>
                </Tooltip>
              ) : (
                card
              )}
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
