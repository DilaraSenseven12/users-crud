import requestJP from "./request.jp.js";
import * as paths from "./paths.jp.js";

const toNum = (v) => (typeof v === "number" ? v : Number(v));

export class todosService {
  static async getTodosByUserId(userId, options = {}) {
    const { signal, meta } = options;
    const uid = toNum(userId);

    const res = await requestJP.get(paths.todos, { userId: uid }, {}, "", signal, meta);
    return res.data;
  }

  static async createTodo(payload, options = {}) {
    const { signal, meta } = options;
    const res = await requestJP.post(paths.todos, payload, {}, {}, "json", signal, meta);
    return res.data;
  }

  static async updateTodo(id, payload, options = {}) {
    const { signal, meta } = options;
    const tid = toNum(id);

    const res = await requestJP.patch(`${paths.todos}/${tid}`, payload, {}, {}, "json", signal, meta);
    return res.data;
  }

  static async deleteTodo(id, options = {}) {
    const { signal, meta } = options;
    const tid = toNum(id);

    const res = await requestJP.delete(`${paths.todos}/${tid}`, {}, {}, signal, meta);
    return res.data;
  }
}
