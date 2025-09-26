import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          changeOrigin: true,
          target: env.VITE_PROXY_TARGET || "http://localhost:3333",
        },
      },
    },
  };
});
