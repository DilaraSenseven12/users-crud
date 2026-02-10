import toast from "react-hot-toast";
import { isAbortError } from "../api/utils/isAbortError";
import i18n from "../i18n/i18n";


const normalize = (msg) => (typeof msg === "string" ? msg.trim() : "");

const t = (key, def, options) => {
  const v = normalize(i18n?.t?.(key, { defaultValue: def, ...options }));
  return v || def;
};

export const getErrorMessage = (err, fallback = t("Common.errors.generic", "Bir hata oluştu")) => {

  const backendKey = err?.response?.data?.i18nKey || err?.response?.data?.key;
  if (backendKey) {
    const translated = normalize(i18n.t(backendKey, { defaultValue: fallback }));
    if (translated) return translated;
  }

  const msg =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback;

  return normalize(msg) || fallback;
};

export const createToastChannel = (scope = "global", opts = {}) => {
  const id = `toast:${scope}`;
  const duration = opts.duration ?? 2500;

  return {
    id,
    success: (content) => toast.success(content, { id, duration }),
    error: (content) => toast.error(content, { id, duration }),
    warning: (content) => toast(content, { id, duration, icon: "⚠️" }),
    info: (content) => toast(content, { id, duration }),
    loading: (content) => toast.loading(content, { id }),
    dismiss: () => toast.dismiss(id),

    apiError: (err, fallback) => {
      if (isAbortError(err)) {
        if (err?.__silentToast !== false) return;

        toast(err?.__cancelToastMessage || t("Common.errors.canceled", "İşlem iptal edildi."), {
          id,
          duration,
          icon: "⏹️",
        });
        return;
      }

      toast.error(getErrorMessage(err, fallback || t("Common.errors.generic", "Bir hata oluştu")), {
        id,
        duration,
      });
    },

    formFirstError: (e, fallback = t("Common.errors.formRequired", "Lütfen zorunlu alanları doldurun")) => {
      const first = e?.errorFields?.[0]?.errors?.[0];
      return toast.error(first || fallback, { id, duration });
    },
  };
};
