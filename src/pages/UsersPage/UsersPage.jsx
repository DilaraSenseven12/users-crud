import { useCallback, useMemo, useState, useEffect } from "react";
import {
  Card,
  Form,
  Modal,
  Table,
  Pagination,
  message,
  Checkbox,
  Grid,
  Button,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SettingOutlined, ReloadOutlined } from "@ant-design/icons";

import UsersStatsCards from "../../components/UsersStatsCards/UsersStatsCards";
import PageHeader from "../../components/PageHeader/PageHeader";
import NewUserModal from "../../components/NewUserModal/NewUserModal";
import UserFormFields from "../../components/UserFormFields/UserFormFields";
import UsersToolbar from "./components/UsersToolbar/UsersToolbar";

import { useUsersBootstrap } from "./hooks/useUsersBootstrap";
import { useUsersDerived } from "./hooks/useUsersDerived";
import { useUsersColumns } from "./hooks/useUsersColumns";

import "./UserPage.scss";

const PAGE_SIZE = 8;

const COL_W = {
  name: 160,
  username: 150,
  email: 190,
  status: 110,
  phone: 150,
  address: 170,
  company: 160,
  createdAt: 150,
  actions: 180,
};

const SCROLL_X_ALL = Object.values(COL_W).reduce((sum, w) => sum + w, 0);

const EMPTY_USER_FORM = {
  name: "",
  username: "",
  email: "",
  status: "active",
  phone: "",
  website: "",
  address: { street: "" },
  company: { name: "" },
};

const normalizeAddress = (addr) => ({ street: addr?.street ?? "" });
const normalizeCompany = (c) => ({ name: c?.name ?? "" });

const OPTIONAL_KEYS = ["phone", "address", "company", "createdAt"];
const LS_KEY = "users:optionalCols:v1";

