import { useEffect, useMemo, useState, useCallback } from "react";
import {Button,Form,Input,Modal,Space,Table,message,Tooltip,Popconfirm,} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { BiCommentDetail, BiEditAlt } from "react-icons/bi";
import { AiOutlineDelete } from "react-icons/ai";
import { MdOutlineEmail } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usersRepo } from "../../storage/repo/users.repo";
import "../UsersPage/UserPage.scss";

export default function UsersPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      try {
        const data = await usersRepo.bootstrap({ signal: controller.signal });
        setUsers(data);
      } catch {
        messageApi.error(t("UsersPage.errors.fetchUsers"));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [t, messageApi]);

  const filteredUsers = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;

    return users.filter((u) =>
      `${u.name} ${u.username} ${u.email}`.toLowerCase().includes(term)
    );
  }, [users, q]);

  const openEdit = useCallback(
    (record) => {
      setEditing(record);
      form.setFieldsValue({
        name: record?.name ?? "",
        username: record?.username ?? "",
        email: record?.email ?? "",
      });
      setOpen(true);
    },
    [form]
  );

  const openCreate = useCallback(() => {
    setEditing(null);
    form.resetFields();
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

      if (!editing) {
        const next = await usersRepo.create(users, values);
        setUsers(next);
        messageApi.success(t("UsersPage.success.userCreated"));
      } else {
        const next = await usersRepo.update(users, editing.id, values);
        setUsers(next);
        messageApi.success(t("UsersPage.success.userUpdated"));
      }

      closeModal();
    } finally {
      setSaving(false);
    }
  }, [saving, form, editing, users, t, closeModal, messageApi]);

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
        title: t("UsersPage.columns.actions"),
        key: "actions",
        width: 180,
        align: "left",
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
    [t, nav, openEdit, onDelete]
  );

  return (
    <div className="users-page app-page">
      {contextHolder}

      <div className="page-header page-header--users">
        <h2 className="page-header__title">{t("UsersPage.title")}</h2>

        <div className="page-header__actions">
          <Input
            className="page-header__search"
            placeholder={t("UsersPage.searchPlaceholder")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            allowClear
          />

          <Button
            type="primary"
            className="btn-blue"
            icon={<PlusOutlined />}
            onClick={openCreate}
          >
            {t("UsersPage.actions.newUser")}
          </Button>
        </div>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={filteredUsers}
        size="middle"
        pagination={{ pageSize: 8, showSizeChanger: false }}
      />

      <Modal
        rootClassName="users-edit-modal--scoped"
        title={
          editing
            ? t("UsersPage.modal.editTitle")
            : t("UsersPage.modal.newTitle")
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
        </Form>
      </Modal>
    </div>
  );
}
