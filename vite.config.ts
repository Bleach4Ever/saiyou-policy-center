import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/data-api": {
        target: "https://data-api.saiyoujiaoyu.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/data-api/, ""),
      },
    },
  },
});
