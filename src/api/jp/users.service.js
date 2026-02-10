
import requestJP from "./request.jp.js";
import * as paths from "./paths.jp.js";

const toNum = (v) => (typeof v === "number" ? v : Number(v));

export class usersService {
  static async getUsers(options = {}) {
    const { signal, meta } = options;
    const res = await requestJP.get(paths.users, {}, {}, "", signal, meta);
    return res.data;
  }

  static async getUserById(id, options = {}) {
    const { signal, meta } = options;
    const nid = toNum(id);
    const res = await requestJP.get(`${paths.users}/${nid}`, {}, {}, "", signal, meta);
    return res.data;
  }

  static async createUser(payload, options = {}) {
    const { signal, meta } = options;
    const res = await requestJP.post(paths.users, payload, {}, {}, "json", signal, meta);
    return res.data;
  }

  static async updateUser(id, payload, options = {}) {
    const { signal, meta } = options;
    const nid = toNum(id);
    const res = await requestJP.patch(`${paths.users}/${nid}`, payload, {}, {}, "json", signal, meta);
    return res.data;
  }

  static async deleteUser(id, options = {}) {
    const { signal, meta } = options;
    const nid = toNum(id);

    const res = await requestJP.delete(`${paths.users}/${nid}`, {}, {}, signal, meta);
    return res.data;
  }
}
