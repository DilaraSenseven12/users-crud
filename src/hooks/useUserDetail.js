import { useEffect, useMemo, useRef, useState } from "react";
import { usersService } from "../api/jp/users.service";
import { loadUsers } from "../storage/jpDb";

const makeErrorKey = (type, userId, raw) => {
  const code = raw?.code || raw?.name || "";
  const msg = raw?.message || "";
  return `${type}:${userId}:${code}:${msg}`;
};

export function useUserDetail(userId, options = {}) {
  const { enabled = true } = options;
  const isValidId = useMemo(() => Number.isFinite(userId) && userId > 0, [userId]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastReqRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    if (!isValidId) {
      setUser(null);
      setLoading(false);
      setError({
        type: "INVALID_ID",
        key: makeErrorKey("INVALID_ID", userId, null),
        raw: null,
      });
      return;
    }

    const reqId = ++lastReqRef.current;
    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
   
        const localUsers = loadUsers();
        const found = localUsers?.find((u) => Number(u?.id) === Number(userId));

        if (found) {
          if (controller.signal.aborted || reqId !== lastReqRef.current) return;
          setUser(found);
          return;
        }

    
        const u = await usersService.getUserById(userId, { signal: controller.signal });

        if (controller.signal.aborted || reqId !== lastReqRef.current) return;
        setUser(u ?? null);
      } catch (err) {
        if (err?.code === "ERR_CANCELED") return;
        if (controller.signal.aborted || reqId !== lastReqRef.current) return;

        setUser(null);
        setError({
          type: "FETCH_FAILED",
          key: makeErrorKey("FETCH_FAILED", userId, err),
          raw: err,
        });
      } finally {
        if (controller.signal.aborted || reqId !== lastReqRef.current) return;
        setLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [userId, isValidId, enabled]);

  return { user, loading, error, isValidId };
}
