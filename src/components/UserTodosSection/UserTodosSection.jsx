import { useEffect, useMemo, useState, useCallback } from "react";
import {Button,Card,Form,Input,Modal,Segmented,Table,Tag,message,Empty,} from "antd";
import { useTranslation } from "react-i18next";
import { todosService } from "../../api/jp/todos.service.jp.js";
import { loadTodos, saveTodos, nextId } from "../../storage/jpDb";
import { FiTrash2, FiPlus, FiCheckCircle, FiSearch } from "react-icons/fi";
import "./UserTodosSection.scss";

const FILTERS = {
  all: "all",
  active: "active",
  completed: "completed",
};

export default function UserTodosSection({ userId }) {
  const { t } = useTranslation();

  const [messageApi, contextHolder] = message.useMessage();

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(FILTERS.all);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!Number.isFinite(userId)) return;

    const controller = new AbortController();

    (async () => {
      setLoading(true);
      try {
        const allLocal = loadTodos() || [];
        const localUserTodos = allLocal.filter((x) => Number(x.userId) === Number(userId));

        if (localUserTodos.length) {
          if (!controller.signal.aborted) setTodos(localUserTodos);
          return;
        }

        const apiTodos = await todosService.getTodosByUserId(userId, {
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
        if (err?.code === "ERR_CANCELED") return;
        messageApi.error(err?.message || t("UserTodosSection.errors.fetch"));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [userId, t, messageApi]);

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

  const persistLocalTodosForUser = useCallback(
    (nextUserTodos) => {
      const all = loadTodos() || [];
      const remaining = all.filter((x) => Number(x.userId) !== Number(userId));
      saveTodos([...remaining, ...nextUserTodos]);
    },
    [userId]
  );

  const openCreate = useCallback(() => {
    form.resetFields();
    setOpen(true);
  }, [form]);

  const closeModal = useCallback(() => {
    setOpen(false);
    setSaving(false);
    form.resetFields();
  }, [form]);

  const onCreate = useCallback(async () => {
    if (saving) return;

    try {
      setSaving(true);
      const values = await form.validateFields();

      try {
        await todosService.createTodo({
          userId,
          title: values.title,
          completed: false,
        });
      } catch (err) {
        messageApi.warning(err?.message || t("UserTodosSection.warnings.createLocal"));
      }

      const newTodo = {
        id: nextId(todos),
        userId,
        title: values.title,
        completed: false,
      };
      const nextUserTodos = [newTodo, ...todos];

      setTodos(nextUserTodos);
      persistLocalTodosForUser(nextUserTodos);

      messageApi.success(t("UserTodosSection.success.created"));
      closeModal();
    } finally {
      setSaving(false);
    }
  }, [saving, form, userId, todos, persistLocalTodosForUser, t, messageApi, closeModal]);

  const onToggleCompleted = useCallback(
    async (row) => {
      const nextValue = !row.completed;

      const nextUserTodos = todos.map((x) =>
        Number(x.id) === Number(row.id) ? { ...x, completed: nextValue } : x
      );
      setTodos(nextUserTodos);
      persistLocalTodosForUser(nextUserTodos);

      try {
        await todosService.updateTodo(row.id, { completed: nextValue });
      } catch (err) {
        const rolledBack = todos.map((x) =>
          Number(x.id) === Number(row.id) ? { ...x, completed: row.completed } : x
        );
        setTodos(rolledBack);
        persistLocalTodosForUser(rolledBack);

        messageApi.warning(err?.message || t("UserTodosSection.warnings.updateLocal"));
      }
    },
    [todos, persistLocalTodosForUser, t, messageApi]
  );

  const onDelete = useCallback(
    async (todoId) => {
      const normalizedId = Number(todoId);

      const nextUserTodos = todos.filter((x) => Number(x.id) !== normalizedId);
      setTodos(nextUserTodos);
      persistLocalTodosForUser(nextUserTodos);

      try {
        await todosService.deleteTodo(todoId);
      } catch (err) {
        messageApi.warning(err?.message || t("UserTodosSection.warnings.deleteLocal"));
      }

      messageApi.success(t("UserTodosSection.success.deleted"));
    },
    [todos, persistLocalTodosForUser, t, messageApi]
  );

  const confirmDelete = useCallback(
    (record) => {
      Modal.confirm({
        title: t("UserTodosSection.confirm.deleteTitle"),
        okText: t("UserTodosSection.confirm.ok"),
        cancelText: t("UserTodosSection.confirm.cancel"),
        okButtonProps: { danger: true },
        onOk: async () => {
          await onDelete(record.id);
        },
      });
    },
    [t, onDelete]
  );

  const clearCompleted = useCallback(() => {
    const nextUserTodos = todos.filter((x) => !x.completed);
    setTodos(nextUserTodos);
    persistLocalTodosForUser(nextUserTodos);

    setFilter(FILTERS.all);
    messageApi.success(t("UserTodosSection.success.clearedCompleted"));
  }, [todos, persistLocalTodosForUser, t, messageApi]);

  const columns = useMemo(
    () => [
      {
        title: t("UserTodosSection.columns.done"),
        dataIndex: "completed",
        width: 120,
        render: (_, record) => (
          <Button
            className={`todo-status ${
              record.completed ? "todo-status--done" : "todo-status--active"
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
        width: 120,
        align: "right",
        render: (_, record) => (
          <Button
            className="icon-btn icon-btn--danger"
            type="text"
            icon={<FiTrash2 />}
            aria-label={t("UserTodosSection.actions.delete")}
            onClick={() => confirmDelete(record)}
          />
        ),
      },
    ],
    [t, onToggleCompleted, confirmDelete]
  );

  return (
    <>
      {contextHolder}

      <Card
        className="user-todos card"
        title={
          <div className="todos-header">
            <div className="todos-header__row todos-header__row--title">
              <div className="todos-header__title">{t("UserTodosSection.title")}</div>
            </div>

            <div className="todos-header__row todos-header__row--controls">
              <div className="todos-header__right">
                <Segmented
                  value={filter}
                  onChange={setFilter}
                  className="todos-header__segmented"
                  options={[
                    { label: t("UserTodosSection.filters.all"), value: FILTERS.all },
                    { label: t("UserTodosSection.filters.active"), value: FILTERS.active },
                    { label: t("UserTodosSection.filters.completed"), value: FILTERS.completed },
                  ]}
                />

                <Input
                  className="todos-header__search"
                  placeholder={t("UserTodosSection.searchPlaceholder")}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  allowClear
                  prefix={<FiSearch className="ui-icon ui-icon--muted" />}
                />

                <div className="todos-header__actions">
                  <Button
                    type="primary"
                    onClick={openCreate}
                    className="btn-blue"
                    icon={<FiPlus className="ui-icon" />}
                  >
                    {t("UserTodosSection.actions.newTodo")}
                  </Button>

                  <Button
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
          </div>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filteredTodos}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          locale={{ emptyText: <Empty description={t("UserTodosSection.empty.noTodos")} /> }}
        />
      </Card>

      <Modal
        title={t("UserTodosSection.modal.newTitle")}
        open={open}
        onCancel={closeModal}
        onOk={onCreate}
        confirmLoading={saving}
        okText={t("UserTodosSection.modal.add")}
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
