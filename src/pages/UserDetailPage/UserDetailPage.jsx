import { useEffect, useMemo, useRef } from "react";
import { Button, Tabs, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUserDetail } from "../../hooks/useUserDetail";
import PageHeader from "../../components/PageHeader/PageHeader";
import UserSummaryCard from "../../components/UserSummaryCard/UserSummaryCard";
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
  const { user, loading: loadingUser, error, isValidId } = useUserDetail(userId);
  const shownErrorKeyRef = useRef(null);

  useEffect(() => {
    if (!error) return;

    if (error.key && shownErrorKeyRef.current === error.key) return;
    if (error.key) shownErrorKeyRef.current = error.key;

    if (error.type === "INVALID_ID") {
      message.error(t("UserDetailPage.errors.invalidId"));
      return;
    }

    if (error.type === "FETCH_FAILED") {
      message.error(getErrMsg(error.raw, t("UserDetailPage.errors.userFetch")));
    }
  }, [error, t]);

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
      <PageHeader
        className="page-header--userDetail"
        title={titleText}
        subtitle={subtitle}
        actions={
          <Button type="primary" className="btn-blue" onClick={() => nav("/users")}>
            {t("UserDetailPage.actions.backUsers")}
          </Button>
        }
      />

      <UserSummaryCard user={user} loading={loadingUser} isValidId={isValidId} />

      {user ? <Tabs className="user-detail-page__tabs" items={tabItems} /> : null}
    </div>
  );
}
