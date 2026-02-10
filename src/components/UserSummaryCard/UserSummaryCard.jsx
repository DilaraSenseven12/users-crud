import React, { useMemo } from "react";
import { Card, Descriptions, Empty, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { MdOutlineEmail, MdOutlineAssuredWorkload } from "react-icons/md";
import { FaRegAddressCard } from "react-icons/fa";
import { FaPhone } from "react-icons/fa6";
import { TbWorldWww } from "react-icons/tb";
import "./UserSummaryCard.scss";

const { Text, Link } = Typography;

const getInitials = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + last).toUpperCase();
};

const withProtocol = (url = "") => {
  const v = String(url || "").trim();
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
};

const IconOnlyLabel = ({ icon, title, variant }) => (
  <span
    className={`user-summary-card__label user-summary-card__label--iconOnly ${
      variant ? `is-${variant}` : ""
    }`}
    title={title}
    aria-label={title}
  >
    {icon}
  </span>
);

function CopyRow({ type = "a", href, title, children, copyText }) {
  return (
    <div className="user-summary-card__inline">
      {type === "link" ? (
        <Link
          className="user-summary-card__link"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={title}
        >
          {children}
        </Link>
      ) : (
        <a className="user-summary-card__link" href={href} title={title}>
          {children}
        </a>
      )}

      <Text className="user-summary-card__copy" copyable={{ text: copyText }} />
    </div>
  );
}

export default function UserSummaryCard({ user, loading, isValidId }) {
  const { t } = useTranslation();

  const emptyText = useMemo(() => {
    if (!isValidId)
      return t("UserDetailPage.empty.invalidId", { defaultValue: "Invalid user id" });
    return t("UserDetailPage.empty.userNotFound", { defaultValue: "User not found" });
  }, [isValidId, t]);

  const view = useMemo(() => {
    if (!user) return null;

    const name = user?.name ?? "-";
    const username = user?.username ? `@${user.username}` : "-";

    const email = String(user?.email || "").trim();
    const phone = String(user?.phone || "").trim();

    const websiteRaw = String(user?.website || "").trim();
    const websiteHref = withProtocol(websiteRaw);

    const address = user?.address || {};
    const addressLine = [address?.street, address?.suite, address?.city, address?.zipcode]
      .map((x) => String(x || "").trim())
      .filter(Boolean)
      .join(", ");

    const company = user?.company || {};
    const companyLine = [company?.name, company?.catchPhrase]
      .map((x) => String(x || "").trim())
      .filter(Boolean)
      .join(" — ");

    return {
      name,
      username,
      initials: getInitials(user?.name),
      email,
      phone,
      websiteRaw,
      websiteHref,
      addressLine,
      companyLine,
    };
  }, [user]);

  return (
    <Card className="user-summary-card" loading={loading}>
      {user ? (
        <div className="user-summary-card__wrap">
          <div className="user-summary-card__header">
            <div className="user-summary-card__avatar" aria-hidden="true">
              {view.initials}
            </div>

            <div className="user-summary-card__title">
              <div className="user-summary-card__name" title={view.name}>
                {view.name}
              </div>
              <div className="user-summary-card__meta" title={view.username}>
                {view.username}
              </div>
            </div>
          </div>

          <div className="user-summary-card__desc">
        <Descriptions
  size="small"
  bordered
  layout="horizontal"
  column={{ xs: 1, sm: 1, md: 2, lg: 2 }}
>
  <Descriptions.Item
    label={
      <IconOnlyLabel
        icon={<MdOutlineEmail />}
        title={t("UserDetailPage.fields.email", { defaultValue: "Email" })}
        variant="email"
      />
    }
  >
    {view.email ? (
      <CopyRow href={`mailto:${view.email}`} title={view.email} copyText={view.email}>
        {view.email}
      </CopyRow>
    ) : (
      "-"
    )}
  </Descriptions.Item>
  <Descriptions.Item
    label={
      <IconOnlyLabel
        icon={<FaPhone />}
        title={t("UserDetailPage.fields.phone", { defaultValue: "Phone" })}
        variant="phone"
      />
    }
  >
    {view.phone ? (
      <CopyRow href={`tel:${view.phone}`} title={view.phone} copyText={view.phone}>
        {view.phone}
      </CopyRow>
    ) : (
      "-"
    )}
  </Descriptions.Item>
  <Descriptions.Item
    span={2}
    label={
      <IconOnlyLabel
        icon={<TbWorldWww />}
        title={t("UserDetailPage.fields.website", { defaultValue: "Website" })}
        variant="web"
      />
    }
  >
    {view.websiteRaw ? (
      <CopyRow
        type="link"
        href={view.websiteHref}
        title={view.websiteHref}
        copyText={view.websiteHref}
      >
        {view.websiteRaw}
      </CopyRow>
    ) : (
      "-"
    )}
  </Descriptions.Item>
  <Descriptions.Item
    label={
      <IconOnlyLabel
        icon={<FaRegAddressCard />}
        title={t("UserDetailPage.fields.address", { defaultValue: "Address" })}
        variant="address"
      />
    }
  >
    <span className="user-summary-card__clamp" title={view.addressLine || ""}>
      {view.addressLine || "-"}
    </span>
  </Descriptions.Item>
  <Descriptions.Item
    label={
      <IconOnlyLabel
        icon={<MdOutlineAssuredWorkload />}
        title={t("UserDetailPage.fields.company", { defaultValue: "Company" })}
        variant="company"
      />
    }
  >
    <span className="user-summary-card__clamp" title={view.companyLine || ""}>
      {view.companyLine || "-"}
    </span>
  </Descriptions.Item>
</Descriptions>
          </div>
        </div>
      ) : (
        !loading && <Empty description={emptyText} />
      )}
    </Card>
  );
}
