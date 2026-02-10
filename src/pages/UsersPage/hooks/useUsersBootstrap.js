import { useCallback, useEffect, useRef, useState } from "react";
import { usersRepo } from "../../../storage/repo/users.repo";
import { saveUsers, ensureUsersCreatedAt, ensureUsersStatus } from "../../../storage/jpDb";
import { isAbortError } from "../../../api/utils/isAbortError"; 

export function useUsersBootstrap({ enabled = true, onError } = {}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const lastReqRef = useRef(0);
  const controllerRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    controllerRef.current?.abort?.();

    const reqId = ++lastReqRef.current;
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);

    try {
      const data = await usersRepo.bootstrap({ signal: controller.signal });

      const r1 = ensureUsersCreatedAt(data);
      const r2 = ensureUsersStatus(r1.normalized);

      if (r1.changed || r2.changed) saveUsers(r2.normalized);

      if (controller.signal.aborted || reqId !== lastReqRef.current) return;
      setUsers(r2.normalized);
    } catch (err) {
          if (isAbortError(err)) return;

      if (controller.signal.aborted || reqId !== lastReqRef.current) return;
      onError?.(err);
    } finally {
      if (controller.signal.aborted || reqId !== lastReqRef.current) return;
      setLoading(false);
    }
  }, [enabled, onError]);

  useEffect(() => {
    refresh();
    return () => controllerRef.current?.abort?.();
  }, [refresh]);

  return { users, setUsers, loading, refresh };
}
