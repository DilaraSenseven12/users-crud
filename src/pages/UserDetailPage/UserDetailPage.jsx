
import { useEffect, useMemo, useState } from "react";
import { Button, Card, Descriptions, Empty, Tabs, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usersService } from "../../api/jp/users.service";
import { loadUsers } from "../../storage/jpDb";
import UserPostsSection from "../../components/UserPostsSection/UserPostsSection";
import UserTodosSection from "../../components/UserTodosSection/UserTodosSection";
import "./UserDetailPage.scss";

const getErrMsg = (err, fallback) => {
  const msg =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback;

  return typeof msg === "string" && msg.trim() ? msg : fallback;
};

export default function UserDetailPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { id } = useParams();

  const userId = useMemo(() => Number(id), [id]);

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(userId)) {
      setUser(null);
      setLoadingUser(false);
      return;
    }

    const controller = new AbortController();

    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        const localUsers = loadUsers();
        const found = localUsers?.find((u) => u?.id === userId);

        if (found) {
          if (!controller.signal.aborted) setUser(found);
          return;
        }

        const u = await usersService.getUserById(userId, {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) setUser(u ?? null);
      } catch (err) {
        if (err?.code === "ERR_CANCELED") return;

        message.error(getErrMsg(err, t("UserDetailPage.errors.userFetch")));
        if (!controller.signal.aborted) setUser(null);
      } finally {
        if (!controller.signal.aborted) setLoadingUser(false);
      }
    };

    fetchUser();
    return () => controller.abort();
  }, [userId, t]);

  const subtitle = useMemo(() => {
    if (!user) return "";
    const username = user?.username ? `@${user.username}` : "";
    const email = user?.email ?? "";
    return [username, email].filter(Boolean).join(" • ");
  }, [user]);

  const tabItems = useMemo(
    () => [
      {
        key: "posts",
        label: t("UserDetailPage.tabs.posts"),
        children: <UserPostsSection userId={userId} />,
      },
      {
        key: "todos",
        label: t("UserDetailPage.tabs.todos"),
        children: <UserTodosSection userId={userId} />,
      },
    ],
    [t, userId]
  );

  const titleText = user?.name || t("UserDetailPage.titles.user");

  return (
    <div className="user-detail-page app-page">
      <div className="page-header page-header--userDetail">
        <div className="page-header__titleWrap">
          <h2 className="page-header__title">{titleText}</h2>
          {!!subtitle && <div className="page-header__subtitle">{subtitle}</div>}
        </div>

        <div className="page-header__actions">
          <Button type="primary" className="btn-blue" onClick={() => nav("/users")}>
            {t("UserDetailPage.actions.backUsers")}
          </Button>
        </div>
      </div>

      <Card className="user-detail-page__card" loading={loadingUser}>
        {user ? (
          <div className="user-detail-page__desc">
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
          !loadingUser && <Empty description={t("UserDetailPage.empty.userNotFound")} />
        )}
      </Card>

      {user ? <Tabs className="user-detail-page__tabs" items={tabItems} /> : null}
    </div>
  );
}
