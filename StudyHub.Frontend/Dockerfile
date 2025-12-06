# Sử dụng Node version 22 như yêu cầu trong engines
FROM node:22-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy file package để cài dependency trước (tận dụng Docker cache)
COPY package.json package-lock.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ code vào
COPY . .

# Mở port mặc định của Vite
EXPOSE 5173

# Chạy lệnh dev với cờ --host để truy cập được từ bên ngoài container
CMD ["npm", "run", "dev", "--", "--host"]