import axios from "axios";
import { isAbortError } from "../utils/isAbortError";

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

const buildMessage = ({ hasResponse, status, code }) => {
  if (!hasResponse) {
    if (code === "ECONNABORTED") return "İstek zaman aşımına uğradı.";
    return "Bağlantı hatası. İnternetinizi veya sunucuyu kontrol edin.";
  }

  if (status === 400) return "Geçersiz istek (400).";
  if (status === 401) return "Yetkisiz istek (401). Giriş gerekli olabilir.";
  if (status === 403) return "Erişim yasak (403).";
  if (status === 404) return "Kaynak bulunamadı (404).";
  if (status >= 500) return "Sunucu hatası (5xx).";
  return "İstek sırasında hata oluştu.";
};

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
   
    if (isAbortError(error)) {
      const meta = error?.config?.meta ?? {};
      const toastOnCancel = meta.toastOnCancel === true;

      error.__silentToast = !toastOnCancel;
      error.__cancelToastMessage = meta.cancelMessage || "İşlem iptal edildi.";

      return Promise.reject(error);
    }

    const status = error?.response?.status;
    const details = error?.response?.data;
    const code = error?.code;

    const message = buildMessage({
      hasResponse: !!error?.response,
      status,
      code,
    });

    return Promise.reject(new ApiError({ message, status, details, code }));
  }
);

class requestJP {
  static get(url = "", params = {}, headers = {}, responseType = "", signal, meta) {
    return jpAxios.get(url, { params, headers, responseType, signal, meta });
  }

  static post(url = "", body = {}, params = {}, headers = {}, responseType = "json", signal, meta) {
    return jpAxios.post(url, body, { params, headers, responseType, signal, meta });
  }

  static patch(url = "", body = {}, params = {}, headers = {}, responseType = "json", signal, meta) {
    return jpAxios.patch(url, body, { params, headers, responseType, signal, meta });
  }

  static put(url = "", body = {}, params = {}, headers = {}, responseType = "json", signal, meta) {
    return jpAxios.put(url, body, { params, headers, responseType, signal, meta });
  }

  static delete(url = "", data = {}, headers = {}, signal, meta) {
    return jpAxios.delete(url, { data, headers, signal, meta });
  }
}

export default requestJP;
export { ApiError };
