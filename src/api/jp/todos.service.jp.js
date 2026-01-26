import requestJP, { ApiError } from "./request.jp.js";
import * as paths from "./paths.jp.js";

class todosService {
  static getTodosByUserId = async (userId, options = {}) => {
    try {
      const res = await requestJP.get(paths.todos, { userId }, {}, "", options.signal);
      return res.data;
    } catch (err) {
      if (err instanceof ApiError && err.code === "ERR_CANCELED") throw err;
      throw err;
    }
  };

  static createTodo = async (payload, options = {}) => {
    try {
      const res = await requestJP.post(paths.todos, payload, {}, {}, "json", options.signal);
      return res.data;
    } catch (err) {
      if (err instanceof ApiError && err.code === "ERR_CANCELED") throw err;
      throw err;
    }
  };

  static updateTodo = async (id, payload, options = {}) => {
    try {
      const res = await requestJP.patch(`${paths.todos}/${id}`, payload, {}, {}, "json", options.signal);
      return res.data;
    } catch (err) {
      if (err instanceof ApiError && err.code === "ERR_CANCELED") throw err;
      throw err;
    }
  };

  static deleteTodo = async (id, options = {}) => {
    try {
      const res = await requestJP.delete(`${paths.todos}/${id}`, {}, {}, options.signal);
      return res.data;
    } catch (err) {
      if (err instanceof ApiError && err.code === "ERR_CANCELED") throw err;
      throw err;
    }
  };
}

export { todosService };
