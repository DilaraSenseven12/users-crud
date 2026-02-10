import React from "react";
import { Form, Input, Radio, Row, Col, Divider } from "antd";

export default function UserFormFields({ t, texts }) {
  const getText = (key, def) => {
    if (texts?.[key] != null) return texts[key];
    if (typeof t === "function") return t(key, { defaultValue: def });
    return def;
  };

  const requiredMsg =
    texts?.required ??
    (typeof t === "function"
      ? t("UsersPage.form.required", { defaultValue: "Required" })
      : "Required");

  const emailInvalidMsg =
    texts?.emailInvalid ??
    (typeof t === "function"
      ? t("UsersPage.form.emailInvalid", { defaultValue: "Invalid email" })
      : "Invalid email");

  return (
    <>
      <Row gutter={12}>
        <Col xs={24} md={12}>
          <Form.Item
            name="name"
            label={getText("name", "Name")}
            rules={[{ required: true, message: requiredMsg }]}
          >
            <Input />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="username"
            label={getText("username", "Username")}
            rules={[{ required: true, message: requiredMsg }]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={12}>
        <Col xs={24} md={12}>
          <Form.Item
            name="email"
            label={getText("email", "Email")}
            rules={[
              { required: true, message: requiredMsg },
              { type: "email", message: emailInvalidMsg },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="status"
            label={getText("status", "Status")}
            rules={[{ required: true, message: requiredMsg }]}
          >
            <Radio.Group>
              <Radio value="active">{getText("active", "Active")}</Radio>
              <Radio value="inactive">{getText("inactive", "Inactive")}</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
      </Row>
      <Divider style={{ margin: "8px 0 14px" }} />
      <Row gutter={12}>
        <Col xs={24} md={12}>
          <Form.Item
            name="phone"
            label={getText("phone", "Phone")}
            rules={[{ required: true, message: requiredMsg }]}
          >
            <Input placeholder="+90 5xx xxx xx xx" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="website"
            label={getText("website", "Website")}
            rules={[{ required: true, message: requiredMsg }]}
          >
            <Input placeholder="example.com" />
          </Form.Item>
        </Col>
      </Row>
      <Divider style={{ margin: "8px 0 14px" }} />
      <Form.Item
        name={["address", "street"]}
        label={getText("address", "Address")}
        rules={[{ required: true, message: requiredMsg }]}
      >
        <Input placeholder="Street, Apt, City, Zip (tek satır)" />
      </Form.Item>
      <Divider style={{ margin: "8px 0 14px" }} />
      <Form.Item
        name={["company", "name"]}
        label={getText("companyName", "Company Name")}
        rules={[{ required: true, message: requiredMsg }]}
      >
        <Input />
      </Form.Item>
    </>
  );
}
