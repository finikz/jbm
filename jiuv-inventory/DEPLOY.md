# 九维进销存 · 部署指南

## 本地开发

```bash
# 1. 安装依赖
cd jiuv-inventory && npm install

# 2. 启动 PostgreSQL
docker compose up -d db

# 3. 推送数据库迁移 + 种子数据
cd server
cp .env.example .env  # 编辑 DATABASE_URL
npx prisma db push
npx tsx src/seed.ts

# 4. 启动前后端开发服务器
npm run dev
```

- 前端：http://localhost:5173
- 后端：http://localhost:3001
- 登录：`13800000001` / `jiuv2024`

## 生产部署

### 方案一：Docker Compose（推荐入门）

```bash
docker compose up -d
```

访问 http://localhost:8080

### 方案二：云托管

#### 数据库 — Supabase（免费层）

1. 注册 https://supabase.com
2. 创建项目，获取 Connection String
3. 填入 server/.env 的 DATABASE_URL

#### 后端 — Render（免费层）

1. 注册 https://render.com
2. 创建 Web Service，连接 GitHub 仓库
3. Build Command: `cd server && npm install && npx prisma db push && npm run build`
4. Start Command: `cd server && node dist/index.js`
5. 环境变量：DATABASE_URL, JWT_SECRET, CLIENT_URL

#### 前端 — Vercel（免费层）

1. 注册 https://vercel.com
2. 导入 GitHub 仓库，Root Directory 设为 `client`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. 环境变量：VITE_API_URL（后端地址）

## 注意事项

- 生产环境务必修改 JWT_SECRET
- DATABASE_URL 使用 SSL 连接（Supabase 默认提供）
- PWA manifest 已配置，手机浏览器可"添加到主屏"
