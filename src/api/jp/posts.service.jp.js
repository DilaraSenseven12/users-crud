import requestJP, { ApiError } from "./request.jp";
import * as paths from "./paths.jp";

class postsService {
  
  static getPostsByUserId = async (userId, options = {}) => {
    try {
      const res = await requestJP.get(
        paths.posts,
        { userId },
        {},
        "",
        options.signal
      );
      return res.data;
    } catch (err) {
      
      if (err instanceof ApiError && err.code === "ERR_CANCELED") throw err;

      throw err; 
    }
  };

  static createPost = async (payload, options = {}) => {
    try {
      const res = await requestJP.post(paths.posts, payload, {}, {}, "json", options.signal);
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  static updatePost = async (id, payload, options = {}) => {
    try {
      const res = await requestJP.patch(
        `${paths.posts}/${id}`,
        payload,
        {},
        {},
        "json",
        options.signal
      );
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  static deletePost = async (id, options = {}) => {
    try {
      const res = await requestJP.delete(`${paths.posts}/${id}`, {}, {}, options.signal);
      return res.data;
    } catch (err) {
      throw err;
    }
  };
}

export { postsService };
