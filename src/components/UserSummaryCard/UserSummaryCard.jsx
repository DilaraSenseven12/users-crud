import React, { useMemo } from "react";
import { Card, Descriptions, Empty } from "antd";
import { useTranslation } from "react-i18next";
import "./UserSummaryCard.scss";

export default function UserSummaryCard({ user, loading, isValidId }) {
  const { t } = useTranslation();

  const emptyText = useMemo(() => {
    if (!isValidId) return t("UserDetailPage.empty.invalidId");
    return t("UserDetailPage.empty.userNotFound");
  }, [isValidId, t]);

  return (
    <Card className="user-summary-card" loading={loading}>
      {user ? (
        <div className="user-summary-card__desc">
          <Descriptions size="small" column={1} bordered layout="horizontal">
            <Descriptions.Item label={t("UserDetailPage.fields.name")}>
              {user?.name}
            </Descriptions.Item>

            <Descriptions.Item label={t("UserDetailPage.fields.username")}>
              {user?.username ? `@${user.username}` : "-"}
            </Descriptions.Item>

            <Descriptions.Item label={t("UserDetailPage.fields.email")}>
              {user?.email ?? "-"}
            </Descriptions.Item>
          </Descriptions>
        </div>
      ) : (
        !loading && <Empty description={emptyText} />
      )}
    </Card>
  );
};
