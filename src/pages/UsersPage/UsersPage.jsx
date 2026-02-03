import { useEffect, useMemo, useState, useCallback } from "react";
import {Button,Card,Form,Input,Modal,Space,Table,Pagination,message,Tooltip,Popconfirm,Radio,Row,Col,Dropdown,Tag,} from "antd";
import {PlusOutlined,UserOutlined,CheckCircleOutlined,CloseCircleOutlined,DownOutlined,} from "@ant-design/icons";
import { BiCommentDetail, BiEditAlt } from "react-icons/bi";
import { AiOutlineDelete } from "react-icons/ai";
import { MdOutlineEmail } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usersRepo } from "../../storage/repo/users.repo";
import "./UserPage.scss";
import PageHeader from "../../components/PageHeader/PageHeader";
import {saveUsers,ensureUsersCreatedAt,ensureUsersStatus,} from "../../storage/jpDb";
import FiltersBar from "../../components/FiltersBar/FiltersBar";

const PAGE_SIZE = 8;

export default function UsersPage() {
  const { t } = useTranslation();
  const nav = useNavigate();

  const [messageApi, contextHolder] = message.useMessage();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
    q: "",
    status: "all", 
    range: null, 
  });

  const patchFilters = useCallback((patch) => {
    setFilters((p) => ({ ...p, ...patch }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ q: "", status: "all", range: null });
    setPage(1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      try {
        const data = await usersRepo.bootstrap({ signal: controller.signal });

        const r1 = ensureUsersCreatedAt(data);
        const r2 = ensureUsersStatus(r1.normalized);

        if (r1.changed || r2.changed) {
          saveUsers(r2.normalized);
        }

        setUsers(r2.normalized);
      } catch {
        messageApi.error(t("UsersPage.errors.fetchUsers"));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [t, messageApi]);

  const filteredUsers = useMemo(() => {
    const term = (filters.q || "").trim().toLowerCase();
    const [start, end] = filters.range || [];

    return (users || []).filter((u) => {
      const hay = `${u.name ?? ""} ${u.username ?? ""} ${u.email ?? ""}`.toLowerCase();
      const okQ = !term || hay.includes(term);

      const okStatus =
        filters.status === "all"
          ? true
          : (u?.status ?? "active") === filters.status;

      const okRange =
        !start || !end || !u?.createdAt
          ? true
          : dayjs(u.createdAt).isAfter(start.startOf("day")) &&
            dayjs(u.createdAt).isBefore(end.endOf("day"));

      return okQ && okStatus && okRange;
    });
  }, [users, filters]);

  const stats = useMemo(() => {
    const list = Array.isArray(filteredUsers) ? filteredUsers : [];
    let active = 0;
    let inactive = 0;

    list.forEach((u) => {
      const s = u?.status ?? "active";
      if (s === "inactive") inactive += 1;
      else active += 1;
    });

    return { total: list.length, active, inactive };
  }, [filteredUsers]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
    if (page > maxPage) setPage(1);
  }, [filteredUsers.length, page]);

  const pagedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, page]);

  const openEdit = useCallback(
    (record) => {
      setEditing(record);
      form.setFieldsValue({
        name: record?.name ?? "",
        username: record?.username ?? "",
        email: record?.email ?? "",
        status: record?.status ?? "active",
      });
      setOpen(true);
    },
    [form]
  );

  const openCreate = useCallback(() => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: "active" });
    setOpen(true);
  }, [form]);

  const closeModal = useCallback(() => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  }, [form]);

  const onDelete = useCallback(
    async (id) => {
      try {
        const normalizedId = Number(id);
        const nextUsers = await usersRepo.remove(users, normalizedId);
        setUsers(nextUsers);
        messageApi.success(t("UsersPage.success.userDeleted"));
      } catch {
        messageApi.error(t("UsersPage.errors.fetchUsers"));
      }
    },
    [users, t, messageApi]
  );

  const onSubmit = useCallback(async () => {
    if (saving) return;

    try {
      setSaving(true);
      const values = await form.validateFields();
      const status = values?.status === "inactive" ? "inactive" : "active";

      if (!editing) {
        const payload = {
          ...values,
          status,
          createdAt: new Date().toISOString(),
        };
        const next = await usersRepo.create(users, payload);
        setUsers(next);
        messageApi.success(t("UsersPage.success.userCreated"));
      } else {
        const payload = { ...editing, ...values, status };
        const next = await usersRepo.update(users, editing.id, payload);
        setUsers(next);
        messageApi.success(t("UsersPage.success.userUpdated"));
      }

      closeModal();
    } finally {
      setSaving(false);
    }
  }, [saving, form, editing, users, t, closeModal, messageApi]);

  const fmtDateTime = useCallback((iso) => {
    if (!iso) return "-";
    const dt = new Date(iso);
    const ms = dt.getTime();
    if (!Number.isFinite(ms)) return "-";

    return new Intl.DateTimeFormat("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dt);
  }, []);

  const statusMenuItems = useMemo(
    () => [
      { key: "all", label: t("UsersPage.filters.all", { defaultValue: "All" }) },
      {
        key: "active",
        label: t("UsersPage.status.active", { defaultValue: "Active" }),
      },
      {
        key: "inactive",
        label: t("UsersPage.status.inactive", { defaultValue: "Inactive" }),
      },
    ],
    [t]
  );

  const statusTooltip = useMemo(() => {
    if (filters.status === "active")
      return t("UsersPage.status.active", { defaultValue: "Active" });
    if (filters.status === "inactive")
      return t("UsersPage.status.inactive", { defaultValue: "Inactive" });
    return t("UsersPage.filters.all", { defaultValue: "All" });
  }, [filters.status, t]);

  const StatusHeader = useMemo(
    () => (
      <div className="users-statusHeader">
        <span className="users-statusHeader__title">
          {t("UsersPage.columns.status", { defaultValue: "Status" })}
        </span>

        <Dropdown
          trigger={["click"]}
          placement="bottomRight"
          overlayClassName="users-statusMenu"
          menu={{
            items: statusMenuItems,
            selectable: true,
            selectedKeys: [filters.status],
            onClick: ({ key }) => patchFilters({ status: key }),
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
    [t, statusMenuItems, filters.status, patchFilters, statusTooltip]
  );

  const columns = useMemo(
    () => [
      {
        title: t("UsersPage.columns.name"),
        dataIndex: "name",
        width: 260,
        ellipsis: true,
      },
      {
        title: t("UsersPage.columns.username"),
        dataIndex: "username",
        width: 220,
        ellipsis: true,
        render: (v) => <span className="users-page__username">@{v}</span>,
      },
      {
        title: t("UsersPage.columns.email"),
        dataIndex: "email",
        render: (value) => (
          <a className="users-page__email" href={`mailto:${value}`}>
            <span className="users-page__emailWrap">
              <span className="users-page__emailText">{value}</span>
              <MdOutlineEmail
                className="users-page__emailIcon"
                aria-hidden="true"
              />
            </span>
          </a>
        ),
      },
      {
        title: StatusHeader,
        dataIndex: "status",
        key: "status",
        width: 180,
        render: (v) => {
          const isActive = (v ?? "active") === "active";
          return (
            <Tag
              className={`users-status users-status--${
                isActive ? "active" : "inactive"
              }`}
            >
              {isActive
                ? t("UsersPage.status.active", { defaultValue: "Active" })
                : t("UsersPage.status.inactive", { defaultValue: "Inactive" })}
            </Tag>
          );
        },
      },

      {
        title: t("UsersPage.columns.createdAt"),
        dataIndex: "createdAt",
        key: "createdAt",
        width: 190,
        ellipsis: true,
        render: (v) => (
          <span className="users-page__createdAt">{fmtDateTime(v)}</span>
        ),
        sorter: (a, b) =>
          new Date(a?.createdAt || 0).getTime() -
          new Date(b?.createdAt || 0).getTime(),
        sortDirections: ["descend", "ascend"],
        defaultSortOrder: "descend",
      },
      {
        title: t("UsersPage.columns.actions"),
        key: "actions",
        width: 180,
        align: "left",
        className: "col-actions",
        render: (_, record) => (
          <Space className="users-page__tableActions" size={10}>
            <Tooltip title={t("UsersPage.actions.detailPosts")} placement="top">
              <Button
                className="icon-btn icon-btn--primary"
                type="text"
                icon={<BiCommentDetail />}
                onClick={() => nav(`/users/${record.id}`)}
                aria-label={t("UsersPage.actions.detailPosts")}
              />
            </Tooltip>

            <Tooltip title={t("UsersPage.actions.edit")} placement="top">
              <Button
                className="icon-btn icon-btn--purple"
                type="text"
                icon={<BiEditAlt />}
                onClick={() => openEdit(record)}
                aria-label={t("UsersPage.actions.edit")}
              />
            </Tooltip>

            <Popconfirm
              overlayClassName="users-popconfirm"
              title={t("UsersPage.confirm.deleteTitle")}
              okText={t("UsersPage.confirm.ok")}
              cancelText={t("UsersPage.confirm.cancel")}
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(record.id)}
            >
              <Tooltip title={t("UsersPage.actions.delete")} placement="top">
                <Button
                  className="icon-btn icon-btn--danger"
                  type="text"
                  icon={<AiOutlineDelete />}
                  aria-label={t("UsersPage.actions.delete")}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [t, nav, openEdit, onDelete, fmtDateTime, StatusHeader]
  );

  return (
    <div className="users-page app-page">
      {contextHolder}

      <PageHeader
        className="page-header--users"
        title={t("UsersPage.title")}
        actions={
          <Button
            type="primary"
            className="btn-blue"
            icon={<PlusOutlined />}
            onClick={openCreate}
          >
            {t("UsersPage.actions.newUser")}
          </Button>
        }
      />
      <div className="users-stats">
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={8}>
            <Card
              className="users-statCard users-statCard--total"
              bordered={false}
            >
              <div className="users-statCard__inner">
                <div className="users-statCard__icon">
                  <UserOutlined />
                </div>
                <div className="users-statCard__meta">
                  <div className="users-statCard__title">
                    {t("UsersPage.stats.total")}
                  </div>
                  <div className="users-statCard__value">{stats.total}</div>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card
              className="users-statCard users-statCard--active"
              bordered={false}
            >
              <div className="users-statCard__inner">
                <div className="users-statCard__icon">
                  <CheckCircleOutlined />
                </div>
                <div className="users-statCard__meta">
                  <div className="users-statCard__title">
                    {t("UsersPage.stats.active")}
                  </div>
                  <div className="users-statCard__value">{stats.active}</div>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card
              className="users-statCard users-statCard--inactive"
              bordered={false}
            >
              <div className="users-statCard__inner">
                <div className="users-statCard__icon">
                  <CloseCircleOutlined />
                </div>
                <div className="users-statCard__meta">
                  <div className="users-statCard__title">
                    {t("UsersPage.stats.inactive")}
                  </div>
                  <div className="users-statCard__value">{stats.inactive}</div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
      <div className="users-page__filters">
        <FiltersBar
          filters={filters}
          onChange={patchFilters}
          onReset={resetFilters}
          loading={loading}
        />
      </div>
      <Card className="users-tableCard" bordered={false}>
        <div className="users-tableCard__table">
          <Table
            className="users-table"
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={pagedUsers}
            size="middle"
            pagination={false}
          />
        </div>

        <div className="users-tableCard__footer">
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={filteredUsers.length}
            onChange={setPage}
            showSizeChanger={false}
          />
        </div>
      </Card>
      <Modal
        rootClassName="users-edit-modal--scoped"
        title={
          editing ? t("UsersPage.modal.editTitle") : t("UsersPage.modal.newTitle")
        }
        open={open}
        onCancel={closeModal}
        onOk={onSubmit}
        confirmLoading={saving}
        okText={editing ? t("UsersPage.modal.save") : t("UsersPage.modal.add")}
        cancelText={t("UsersPage.confirm.cancel")}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t("UsersPage.form.name")}
            rules={[{ required: true, message: t("UsersPage.form.required") }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="username"
            label={t("UsersPage.form.username")}
            rules={[{ required: true, message: t("UsersPage.form.required") }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label={t("UsersPage.form.email")}
            rules={[
              { required: true, message: t("UsersPage.form.required") },
              { type: "email", message: t("UsersPage.form.emailInvalid") },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="status"
            label={t("UsersPage.form.status")}
            rules={[{ required: true, message: t("UsersPage.form.required") }]}
          >
            <Radio.Group>
              <Radio value="active">{t("UsersPage.status.active")}</Radio>
              <Radio value="inactive">{t("UsersPage.status.inactive")}</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
