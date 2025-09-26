import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./pages/App";

const theme = createTheme({
  palette: {
    background: { default: "rgba(245, 246, 248, 1)" },
    primary: { main: "rgba(25, 118, 210, 1)" },
    secondary: { main: "rgba(126, 87, 194, 1)" },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
);
