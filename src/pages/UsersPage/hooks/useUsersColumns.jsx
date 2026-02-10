import { useMemo } from "react";
import { Button, Space, Tooltip, Popconfirm, Dropdown, Tag } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { BiCommentDetail, BiEditAlt } from "react-icons/bi";
import { AiOutlineDelete } from "react-icons/ai";
import { MdOutlineEmail } from "react-icons/md";

export function useUsersColumns({
  t,
  colWidth,
  hasScrollX = true,
  visibleOptionalCols = [],

  statusValue,
  onStatusChange,
  fmtDate,
  onDetail,
  onEdit,
  onDelete,
}) {
  const statusMenuItems = useMemo(
    () => [
      { key: "all", label: t("UsersPage.filters.all", { defaultValue: "All" }) },
      { key: "active", label: t("UsersPage.status.active", { defaultValue: "Active" }) },
      { key: "inactive", label: t("UsersPage.status.inactive", { defaultValue: "Inactive" }) },
    ],
    [t]
  );

  const statusTooltip = useMemo(() => {
    if (statusValue === "active") return t("UsersPage.status.active", { defaultValue: "Active" });
    if (statusValue === "inactive") return t("UsersPage.status.inactive", { defaultValue: "Inactive" });
    return t("UsersPage.filters.all", { defaultValue: "All" });
  }, [statusValue, t]);

  const StatusHeader = useMemo(
    () => (
      <div className="users-statusHeader">
        <span className="users-statusHeader__title">
          {t("UsersPage.columns.status", { defaultValue: "Status" })}
        </span>

        <Dropdown
          trigger={["click"]}
          placement="bottomRight"
          classNames={{ root: "users-statusMenu" }}
          menu={{
            items: statusMenuItems,
            selectable: true,
            selectedKeys: [statusValue ?? "all"],
            onClick: ({ key }) => onStatusChange?.(key),
          }}
        >
          <Tooltip title={statusTooltip} placement="top">
            <button
              type="button"
              className="users-statusHeader__iconBtn"
              aria-label="status filter"
            >
              <DownOutlined />
            </button>
          </Tooltip>
        </Dropdown>
      </div>
    ),
    [t, statusMenuItems, statusValue, onStatusChange, statusTooltip]
  );

  const has = (key) => visibleOptionalCols?.includes(key);

  const columns = useMemo(() => {
    const cols = [
      {
        title: t("UsersPage.columns.name", { defaultValue: "Name" }),
        dataIndex: "name",
        key: "name",
        width: colWidth.name,
        ellipsis: true,
      },
      {
        title: t("UsersPage.columns.username", { defaultValue: "Username" }),
        dataIndex: "username",
        key: "username",
        width: colWidth.username,
        ellipsis: true,
        render: (v) => <span className="users-page__username">@{v}</span>,
      },
      {
        title: t("UsersPage.columns.email", { defaultValue: "Email" }),
        dataIndex: "email",
        key: "email",
        width: colWidth.email,
        ellipsis: true,
        render: (value) => (
          <a className="users-page__email" href={`mailto:${value}`}>
            <span className="users-page__emailWrap">
              <span className="users-page__emailText">{value}</span>
              <MdOutlineEmail className="users-page__emailIcon" aria-hidden="true" />
            </span>
          </a>
        ),
      },
      {
        title: StatusHeader,
        dataIndex: "status",
        key: "status",
        width: colWidth.status,
        render: (v) => {
          const isActive = (v ?? "active") === "active";
          return (
            <Tag className={`users-status users-status--${isActive ? "active" : "inactive"}`}>
              {isActive
                ? t("UsersPage.status.active", { defaultValue: "Active" })
                : t("UsersPage.status.inactive", { defaultValue: "Inactive" })}
            </Tag>
          );
        },
      },
    ];

    if (has("phone")) {
      cols.push({
        title: t("UsersPage.table.phone", { defaultValue: "Phone" }),
        dataIndex: "phone",
        key: "phone",
        width: colWidth.phone,
        ellipsis: true,
        render: (v) => v || <span className="users-page__username">-</span>,
      });
    }

    if (has("address")) {
      cols.push({
        title: t("UsersPage.table.address", { defaultValue: "Address" }),
        dataIndex: ["address", "street"],
        key: "address",
        width: colWidth.address,
        ellipsis: true,
        render: (v) => v || <span className="users-page__username">-</span>,
      });
    }

    if (has("company")) {
      cols.push({
        title: t("UsersPage.table.company", { defaultValue: "Company" }),
        dataIndex: ["company", "name"],
        key: "company",
        width: colWidth.company,
        ellipsis: true,
        render: (v) => v || <span className="users-page__username">-</span>,
      });
    }

    if (has("createdAt")) {
      cols.push({
        title: t("UsersPage.columns.createdAt", { defaultValue: "Created Date" }),
        dataIndex: "createdAt",
        key: "createdAt",
        width: colWidth.createdAt,
        ellipsis: true,
        className: "col-createdAt",
        onHeaderCell: () => ({ className: "col-createdAt col-createdAt--th" }),
        fixed: hasScrollX ? "right" : undefined,
        render: (v) => <span className="users-page__createdAt">{fmtDate?.(v) ?? "-"}</span>,
        sorter: (a, b) => (Date.parse(a?.createdAt) || 0) - (Date.parse(b?.createdAt) || 0),
        sortDirections: ["descend", "ascend"],
        defaultSortOrder: "descend",
      });
    }

    cols.push({
      title: t("UsersPage.columns.actions", { defaultValue: "Actions" }),
      key: "actions",
      width: colWidth.actions,
      align: "left",
      className: "col-actions",
      onHeaderCell: () => ({ className: "col-actions col-actions--th" }),
      fixed: hasScrollX ? "right" : undefined,
      render: (_, record) => (
        <Space className="users-page__tableActions" size={8}>
          <Tooltip
            title={t("UsersPage.actions.detailPosts", { defaultValue: "Details" })}
            placement="top"
          >
            <Button
              className="icon-btn icon-btn--primary"
              type="text"
              icon={<BiCommentDetail />}
              onClick={() => onDetail?.(record)}
            />
          </Tooltip>

          <Tooltip title={t("UsersPage.actions.edit", { defaultValue: "Edit" })} placement="top">
            <Button
              className="icon-btn icon-btn--purple"
              type="text"
              icon={<BiEditAlt />}
              onClick={() => onEdit?.(record)}
            />
          </Tooltip>

          <Popconfirm
            overlayClassName="users-popconfirm"
            title={t("UsersPage.confirm.deleteTitle", { defaultValue: "Delete user?" })}
            okText={t("UsersPage.confirm.ok", { defaultValue: "OK" })}
            cancelText={t("UsersPage.confirm.cancel", { defaultValue: "Cancel" })}
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete?.(record.id)}
          >
            <Tooltip title={t("UsersPage.actions.delete", { defaultValue: "Delete" })} placement="top">
              <Button className="icon-btn icon-btn--danger" type="text" icon={<AiOutlineDelete />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    });

    return cols;
  }, [t, colWidth, StatusHeader, fmtDate, hasScrollX, onDetail, onEdit, onDelete, visibleOptionalCols]);

  return { columns };
}
