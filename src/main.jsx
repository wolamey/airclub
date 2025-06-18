import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App/App";
import {HashRouter} from "react-router-dom";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter  basename="/airclub" >
      <App />
    </BrowserRouter>
  </StrictMode>
);