import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/cinzel/latin-400.css";
import "@fontsource/cinzel/latin-500.css";
import "@fontsource/cinzel/latin-600.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-400-italic.css";
import "./style.css";
import "./mobile.css";
import "./expansion.css";
import "./polish.css";
import "./journey.css";
import "./folio.css";
import "./mystery.css";
import "./ads.css";
import App from "./App";
import { restoreNativeStorage } from "./native";
import { purchases } from "./purchases";

void Promise.allSettled([restoreNativeStorage(), purchases.hydrate()])
  .catch(() => {})
  .finally(() => {
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  });
