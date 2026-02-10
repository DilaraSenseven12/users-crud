
import { useEffect, useMemo, useState, useCallback } from "react";
import {Button,Card,Empty,Form,Input,Modal,Popconfirm,Segmented,Space,Table,Tag,} from "antd";
import { useTranslation } from "react-i18next";
import { FiCheckCircle, FiPlus, FiSearch } from "react-icons/fi";
import { BiEditAlt } from "react-icons/bi";
import { AiOutlineDelete } from "react-icons/ai";
import { todosService } from "../../api/jp/todos.service.jp.js";
import { loadTodos, saveTodos, nextId } from "../../storage/jpDb";
import { createToastChannel } from "../../ui/toastCenter";
import "./UserTodosSection.scss";

const FILTERS = {
  all: "all",
  active: "active",
  completed: "completed",
};

export default function UserTodosSection({ userId }) {
  const { t } = useTranslation();
  const uid = useMemo(() => Number(userId), [userId]);

  const toastCh = useMemo(() => createToastChannel("user-todos"), []);

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(FILTERS.all);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form] = Form.useForm();

  const persistLocalTodosForUser = useCallback(
    (nextUserTodos) => {
      const all = loadTodos() || [];
      const remaining = all.filter((x) => Number(x.userId) !== uid);
      saveTodos([...remaining, ...nextUserTodos]);
    },
    [uid]
  );

  useEffect(() => {
    if (!Number.isFinite(uid)) {
      setTodos([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    (async () => {
      setLoading(true);
      try {
        const allLocal = loadTodos() || [];
        const localUserTodos = allLocal.filter((x) => Number(x.userId) === uid);

        if (localUserTodos.length) {
          if (!controller.signal.aborted) setTodos(localUserTodos);
          return;
        }

        const apiTodos = await todosService.getTodosByUserId(uid, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setTodos(apiTodos);

        const merged = [...allLocal];
        for (const td of apiTodos) {
          if (!merged.some((x) => Number(x.id) === Number(td.id))) merged.push(td);
        }
        saveTodos(merged);
      } catch (err) {
        if (controller.signal.aborted) return;
        toastCh.apiError(err, t("UserTodosSection.errors.fetch"));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [uid, t, toastCh]);

  const counts = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((x) => !!x.completed).length;
    const active = total - completed;
    return { total, active, completed };
  }, [todos]);

  const filteredTodos = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = todos;

    if (filter === FILTERS.active) list = list.filter((x) => !x.completed);
    if (filter === FILTERS.completed) list = list.filter((x) => !!x.completed);

    if (!term) return list;
    return list.filter((x) => `${x.title}`.toLowerCase().includes(term));
  }, [todos, q, filter]);

  const openCreate = useCallback(() => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (record) => {
      setEditing(record);
      form.setFieldsValue({ title: record?.title ?? "" });
      setOpen(true);
    },
    [form]
  );

  const closeModal = useCallback(() => {
    setOpen(false);
    setSaving(false);
    setEditing(null);
    form.resetFields();
  }, [form]);

  const onSubmit = useCallback(async () => {
    if (saving) return;
    if (!Number.isFinite(uid)) return;

    try {
      setSaving(true);

      let values;
      try {
        values = await form.validateFields();
      } catch (e) {
        toastCh.formFirstError(e, t("UserTodosSection.form.required"));
        return;
      }

      const title = `${values.title}`.trim();

      if (!editing) {
        try {
          await todosService.createTodo({ userId: uid, title, completed: false });
        } catch (err) {
          toastCh.warning(err?.message || t("UserTodosSection.warnings.createLocal"));
        }

        const all = loadTodos() || [];
        const newTodo = {
          id: nextId(all),
          userId: uid,
          title,
          completed: false,
        };

        const nextUserTodos = [newTodo, ...todos];
        setTodos(nextUserTodos);
        persistLocalTodosForUser(nextUserTodos);

        toastCh.success(t("UserTodosSection.success.created"));
        closeModal();
        return;
      }

      const prev = editing;

      const optimistic = todos.map((x) =>
        Number(x.id) === Number(prev.id) ? { ...x, title } : x
      );
      setTodos(optimistic);
      persistLocalTodosForUser(optimistic);

      try {
        await todosService.updateTodo(prev.id, { title });
      } catch (err) {
        const rolledBack = todos.map((x) =>
          Number(x.id) === Number(prev.id) ? { ...x, title: prev.title } : x
        );
        setTodos(rolledBack);
        persistLocalTodosForUser(rolledBack);

        toastCh.warning(err?.message || t("UserTodosSection.warnings.updateLocal"));
      }

      toastCh.success(t("UserTodosSection.success.updated"));
      closeModal();
    } finally {
      setSaving(false);
    }
  }, [
    saving,
    form,
    editing,
    uid,
    todos,
    persistLocalTodosForUser,
    t,
    toastCh,
    closeModal,
  ]);

  const onToggleCompleted = useCallback(
    async (row) => {
      const nextValue = !row.completed;

      const optimistic = todos.map((x) =>
        Number(x.id) === Number(row.id) ? { ...x, completed: nextValue } : x
      );
      setTodos(optimistic);
      persistLocalTodosForUser(optimistic);

      try {
        await todosService.updateTodo(row.id, { completed: nextValue });
      } catch (err) {
        const rolledBack = todos.map((x) =>
          Number(x.id) === Number(row.id) ? { ...x, completed: row.completed } : x
        );
        setTodos(rolledBack);
        persistLocalTodosForUser(rolledBack);

        toastCh.warning(err?.message || t("UserTodosSection.warnings.updateLocal"));
      }
    },
    [todos, persistLocalTodosForUser, t, toastCh]
  );

  const onDelete = useCallback(
    async (todoId) => {
      const normalizedId = Number(todoId);

      const optimistic = todos.filter((x) => Number(x.id) !== normalizedId);
      setTodos(optimistic);
      persistLocalTodosForUser(optimistic);

      try {
        await todosService.deleteTodo(todoId);
      } catch (err) {
        toastCh.warning(err?.message || t("UserTodosSection.warnings.deleteLocal"));
      }

      toastCh.success(t("UserTodosSection.success.deleted"));
    },
    [todos, persistLocalTodosForUser, t, toastCh]
  );

  const clearCompleted = useCallback(() => {
    const nextUserTodos = todos.filter((x) => !x.completed);
    setTodos(nextUserTodos);
    persistLocalTodosForUser(nextUserTodos);

    setFilter(FILTERS.all);
    toastCh.success(t("UserTodosSection.success.clearedCompleted"));
  }, [todos, persistLocalTodosForUser, t, toastCh]);

  const columns = useMemo(
    () => [
      {
        title: t("UserTodosSection.columns.done"),
        dataIndex: "completed",
        width: 120,
        render: (_, record) => (
          <Button
            className={`todo-status ${record.completed ? "todo-status--done" : "todo-status--active"
              }`}
            type="default"
            onClick={() => onToggleCompleted(record)}
          >
            {record.completed
              ? t("UserTodosSection.labels.done")
              : t("UserTodosSection.labels.active")}
          </Button>
        ),
      },
      {
        title: t("UserTodosSection.columns.title"),
        dataIndex: "title",
        render: (text, record) => (
          <div className={record.completed ? "todo-title todo-title--done" : "todo-title"}>
            {text}
            {record.completed && (
              <Tag className="todo-tag">{t("UserTodosSection.labels.completed")}</Tag>
            )}
          </div>
        ),
      },
      {
        title: t("UserTodosSection.columns.actions"),
        key: "actions",
        width: 140,
        align: "left",
        render: (_, record) => (
          <Space size={8}>
            <Button
              className="icon-btn icon-btn--edit"
              type="text"
              icon={<BiEditAlt />}
              aria-label={t("UserTodosSection.actions.edit")}
              onClick={() => openEdit(record)}
            />
            <Popconfirm
              overlayClassName="todos-popconfirm"
              getPopupContainer={() => document.querySelector(".user-todos") || document.body}
              title={t("UserTodosSection.confirm.deleteTitle")}
              okText={t("UserTodosSection.confirm.ok")}
              cancelText={t("UserTodosSection.confirm.cancel")}
              okType="primary"
              onConfirm={() => onDelete(record.id)}
            >
              <Button
                className="icon-btn icon-btn--danger"
                type="text"
                icon={<AiOutlineDelete />}
                aria-label={t("UserTodosSection.actions.delete")}
              />
            </Popconfirm>
          </Space>
        ),
      }
    ],
    [t, onToggleCompleted, openEdit, onDelete]
  );

  return (
    <>
      <Card
        className="user-todos card"
        title={
          <div className="todos-headbar">
            <div className="todos-headbar__left">
              <Segmented
                value={filter}
                onChange={setFilter}
                className="todos-header__segmented"
                options={[
                  {
                    label: (
                      <span className="todos-seg">
                        <span>{t("UserTodosSection.filters.all")}</span>
                        <span className="todos-seg__count">{counts.total}</span>
                      </span>
                    ),
                    value: FILTERS.all,
                  },
                  {
                    label: (
                      <span className="todos-seg">
                        <span>{t("UserTodosSection.filters.active")}</span>
                        <span className="todos-seg__count">{counts.active}</span>
                      </span>
                    ),
                    value: FILTERS.active,
                  },
                  {
                    label: (
                      <span className="todos-seg">
                        <span>{t("UserTodosSection.filters.completed")}</span>
                        <span className="todos-seg__count">{counts.completed}</span>
                      </span>
                    ),
                    value: FILTERS.completed,
                  },
                ]}
              />
            </div>

            <div className="todos-headbar__right">
              <Input
                className="todos-headbar__search"
                placeholder={t("UserTodosSection.searchPlaceholder")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                allowClear
                prefix={<FiSearch className="ui-icon ui-icon--muted" />}
              />

              <div className="todos-headbar__actions">
                <Button
                  type="primary"
                  onClick={openCreate}
                  className="btn-blue"
                  icon={<FiPlus className="ui-icon" />}
                >
                  {t("UserTodosSection.actions.newTodo")}
                </Button>
                <Button
                  type="default"
                  disabled={!counts.completed}
                  onClick={clearCompleted}
                  className="btn-blue"
                  icon={<FiCheckCircle className="ui-icon" />}
                >
                  {t("UserTodosSection.actions.clearCompleted")}
                </Button>
              </div>
            </div>
          </div>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filteredTodos}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          locale={{
            emptyText: <Empty description={t("UserTodosSection.empty.noTodos")} />,
          }}
        />
      </Card>

      <Modal
        rootClassName="todos-modal--scoped"
        title={
          editing
            ? t("UserTodosSection.modal.editTitle")
            : t("UserTodosSection.modal.newTitle")
        }
        open={open}
        onCancel={closeModal}
        onOk={onSubmit}
        confirmLoading={saving}
        okText={
          editing ? t("UserTodosSection.modal.save") : t("UserTodosSection.modal.add")
        }
        cancelText={t("Common.cancel")}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label={t("UserTodosSection.form.title")}
            rules={[{ required: true, message: t("UserTodosSection.form.required") }]}
          >
            <Input autoFocus />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
