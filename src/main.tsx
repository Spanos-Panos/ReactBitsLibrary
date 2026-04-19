import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./shared/types/api"; // loads window.reactBitsApi global declaration
import "./styles/tokens.css";
import "./styles/globals.css";
import "./styles/layout.css";
import "./styles/sidebar.css";
import "./styles/inspector.css";
import "./styles/wizard.css";
import "./styles/taskbar.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

