import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { DataCacheProvider } from "./context/DataCacheContext.jsx";
import { I18nProvider } from "./i18n/I18nContext.jsx";
import "./styles/index.css";

const rawBase = import.meta.env.BASE_URL || "/";
const routerBasename = rawBase === "/" ? undefined : rawBase.replace(/\/$/, "");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <BrowserRouter basename={routerBasename}>
        <I18nProvider>
          <DataCacheProvider>
            <App />
          </DataCacheProvider>
        </I18nProvider>
      </BrowserRouter>
  </React.StrictMode>
);
