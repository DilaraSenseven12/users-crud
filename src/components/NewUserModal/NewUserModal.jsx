import React, { useEffect } from "react";
import { Modal, Form } from "antd";
import UserFormFields from "../UserFormFields/UserFormFields";

const EMPTY_USER = {
  name: "",
  username: "",
  email: "",
  status: "active",
  phone: "",
  website: "",
  address: { street: "" },
  company: { name: "" },
};


export default function NewUserModal({
  open,
  saving = false,
  form,
  onCancel,
  onOk,
  title,
  okText,
  cancelText,
  t,
  texts,
}) {
  useEffect(() => {
    if (!open) return;

    form?.resetFields();
    form?.setFieldsValue(EMPTY_USER);
  }, [open, form]);

  return (
    <Modal
      rootClassName="users-edit-modal--scoped"
      title={title}
      open={open}
      onCancel={() => {
        form?.resetFields();
        onCancel?.();
      }}
      onOk={onOk}
      confirmLoading={saving}
      okText={okText}
      cancelText={cancelText}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <UserFormFields t={t} texts={texts} />
      </Form>
    </Modal>
  );
}
