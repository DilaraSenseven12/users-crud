import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import App from "./App.jsx";
import "antd/dist/reset.css";
import "./i18n/i18n";
import "./tailwind.css";
import "./assets/styles/global.scss";

import { initTheme } from "./theme/theme";
initTheme();

const TOASTER_OPTIONS = {
  className: "app-toast",
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-right" toastOptions={TOASTER_OPTIONS} />
    </BrowserRouter>
  </React.StrictMode>
);