export default function UsersPage() {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const screens = Grid.useBreakpoint();
  const isNarrow = !screens.xl; 
  const hasScrollX = isNarrow; 

  const [optionalCols, setOptionalCols] = useState(["phone", "company"]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return;

      const cleaned = arr.filter((k) => OPTIONAL_KEYS.includes(k)).slice(0, 2);
      if (cleaned.length) setOptionalCols(cleaned);
    } catch {
    
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(optionalCols));
    } catch {
      
    }
  }, [optionalCols]);

  const effectiveOptionalCols = isNarrow ? OPTIONAL_KEYS : optionalCols;

  const toggleOptional = useCallback(
    (key) => {
      setOptionalCols((prev) => {
        const exists = prev.includes(key);
        if (exists) return prev.filter((x) => x !== key);

        if (prev.length >= 2) {
          messageApi.warning(
            t("UsersPage.columnsPicker.max2", {
              defaultValue: "You can select up to 2 columns.",
            })
          );
          return prev;
        }
        return [...prev, key];
      });
    },
    [messageApi, t]
  );

  const optionalOptions = useMemo(
    () => [
      { key: "phone", label: t("UsersPage.table.phone", { defaultValue: "Phone" }) },
      {
        key: "address",
        label: t("UsersPage.table.address", { defaultValue: "Address" }),
      },
      {
        key: "company",
        label: t("UsersPage.table.company", { defaultValue: "Company" }),
      },
      {
        key: "createdAt",
        label: t("UsersPage.columns.createdAt", { defaultValue: "Created Date" }),
      },
    ],
    [t]
  );

  const [openNew, setOpenNew] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ q: "", status: "all", range: null });

  const patchFilters = useCallback((patch) => {
    setFilters((p) => ({ ...p, ...patch }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ q: "", status: "all", range: null });
    setPage(1);
  }, []);

  const onFetchError = useCallback(() => {
    messageApi.error(t("UsersPage.errors.fetchUsers", { defaultValue: "Unable to load users." }));
  }, [messageApi, t]);

  const { users, setUsers, loading } = useUsersBootstrap({ onError: onFetchError });

  const { filteredUsers, pagedUsers, stats } = useUsersDerived({
    users,
    filters,
    page,
    setPage,
    pageSize: PAGE_SIZE,
  });

  const fmtDate = useCallback(
    (iso) => {
      if (!iso) return "-";
      const ms = Date.parse(iso);
      if (!Number.isFinite(ms)) return "-";

      const lng = (i18n.resolvedLanguage || i18n.language || "en").toLowerCase();
      const locale = lng.startsWith("tr") ? "tr-TR" : "en-US";

      return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(ms));
    },
    [i18n.language, i18n.resolvedLanguage]
  );

  const openCreate = useCallback(() => {
    setEditing(null);
    setOpenEditModal(false);
    form.resetFields();
    form.setFieldsValue(EMPTY_USER_FORM);
    setOpenNew(true);
  }, [form]);

  const handleOpenEdit = useCallback(
    (record) => {
      setOpenNew(false);
      setEditing(record);

      form.resetFields();

      const initial = {
        ...EMPTY_USER_FORM,
        ...record,
        status: record?.status ?? "active",
        address: normalizeAddress(record?.address),
        company: normalizeCompany(record?.company),
      };

      form.setFieldsValue(initial);
      setOpenEditModal(true);
    },
    [form]
  );

  const closeNewModal = useCallback(() => {
    setOpenNew(false);
    form.resetFields();
  }, [form]);

  const closeEditModal = useCallback(() => {
    setOpenEditModal(false);
    setEditing(null);
    form.resetFields();
  }, [form]);

  const onDelete = useCallback(
    async (id) => {
      try {
        const normalizedId = Number(id);
        const nextUsers = await (
          await import("../../storage/repo/users.repo")
        ).usersRepo.remove(users, normalizedId);

        setUsers(nextUsers);

        messageApi.success(
          t("UsersPage.success.userDeleted", { defaultValue: "User deleted successfully." })
        );
      } catch {
        messageApi.error(t("UsersPage.errors.fetchUsers", { defaultValue: "Unable to load users." }));
      }
    },
    [users, setUsers, messageApi, t]
  );

  const onSubmit = useCallback(async () => {
    if (saving) return;

    try {
      setSaving(true);

      const values = await form.validateFields();
      const status = values?.status === "inactive" ? "inactive" : "active";

      const repo = (await import("../../storage/repo/users.repo")).usersRepo;

      const normalizedValues = {
        ...values,
        status,
        address: normalizeAddress(values?.address),
        company: normalizeCompany(values?.company),
      };

      if (!editing) {
        const payload = { ...normalizedValues, createdAt: new Date().toISOString() };
        const next = await repo.create(users, payload);
        setUsers(next);

        messageApi.success(
          t("UsersPage.success.userCreated", { defaultValue: "User created successfully." })
        );
        closeNewModal();
      } else {
        const payload = { ...editing, ...normalizedValues };
        const next = await repo.update(users, editing.id, payload);
        setUsers(next);

        messageApi.success(
          t("UsersPage.success.userUpdated", { defaultValue: "User updated successfully." })
        );
        closeEditModal();
      }
    } finally {
      setSaving(false);
    }
  }, [saving, form, editing, users, setUsers, messageApi, t, closeNewModal, closeEditModal]);

  const { columns } = useUsersColumns({
    t,
    colWidth: COL_W,
    hasScrollX,
    visibleOptionalCols: effectiveOptionalCols,
    statusValue: filters.status,
    onStatusChange: (key) => patchFilters({ status: key }),
    fmtDate,
    onDetail: (record) => nav(`/users/${record.id}`),
    onEdit: handleOpenEdit,
    onDelete,
  });

  const newUserTexts = useMemo(
    () => ({
      title: t("UsersPage.modal.newTitle", { defaultValue: "New User" }),
      add: t("UsersPage.modal.add", { defaultValue: "Add" }),
      cancel: t("UsersPage.confirm.cancel", { defaultValue: "Cancel" }),

      name: t("UsersPage.form.name", { defaultValue: "Name" }),
      username: t("UsersPage.form.username", { defaultValue: "Username" }),
      email: t("UsersPage.form.email", { defaultValue: "Email" }),
      status: t("UsersPage.form.status", { defaultValue: "Status" }),

      phone: t("UsersPage.table.phone", { defaultValue: "Phone" }),
      address: t("UsersPage.table.address", { defaultValue: "Address" }),
      companyName: t("UsersPage.table.company", { defaultValue: "Company" }),

      required: t("UsersPage.form.required", { defaultValue: "Required" }),
      emailInvalid: t("UsersPage.form.emailInvalid", { defaultValue: "Invalid email" }),

      active: t("UsersPage.status.active", { defaultValue: "Active" }),
      inactive: t("UsersPage.status.inactive", { defaultValue: "Inactive" }),
    }),
    [t]
  );

  return (
    <div className="users-page users-page--wide app-page">
      {contextHolder}

      <PageHeader
        className="page-header--users"
        title={t("UsersPage.title", { defaultValue: "Users" })}
      />

      <UsersStatsCards
        stats={stats}
        loading={loading}
        selectedKey={filters.status}
        onSelect={(key) => patchFilters({ status: key })}
      />

      <UsersToolbar
        t={t}
        filters={filters}
        onChange={patchFilters}
        onReset={resetFilters}
        loading={loading}
        onNewUser={openCreate}
      />

      {!isNarrow && (
        <div className="users-colsPick">
          <div className="users-colsPick__head">
            <div className="users-colsPick__titleRow">
              <span className="users-colsPick__icon" aria-hidden="true">
                <SettingOutlined />
              </span>

              <div className="users-colsPick__titles">
                <div className="users-colsPick__title">
                  {t("UsersPage.columnsPicker.title", { defaultValue: "Extra columns" })}
                </div>
                <div className="users-colsPick__sub">
                  {t("UsersPage.columnsPicker.sub", {
                    defaultValue: "Customize your view (max 2 selections)",
                  })}
                </div>
              </div>
            </div>

            <div className="users-colsPick__right">
              <span className="users-colsPick__count" aria-label="selected-count">
                {optionalCols.length}/2
              </span>

              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                className="users-colsPick__reset"
                onClick={() => setOptionalCols([])}
                disabled={optionalCols.length === 0}
              >
                {t("UsersPage.filters.reset", { defaultValue: "Reset" })}
              </Button>
            </div>
          </div>

          <div className="users-colsPick__items">
            {optionalOptions.map((opt) => {
              const checked = optionalCols.includes(opt.key);
              const disabled = !checked && optionalCols.length >= 2;

              return (
                <Checkbox
                  key={opt.key}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleOptional(opt.key)}
                  className="users-colsPick__chip"
                >
                  {opt.label}
                </Checkbox>
              );
            })}
          </div>
        </div>
      )}

      <Card className="users-tableCard" variant="borderless">
        <div
          className={
            "users-tableCard__table" + (hasScrollX ? " users-tableCard__table--scroll" : "")
          }
        >
          <Table
            className={"users-table" + (hasScrollX ? " users-table--scroll" : "")}
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={pagedUsers}
            size="small"
            pagination={false}
            tableLayout="fixed"
            scroll={hasScrollX ? { x: SCROLL_X_ALL } : undefined}
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

      <NewUserModal
        open={openNew}
        saving={saving}
        form={form}
        onCancel={closeNewModal}
        onOk={onSubmit}
        t={t}
        texts={newUserTexts}
        title={newUserTexts.title}
        okText={newUserTexts.add}
        cancelText={newUserTexts.cancel}
      />

      <Modal
        rootClassName="users-edit-modal--scoped"
        title={t("UsersPage.modal.editTitle", { defaultValue: "Edit User" })}
        open={openEditModal}
        onCancel={closeEditModal}
        onOk={onSubmit}
        confirmLoading={saving}
        okText={t("UsersPage.modal.save", { defaultValue: "Save" })}
        cancelText={t("UsersPage.confirm.cancel", { defaultValue: "Cancel" })}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <UserFormFields t={t} texts={newUserTexts} />
        </Form>
      </Modal>
    </div>
  );
}
