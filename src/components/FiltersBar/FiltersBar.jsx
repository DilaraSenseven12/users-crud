import { Card, Input, Select, DatePicker, Button, Space } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import "./FiltersBar.scss";

const { RangePicker } = DatePicker;

export default function FiltersBar({ filters, onChange, onReset, loading }) {
    const { t } = useTranslation();

    const statusOptions = [
        { value: "all", label: t("UsersPage.filters.status.all") },
        { value: "active", label: t("UsersPage.filters.status.active") },
        { value: "inactive", label: t("UsersPage.filters.status.inactive") },
    ];

    return (
        <Card className="crud-filters" size="small">
            <div className="crud-filters__row">
                <Input
                    allowClear
                    value={filters.q}
                    onChange={(e) => onChange({ q: e.target.value })}
                    placeholder={t("UsersPage.filters.searchPlaceholder")}
                    prefix={<SearchOutlined />}
                    className="crud-filters__search"
                    disabled={loading}
                />

                <Select
                    value={filters.status ?? "all"}
                    onChange={(v) => onChange({ status: v })}
                    className="crud-filters__select"
                    disabled={loading}
                    options={statusOptions}
                    placeholder={t("UsersPage.filters.statusPlaceholder")}
                />

                <RangePicker
                    value={filters.range}
                    onChange={(v) => onChange({ range: v })}
                    className="crud-filters__date"
                    allowEmpty={[true, true]}
                    disabled={loading}
                    placeholder={[
                        t("UsersPage.filters.date.start"),
                        t("UsersPage.filters.date.end"),
                    ]}
                />
                <Space className="crud-filters__actions">
                    <Button
                        className="btn-blue"
                        icon={<ReloadOutlined />}
                        onClick={onReset}
                        disabled={loading}
                    >
                        {t("UsersPage.filters.reset")}
                    </Button>
                </Space>
            </div>
        </Card>
    );
}
