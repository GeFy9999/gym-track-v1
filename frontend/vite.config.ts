import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          // Left alone, every icon becomes its own tiny file, each one a
          // separate request on the way to showing a page. One shared file
          // for all of them instead (they're a few hundred bytes each).
          groups: [{ name: "icons", test: /node_modules[\\/]lucide-react/ }],
        },
      },
    },
  },
  server: {
    host: true,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
