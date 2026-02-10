import axios from "axios";

export const isAbortError = (err) => {
  if (!err) return false;

  if (typeof axios?.isCancel === "function" && axios.isCancel(err)) return true;

  return (
    err?.code === "ERR_CANCELED" ||
    err?.name === "CanceledError" ||
    err?.name === "AbortError" ||
    err?.__CANCEL__ === true ||
    /canceled|cancelled/i.test(err?.message || "")
  );
};
