import { usersService } from "../../api/jp/users.service";
import {loadUsers,saveUsers,loadPosts,savePosts,nextId,ensureUsersCreatedAt,} from "../jpDb";

const toNum = (v) => (typeof v === "number" ? v : Number(v));

export const usersRepo = {
  async bootstrap(options = {}) {
    const local = loadUsers();

    if (Array.isArray(local) && local.length) {
      const idNormalized = local.map((u) => ({ ...u, id: toNum(u?.id) }));
      const { normalized, changed } = ensureUsersCreatedAt(idNormalized);

      if (changed) saveUsers(normalized);
      else saveUsers(normalized);

      return normalized;
    }

    const apiUsers = await usersService.getUsers(options);

    const idNormalized = (apiUsers || []).map((u) => ({
      ...u,
      id: toNum(u?.id),
    }));

    const { normalized } = ensureUsersCreatedAt(idNormalized);

    saveUsers(normalized);
    return normalized;
  },

  async create(currentUsers, payload, options = {}) {
    try {
      await usersService.createUser(payload, options);
    } catch {
      
    }

    const newUser = {
      id: nextId(currentUsers),
      ...payload,
      createdAt: new Date().toISOString(),
    };

    const normalizedNewUser = { ...newUser, id: toNum(newUser.id) };

    const next = [normalizedNewUser, ...(Array.isArray(currentUsers) ? currentUsers : [])];
    saveUsers(next);
    return next;
  },

  async update(currentUsers, id, payload, options = {}) {
    const nid = toNum(id);

    try {
      await usersService.updateUser(nid, payload, options);
    } catch {
   
    }

    const next = (Array.isArray(currentUsers) ? currentUsers : []).map((u) => {
      if (toNum(u?.id) !== nid) return u;

      const createdAt = u?.createdAt;

      return {
        ...u,
        ...payload,
        id: nid,
        createdAt,
      };
    });

    saveUsers(next);
    return next;
  },

  async remove(currentUsers, id, options = {}) {
    const nid = toNum(id);

    try {
      await usersService.deleteUser(nid, options);
    } catch {
    
    }

    const nextUsers = (Array.isArray(currentUsers) ? currentUsers : []).filter(
      (u) => toNum(u?.id) !== nid
    );
    saveUsers(nextUsers);

    const allPosts = loadPosts() || [];
    const nextPosts = allPosts.filter((p) => toNum(p?.userId) !== nid);
    savePosts(nextPosts);

    return nextUsers;
  },
};
