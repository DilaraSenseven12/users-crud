import { usersService } from "../../api/jp/users.service";
import { loadUsers, saveUsers, loadPosts, savePosts, nextId } from "../jpDb";

const toNum = (v) => (typeof v === "number" ? v : Number(v));

export const usersRepo = {
  async bootstrap(options = {}) {
    const local = loadUsers();
    if (local?.length) return local;

    const apiUsers = await usersService.getUsers(options);

    const normalized = (apiUsers || []).map((u) => ({
      ...u,
      id: toNum(u.id),
    }));

    saveUsers(normalized);
    return normalized;
  },

  async create(currentUsers, payload, options = {}) {
    try {
      await usersService.createUser(payload, options);
    } catch {
    }

    const newUser = { id: nextId(currentUsers), ...payload };

    const normalizedNewUser = { ...newUser, id: toNum(newUser.id) };

    const next = [normalizedNewUser, ...currentUsers];
    saveUsers(next);
    return next;
  },

  async update(currentUsers, id, payload, options = {}) {
    const nid = toNum(id);

    try {
      await usersService.updateUser(nid, payload, options);
    } catch {
      
    }

    const next = currentUsers.map((u) =>
      toNum(u.id) === nid ? { ...u, ...payload, id: nid } : u
    );

    saveUsers(next);
    return next;
  },

  async remove(currentUsers, id, options = {}) {
    const nid = toNum(id);

    try {
      await usersService.deleteUser(nid, options);
    } catch {
    
    }

    const nextUsers = currentUsers.filter((u) => toNum(u.id) !== nid);
    saveUsers(nextUsers);

    const allPosts = loadPosts() || [];
    const nextPosts = allPosts.filter((p) => toNum(p.userId) !== nid);
    savePosts(nextPosts);

    return nextUsers;
  },
};
