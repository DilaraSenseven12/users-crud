import { useEffect, useMemo } from "react";

const norm = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");

const toTs = (v) => {
  if (!v) return null;

  if (typeof v === "object" && typeof v.valueOf === "function") {
    const n = Number(v.valueOf());
    return Number.isFinite(n) ? n : null;
  }

  if (v instanceof Date) {
    const n = v.getTime();
    return Number.isFinite(n) ? n : null;
  }

  if (typeof v === "number") return Number.isFinite(v) ? v : null;

  const p = Date.parse(v);
  return Number.isFinite(p) ? p : null;
};

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

const buildStats = (list) => {
  const total = Array.isArray(list) ? list.length : 0;
  let active = 0;
  let inactive = 0;

  for (const u of list || []) {
    const s = (u?.status ?? "active").toString();
    if (s === "inactive") inactive += 1;
    else active += 1;
  }

  return { total, active, inactive };
};

export function useUsersDerived({
  users = [],
  filters = { q: "", status: "all", range: null }, 
  page = 1,
  setPage,
  pageSize = 8,
} = {}) {
  const stats = useMemo(() => buildStats(users), [users]);

  const filteredUsers = useMemo(() => {
    const q = norm(filters?.q);
    const status = filters?.status ?? "all";
    const range = filters?.range;

    const [startRaw, endRaw] = Array.isArray(range) ? range : [];
    const startTs = toTs(startRaw);
    const endTs = toTs(endRaw);

    return (users || []).filter((u) => {
   
      const st = (u?.status ?? "active").toString();
      if (status !== "all" && st !== status) return false;

      if (q) {
        const hay = [
          u?.name,
          u?.username ? `@${u.username}` : "",
          u?.email,
          u?.id != null ? String(u.id) : "",
        ]
          .filter(Boolean)
          .map((x) => String(x).toLowerCase());

        const ok = hay.some((x) => x.includes(q));
        if (!ok) return false;
      }

      if (startTs != null || endTs != null) {
        const createdTs = toTs(u?.createdAt) ?? 0;
        if (startTs != null && createdTs < startTs) return false;
        if (endTs != null && createdTs > endTs) return false;
      }

      return true;
    });
  }, [users, filters]);

  const total = filteredUsers.length;
  const maxPage = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const pageClamped = clamp(Number(page) || 1, 1, maxPage);

  useEffect(() => {
    if (typeof setPage === "function" && pageClamped !== (Number(page) || 1)) {
      setPage(pageClamped);
    }
  }, [pageClamped, page, setPage]);

  const pagedUsers = useMemo(() => {
    const ps = Math.max(1, Number(pageSize) || 1);
    const start = (pageClamped - 1) * ps;
    return filteredUsers.slice(start, start + ps);
  }, [filteredUsers, pageClamped, pageSize]);

  return { filteredUsers, pagedUsers, stats };
}
