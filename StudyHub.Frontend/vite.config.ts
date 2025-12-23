import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    reportCompressedSize: false,
    minify: "esbuild",
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("xlsx")) return "vendor-xlsx";
            if (id.includes("@microsoft/signalr")) return "vendor-signalr";
            if (id.includes("lucide-react")) return "vendor-icons";
            return "vendor";
          }
        },
      },
      treeshake: true,
    },
  },
  optimizeDeps: {
    include: ['quill'],
  }
});
