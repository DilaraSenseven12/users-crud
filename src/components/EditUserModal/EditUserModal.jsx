import React, { useEffect } from "react";
import { Modal, Form } from "antd";
import UserFormFields from "../UserFormFields/UserFormFields";

export default function EditUserModal({
  open,
  saving = false,
  form,
  user,       
  onCancel,
  onOk,
  title,
  okText,
  cancelText,
  t,
}) {
  useEffect(() => {
    if (!open) return;

   
    form?.resetFields();

    if (user) {
      form?.setFieldsValue(user);
    }
  }, [open, user, form]);

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
        <UserFormFields t={t} />
      </Form>
    </Modal>
  );
}
