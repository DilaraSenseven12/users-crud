import React from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import FiltersBar from "../../../../components/FiltersBar/FiltersBar";

export default function UsersToolbar({ t, filters, onChange, onReset, loading, onNewUser }) {
  return (
    <div className="users-page__filters">
      <FiltersBar
        filters={filters}
        onChange={onChange}
        onReset={onReset}
        loading={loading}
        actions={
          <Button type="primary" className="btn-blue" icon={<PlusOutlined />} onClick={onNewUser} disabled={loading}>
            {t("UsersPage.actions.newUser", { defaultValue: "New User" })}
          </Button>
        }
      />
    </div>
  );
}
