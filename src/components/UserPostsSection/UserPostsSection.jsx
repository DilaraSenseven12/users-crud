import { useCallback, useEffect, useMemo, useState } from "react";
import {Button,Card,Form,Input,Modal,Popconfirm,Space,Table,Tooltip,Empty,Select,Pagination,} from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { postsService } from "../../api/jp/posts.service.jp";
import { loadPosts, savePosts, nextId } from "../../storage/jpDb";
import { FiPlus } from "react-icons/fi";
import { BiEditAlt } from "react-icons/bi";
import { AiOutlineDelete } from "react-icons/ai";
import SectionHeader from "../SectionHeader/SectionHeader";
import { createToastChannel } from "../../ui/toastCenter";
import "./UserPostsSection.scss";

const PAGE_SIZE_OPTIONS = [5, 8, 10, 20];

function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

export default function UserPostsSection({ userId }) {
  const { t } = useTranslation();
  const uid = useMemo(() => Number(userId), [userId]);

  const toastCh = useMemo(() => createToastChannel("user-posts"), []);

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 250);

  const [sortKey, setSortKey] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form] = Form.useForm();

  const persistLocalPostsForUser = useCallback(
    (nextUserPosts) => {
      const all = loadPosts() || [];
      const remaining = all.filter((p) => Number(p.userId) !== uid);
      savePosts([...remaining, ...nextUserPosts]);
    },
    [uid]
  );

  useEffect(() => {
    if (!Number.isFinite(uid)) {
      setPosts([]);
      setLoadingPosts(false);
      return;
    }

    const controller = new AbortController();

    (async () => {
      setLoadingPosts(true);
      try {
        const allLocal = loadPosts() || [];
        const localUserPosts = allLocal.filter((p) => Number(p.userId) === uid);

        if (localUserPosts.length) {
          if (!controller.signal.aborted) setPosts(localUserPosts);
          return;
        }

        const apiPosts = await postsService.getPostsByUserId(uid, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setPosts(apiPosts);

        const merged = [...allLocal];
        for (const p of apiPosts) {
          if (!merged.some((x) => x.id === p.id)) merged.push(p);
        }
        savePosts(merged);
      } catch (err) {
        if (controller.signal.aborted) return;
        toastCh.apiError(err, t("UserPostsSection.errors.fetchPosts"));
      } finally {
        if (!controller.signal.aborted) setLoadingPosts(false);
      }
    })();

    return () => controller.abort();
  }, [uid, t, toastCh]);

  const filteredPosts = useMemo(() => {
    const tt = (debouncedQ || "").trim().toLowerCase();

    const filtered = !tt
      ? posts
      : posts.filter((p) => {
          const s = `${p?.title ?? ""} ${p?.body ?? ""}`.toLowerCase();
          return s.includes(tt);
        });

    const sorted = [...filtered];

    if (sortKey === "az") {
      sorted.sort((a, b) =>
        String(a?.title || "").localeCompare(String(b?.title || ""))
      );
    } else if (sortKey === "za") {
      sorted.sort((a, b) =>
        String(b?.title || "").localeCompare(String(a?.title || ""))
      );
    } else if (sortKey === "oldest") {
      sorted.sort((a, b) => Number(a?.id) - Number(b?.id));
    } else {
      sorted.sort((a, b) => Number(b?.id) - Number(a?.id));
    }

    return sorted;
  }, [posts, debouncedQ, sortKey]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, sortKey, pageSize]);

  const total = filteredPosts.length;

  const pagedPosts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPosts.slice(start, start + pageSize);
  }, [filteredPosts, page, pageSize]);

  const openCreate = useCallback(() => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (post) => {
      setEditing(post);
      form.setFieldsValue({ title: post?.title ?? "", body: post?.body ?? "" });
      setOpen(true);
    },
    [form]
  );

  const closeModal = useCallback(() => {
    setOpen(false);
    setEditing(null);
    setSaving(false);
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
        toastCh.formFirstError(e, t("UserPostsSection.form.required"));
        return;
      }

      if (!editing) {
        try {
          await postsService.createPost({ userId: uid, ...values });
        } catch (err) {
          toastCh.warning(
            err?.message || t("UserPostsSection.warnings.createFailedLocal")
          );
        }

        const all = loadPosts() || [];
        const newPost = { id: nextId(all), userId: uid, ...values };

        const nextUserPosts = [newPost, ...posts];
        setPosts(nextUserPosts);
        persistLocalPostsForUser(nextUserPosts);

        toastCh.success(t("UserPostsSection.success.created"));
        closeModal();
        return;
      }

      try {
        await postsService.updatePost(editing.id, values);
      } catch (err) {
        toastCh.warning(
          err?.message || t("UserPostsSection.warnings.updateFailedLocal")
        );
      }

      const nextUserPosts = posts.map((p) =>
        p.id === editing.id ? { ...p, ...values } : p
      );

      setPosts(nextUserPosts);
      persistLocalPostsForUser(nextUserPosts);

      toastCh.success(t("UserPostsSection.success.updated"));
      closeModal();
    } finally {
      setSaving(false);
    }
  }, [
    saving,
    uid,
    form,
    editing,
    posts,
    persistLocalPostsForUser,
    t,
    closeModal,
    toastCh,
  ]);

  const onDelete = useCallback(
    async (postId) => {
      try {
        await postsService.deletePost(postId);
      } catch (err) {
        toastCh.warning(
          err?.message || t("UserPostsSection.warnings.deleteFailedLocal")
        );
      }

      const nextUserPosts = posts.filter((p) => p.id !== postId);
      setPosts(nextUserPosts);
      persistLocalPostsForUser(nextUserPosts);

      toastCh.success(t("UserPostsSection.success.deleted"));
    },
    [posts, persistLocalPostsForUser, t, toastCh]
  );

  const columns = useMemo(
    () => [
      {
        title: t("UserPostsSection.columns.title"),
        dataIndex: "title",
        key: "title",
        ellipsis: true,
      },
      {
        title: t("UserPostsSection.columns.body"),
        dataIndex: "body",
        key: "body",
        ellipsis: true,
        render: (text) => (
          <Tooltip title={text} placement="topLeft">
            <span>{text}</span>
          </Tooltip>
        ),
      },
      {
        title: t("UserPostsSection.columns.actions"),
        key: "actions",
        width: 220,
        align: "left",
        render: (_, record) => (
          <Space size={10}>
            <Tooltip title={t("UserPostsSection.actions.edit")}>
              <Button
                type="text"
                className="icon-btn icon-btn--edit"
                icon={<BiEditAlt />}
                onClick={() => openEdit(record)}
                aria-label={t("UserPostsSection.actions.edit")}
              />
            </Tooltip>

            <Popconfirm
              overlayClassName="posts-popconfirm"
              title={t("UserPostsSection.confirm.deleteTitle")}
              okText={t("UserPostsSection.confirm.ok")}
              cancelText={t("UserPostsSection.confirm.cancel")}
              onConfirm={() => onDelete(record.id)}
            >
              <Tooltip title={t("UserPostsSection.actions.delete")}>
                <Button
                  type="text"
                  className="icon-btn icon-btn--danger"
                  icon={<AiOutlineDelete />}
                  aria-label={t("UserPostsSection.actions.delete")}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [t, openEdit, onDelete]
  );

  return (
    <>
      <Card
        className="user-posts card"
        title={
          <SectionHeader
            title={t("UserPostsSection.title")}
            search={
              <Input
                placeholder={t("UserPostsSection.searchPlaceholder")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                allowClear
              />
            }
            actions={
              <Space size={10} wrap>
                <Select
                  value={sortKey}
                  onChange={setSortKey}
                  className="posts-sort"
                  dropdownClassName="posts-sort-dropdown"
                  suffixIcon={<DownOutlined className="posts-sort__arrow" />}
                  options={[
                    { value: "newest", label: t("Common.sort.newest") },
                    { value: "oldest", label: t("Common.sort.oldest") },
                    { value: "az", label: t("Common.sort.az") },
                    { value: "za", label: t("Common.sort.za") },
                  ]}
                />

                <Button
                  type="primary"
                  icon={<FiPlus />}
                  className="btn-blue"
                  onClick={openCreate}
                >
                  {t("UserPostsSection.actions.newPost")}
                </Button>
              </Space>
            }
          />
        }
      >
        <Table
          rowKey="id"
          loading={loadingPosts}
          columns={columns}
          dataSource={pagedPosts}
          pagination={false}
          locale={{
            emptyText: <Empty description={t("UserPostsSection.empty.noPosts")} />,
          }}
        />

        <div className="posts-pagination">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={(nextPage, nextSize) => {
              setPage(nextPage);
              if (typeof nextSize === "number" && nextSize !== pageSize) {
                setPageSize(nextSize);
              }
            }}
            showSizeChanger
            pageSizeOptions={PAGE_SIZE_OPTIONS.map(String)}
            showTotal={false}
          />
        </div>
      </Card>

      <Modal
        rootClassName="post-modal--scoped"
        closeIcon={null}
        title={
          <div className="post-modal__titleRow">
            <span className="post-modal__titleText">
              {editing
                ? t("UserPostsSection.modal.editTitle")
                : t("UserPostsSection.modal.newTitle")}
            </span>

            <button
              type="button"
              className="post-modal__x"
              onClick={closeModal}
              aria-label={t("Common.close") || "Close"}
            >
              ✕
            </button>
          </div>
        }
        open={open}
        onCancel={closeModal}
        onOk={onSubmit}
        confirmLoading={saving}
        okText={editing ? t("UserPostsSection.modal.save") : t("UserPostsSection.modal.add")}
        cancelText={t("Common.cancel")}
        destroyOnClose
        centered
      >
        <Form form={form} layout="vertical" className="post-modal__form">
          <Form.Item
            name="title"
            label={t("UserPostsSection.form.title")}
            rules={[{ required: true, message: t("UserPostsSection.form.required") }]}
          >
            <Input placeholder={t("UserPostsSection.form.title")} />
          </Form.Item>

          <Form.Item
            name="body"
            label={t("UserPostsSection.form.body")}
            rules={[{ required: true, message: t("UserPostsSection.form.required") }]}
          >
            <Input.TextArea rows={6} placeholder={t("UserPostsSection.form.body")} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
