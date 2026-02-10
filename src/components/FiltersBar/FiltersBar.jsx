import { Card, Input, DatePicker, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import "./FiltersBar.scss";

const { RangePicker } = DatePicker;
const INVALID_RANGE_KEY = "invalidRange";

export default function FiltersBar({
  filters,
  onChange,
  onReset,
  loading,
  actions,
}) {
  const { t } = useTranslation();

  const handleRangeChange = (v) => {
    if (!v || (!v?.[0] && !v?.[1])) {
      onChange({ range: v });
      return;
    }

    const start = v?.[0];
    const end = v?.[1];

    if (start && end && start.isAfter(end, "day")) {
      message.open({
        type: "error",
        content: t("UsersPage.filters.date.invalidRange"),
        key: INVALID_RANGE_KEY, 
        duration: 2,
      });
      return; 
    }

    onChange({ range: v });
  };

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
          order={false}
          value={filters.range}
          onChange={handleRangeChange}
          className="crud-filters__date"
          popupClassName="crud-date-dropdown"
          allowEmpty={[true, true]}
          disabled={loading}
          placeholder={[
            t("UsersPage.filters.date.start"),
            t("UsersPage.filters.date.end"),
          ]}
        />

        <div className="crud-filters__actions">{actions}</div>
      </div>
    </Card>
  );
}
