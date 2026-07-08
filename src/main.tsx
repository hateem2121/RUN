import React from "react";
import { createRoot } from "react-dom/client";
import { Home } from "./pages/Home";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <Home />
    </React.StrictMode>,
  );
}
