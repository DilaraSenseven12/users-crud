import requestJP, { ApiError } from "./request.jp.js";
import * as paths from "./paths.jp.js";

export class usersService {
  static getUsers = async (options = {}) => {
    try {
      const res = await requestJP.get(paths.users, {}, {}, "", options.signal);
      return res.data;
    } catch (err) {
      if (err instanceof ApiError && err.code === "ERR_CANCELED") throw err;
      throw err;
    }
  };

  static getUserById = async (id, options = {}) => {
    try {
      const res = await requestJP.get(`${paths.users}/${id}`, {}, {}, "", options.signal);
      return res.data;
    } catch (err) {
      if (err instanceof ApiError && err.code === "ERR_CANCELED") throw err;
      throw err;
    }
  };

  static createUser = async (payload, options = {}) => {
    try {
      const res = await requestJP.post(paths.users, payload, {}, {}, "json", options.signal);
      return res.data;
    } catch (err) {
      if (err instanceof ApiError && err.code === "ERR_CANCELED") throw err;
      throw err;
    }
  };

  static updateUser = async (id, payload, options = {}) => {
    try {
      const res = await requestJP.patch(`${paths.users}/${id}`, payload, {}, {}, "json", options.signal);
      return res.data;
    } catch (err) {
      if (err instanceof ApiError && err.code === "ERR_CANCELED") throw err;
      throw err;
    }
  };

  static deleteUser = async (id, options = {}) => {
    try {
      const res = await requestJP.delete(`${paths.users}/${id}`, {}, {}, options.signal);
      return res.data;
    } catch (err) {
      if (err instanceof ApiError && err.code === "ERR_CANCELED") throw err;
      throw err;
    }
  };
}
