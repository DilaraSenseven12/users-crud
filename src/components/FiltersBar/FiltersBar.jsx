import { Card, Input, DatePicker } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import "./FiltersBar.scss";

const { RangePicker } = DatePicker;

export default function FiltersBar({
  filters,
  onChange,
  onReset,
  loading,
  actions, 
}) {
  const { t } = useTranslation();

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
        <div className="crud-filters__right">
          {actions}
        </div>
      </div>
    </Card>
  );
}
