import requestJP from "./request.jp.js";
import * as paths from "./paths.jp.js";

const toNum = (v) => (typeof v === "number" ? v : Number(v));

export class postsService {
  static async getPostsByUserId(userId, options = {}) {
    const { signal, meta } = options;
    const uid = toNum(userId);

    const res = await requestJP.get(paths.posts, { userId: uid }, {}, "", signal, meta);
    return res.data;
  }

  static async createPost(payload, options = {}) {
    const { signal, meta } = options;
    const res = await requestJP.post(paths.posts, payload, {}, {}, "json", signal, meta);
    return res.data;
  }

  static async updatePost(id, payload, options = {}) {
    const { signal, meta } = options;
    const pid = toNum(id);

    const res = await requestJP.patch(`${paths.posts}/${pid}`, payload, {}, {}, "json", signal, meta);
    return res.data;
  }

  static async deletePost(id, options = {}) {
    const { signal, meta } = options;
    const pid = toNum(id);

    // requestJP.delete(url, data={}, headers={}, signal, meta)
    const res = await requestJP.delete(`${paths.posts}/${pid}`, {}, {}, signal, meta);
    return res.data;
  }
}
