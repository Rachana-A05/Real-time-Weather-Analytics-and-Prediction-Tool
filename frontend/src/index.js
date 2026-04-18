import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@fontsource/roboto";
import { CssBaseline } from "@mui/material";
import "./index.css";
import { ThemeProvider } from "./hooks/useTheme"; // <-- Make sure correct path!

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
