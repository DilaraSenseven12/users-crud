import axios from "axios";

class ApiError extends Error {
  constructor({ message, status, details, code }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

const jpAxios = axios.create({
  baseURL: "https://jsonplaceholder.typicode.com",
  timeout: 30000,
});

jpAxios.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {};

    if (!config.headers.Accept) config.headers.Accept = "application/json";

    const token = localStorage.getItem("token");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

jpAxios.interceptors.response.use(
  (response) => response,
  (error) => {
  
    if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
      return Promise.reject(
        new ApiError({
          message: "Istek iptal edildi.",
          status: undefined,
          details: undefined,
          code: "ERR_CANCELED",
        })
      );
    }

    const status = error?.response?.status;
    const details = error?.response?.data;
    const code = error?.code;

    let message = "Bir hata olustu.";

    if (!error?.response) {
      if (code === "ECONNABORTED") message = "Istek zaman asimina ugradi.";
      else message = "Baglanti hatasi. Internetinizi veya sunucuyu kontrol edin.";
    } else {
      if (status === 400) message = "Gecersiz istek (400).";
      else if (status === 401) message = "Yetkisiz istek (401). Giris gerekli olabilir.";
      else if (status === 403) message = "Erisim yasak (403).";
      else if (status === 404) message = "Kaynak bulunamadi (404).";
      else if (status >= 500) message = "Sunucu hatasi (5xx).";
      else message = "Istek sirasinda hata olustu.";
    }

    return Promise.reject(
      new ApiError({
        message,
        status,
        details,
        code,
      })
    );
  }
);

class requestJP {

  static get(url = "", params = {}, headers = {}, responseType = "", signal) {
    return jpAxios.get(url, { params, headers, responseType, signal });
  }

  static post(
    url = "",
    body = {},
    params = {},
    headers = {},
    responseType = "json",
    signal
  ) {
    return jpAxios.post(url, body, { params, headers, responseType, signal });
  }

  static patch(
    url = "",
    body = {},
    params = {},
    headers = {},
    responseType = "json",
    signal
  ) {
    return jpAxios.patch(url, body, { params, headers, responseType, signal });
  }

  static put(
    url = "",
    body = {},
    params = {},
    headers = {},
    responseType = "json",
    signal
  ) {
    return jpAxios.put(url, body, { params, headers, responseType, signal });
  }

  static delete(url = "", data = {}, headers = {}, signal) {
    return jpAxios.delete(url, { data, headers, signal });
  }
}

export default requestJP;
export { ApiError };
