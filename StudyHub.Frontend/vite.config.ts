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
        // 4. Gom nhóm các thư viện lại để Rollup không phải xử lý quá nhiều file nhỏ
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
      // 5. Tăng tốc độ bằng cách bỏ qua một số kiểm tra không cần thiết
      treeshake: true,
    },
  },
});
