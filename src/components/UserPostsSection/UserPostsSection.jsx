import { useEffect, useMemo, useState } from "react";
import {Button,Card,Form,Input,Modal,Popconfirm,Space,Table,Tooltip,message,Empty,} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { postsService } from "../../api/jp/posts.service.jp";
import { loadPosts, savePosts, nextId } from "../../storage/jpDb";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import "./UserPostsSection.scss";

export default function UserPostsSection({ userId }) {
    const { t } = useTranslation();

    const uid = Number(userId);

    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);

    const [q, setQ] = useState("");

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();

    const applyFilter = (list, term) => {
        const tt = (term || "").trim().toLowerCase();
        if (!tt) return list;
        return list.filter((p) => {
            const s = `${p.title ?? ""} ${p.body ?? ""}`.toLowerCase();
            return s.includes(tt);
        });
    };

    const filteredPosts = useMemo(() => applyFilter(posts, q), [posts, q]);

    const persistLocalPostsForUser = (nextUserPosts) => {
        const all = loadPosts() || [];
        const remaining = all.filter((p) => Number(p.userId) !== uid);
        savePosts([...remaining, ...nextUserPosts]);
    };

    useEffect(() => {
        if (!Number.isFinite(uid)) return;

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
                if (err?.code === "ERR_CANCELED") return;
                message.error(err?.message || t("UserPostsSection.errors.fetchPosts"));
            } finally {
                if (!controller.signal.aborted) setLoadingPosts(false);
            }
        })();

        return () => controller.abort();
    }, [uid, t]);

    const openCreate = () => {
        setEditing(null);
        form.resetFields();
        setOpen(true);
    };

    const openEdit = (post) => {
        setEditing(post);
        form.setFieldsValue({ title: post.title, body: post.body });
        setOpen(true);
    };

    const closeModal = () => {
        setOpen(false);
        setEditing(null);
        setSaving(false);
        form.resetFields();
    };

    const onSubmit = async () => {
        if (saving) return;

        try {
            setSaving(true);
            const values = await form.validateFields();

            if (!editing) {
                try {
                    await postsService.createPost({ userId: uid, ...values });
                } catch (err) {
                    message.warning(
                        err?.message || t("UserPostsSection.warnings.createFailedLocal")
                    );
                }

                const all = loadPosts() || [];
                const newPost = { id: nextId(all), userId: uid, ...values };

                const nextUserPosts = [newPost, ...posts];
                setPosts(nextUserPosts);
                persistLocalPostsForUser(nextUserPosts);

                message.success(t("UserPostsSection.success.created"));
            } else {
                try {
                    await postsService.updatePost(editing.id, values);
                } catch (err) {
                    message.warning(
                        err?.message || t("UserPostsSection.warnings.updateFailedLocal")
                    );
                }

                const nextUserPosts = posts.map((p) =>
                    p.id === editing.id ? { ...p, ...values } : p
                );

                setPosts(nextUserPosts);
                persistLocalPostsForUser(nextUserPosts);

                message.success(t("UserPostsSection.success.updated"));
            }

            closeModal();
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async (postId) => {
        try {
            await postsService.deletePost(postId);
        } catch (err) {
            message.warning(err?.message || t("UserPostsSection.warnings.deleteFailedLocal"));
        }

        const nextUserPosts = posts.filter((p) => p.id !== postId);
        setPosts(nextUserPosts);
        persistLocalPostsForUser(nextUserPosts);

        message.success(t("UserPostsSection.success.deleted"));
    };

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
                align: "right",
                render: (_, record) => (
                    <Space size={10}>
                        <Tooltip title={t("UserPostsSection.actions.edit")}>
                            <Button
                                type="primary"
                                shape="circle"
                                className="ant-btn-icon-circle ant-btn-icon-circle--edit"
                                icon={<EditOutlined />}
                                onClick={() => openEdit(record)}
                                aria-label={t("UserPostsSection.actions.edit")}
                            />
                        </Tooltip>

                        <Popconfirm
                            title={t("UserPostsSection.confirm.deleteTitle")}
                            okText={t("UserPostsSection.confirm.ok")}
                            cancelText={t("UserPostsSection.confirm.cancel")}
                            onConfirm={() => onDelete(record.id)}
                        >
                            <Tooltip title={t("UserPostsSection.actions.delete")}>
                                <Button
                                    danger
                                    shape="circle"
                                    className="ant-btn-icon-circle ant-btn-icon-circle--delete"
                                    icon={<DeleteOutlined />}
                                    aria-label={t("UserPostsSection.actions.delete")}
                                />
                            </Tooltip>
                        </Popconfirm>
                    </Space>
                ),


            },
        ],
        [t, posts]
    );

    return (
        <>
            <Card
                className="user-posts card"
                title={
                    <div className="section-header">
                        <div className="section-header__title">
                            {t("UserPostsSection.title")}
                        </div>

                        <div className="section-header__actions">
                            <Input
                                className="section-header__search"
                                placeholder={t("UserPostsSection.searchPlaceholder")}
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                allowClear
                            />

                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                className="section-header__primary btn-blue"
                                onClick={openCreate}
                            >
                                {t("UserPostsSection.actions.newPost")}
                            </Button>
                        </div>
                    </div>
                }
            >
                <Table
                    rowKey="id"
                    loading={loadingPosts}
                    columns={columns}
                    dataSource={filteredPosts}
                    pagination={{ pageSize: 8, showSizeChanger: false }}
                    locale={{
                        emptyText: (
                            <Empty description={t("UserPostsSection.empty.noPosts") || "No posts"} />
                        ),
                    }}
                />
            </Card>

            <Modal
                className="post-modal post-modal--scoped"
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
                okText={
                    editing ? t("UserPostsSection.modal.save") : t("UserPostsSection.modal.add")
                }
                cancelText={t("Common.cancel")}
                destroyOnClose
                centered
                width={560}
                okButtonProps={{ className: "post-modal__ok" }}
                cancelButtonProps={{ className: "post-modal__cancel" }}
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
