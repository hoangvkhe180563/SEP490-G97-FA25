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
    // 1. Tắt Sourcemap (Cực kỳ quan trọng, giảm 50% tải RAM/CPU)
    sourcemap: false,

    // 2. Tắt báo cáo kích thước file (giảm tính toán)
    reportCompressedSize: false,

    // 3. Sử dụng esbuild thay vì terser (esbuild nhanh hơn gấp nhiều lần)
    minify: "esbuild",

    rollupOptions: {
      output: {
        // 3. Tối ưu chia nhỏ chunk
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("xlsx")) return "vendor-xlsx";
            if (id.includes("@microsoft/signalr")) return "vendor-signalr";
            if (id.includes("lucide-react")) return "vendor-icons";
            return "vendor";
          }
        },
      },
      // 4. Tăng tốc độ bằng cách bỏ qua một số kiểm tra không cần thiết
      treeshake: true,
    },
  },
});
