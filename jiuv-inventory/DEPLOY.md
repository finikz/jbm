# 九维进销存 · Zeabur 部署教程

> Zeabur：前后端 + 数据库一站式部署，国内可访问，免费层够用

## 整体架构

```
你的手机浏览器
    ↓
Zeabur（前端 + 后端 + PostgreSQL，一站式）
```

---

## 第一步：注册 Zeabur

1. 打开 https://zeabur.com → **Login**
2. 用 GitHub 登录（就是刚推送代码的账号）
3. 授权完成

---

## 第二步：创建项目

1. 进入控制台 → **New Project**
2. 项目名填 `jiuv-inventory`
3. 选择区域：**Asia East (Tokyo)** 或默认即可

---

## 第三步：部署数据库

1. 在项目内 → **Add Service** → **Marketplace**
2. 搜索 **PostgreSQL** → 点击添加
3. 等待启动（约 10 秒）
4. 点击 PostgreSQL 服务 → **Connections** 标签
5. 复制 **Connection URL**（格式类似 `postgresql://root:xxx@xxx/postgres`）

---

## 第四步：部署后端

1. **Add Service** → **Git Repository**
2. 选择 `finikz/jiuv-inventory` 仓库
3. 配置：
   - **Root Directory**: `server`
   - Zeabur 会自动检测 Node.js + package.json
4. 环境变量（Variables 标签）：

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | 第三步复制的 PostgreSQL Connection URL |
   | `JWT_SECRET` | `jiuv-secret-2024-abc` |
   | `PORT` | `3001` |
   | `CLIENT_URL` | 先填 `https://jiuv-client.zeabur.app`（第五步后改） |

5. **Build Command**（Settings）：
   ```
   cd ../shared && npm install && npm run build && cd ../server && npm install && npx prisma db push && npm run build
   ```
6. **Start Command**：
   ```
   node dist/index.js
   ```
7. 部署完成后，在 **Networking** 标签：
   - 开启公网访问
   - 记录分配的域名，如 `https://jiuv-server-xxx.zeabur.app`

8. **初始化种子数据**：
   - 后端服务的 **Shell** 或 **Console** 中运行：
     ```
     npx tsx src/seed.ts
     ```
   - 看到 `🎉 种子数据生成完成` 即成功

---

## 第五步：部署前端

1. **Add Service** → **Git Repository** → 选择同一个仓库
2. 配置：
   - **Root Directory**: `client`
3. 环境变量：

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://jiuv-server-xxx.zeabur.app/api`（换成第四步的后端地址） |

4. **Build Command**：
   ```
   cd ../shared && npm install && npm run build && cd ../client && npm install && npm run build
   ```
5. **Output Directory**: `dist`
6. 部署完成 → **Networking** 开启公网访问
7. 记录前端域名，如 `https://jiuv-client-xxx.zeabur.app`

---

## 第六步：更新后端 CORS

1. 回到后端服务 → Variables
2. 把 `CLIENT_URL` 改成第五步的前端域名
3. 保存 → 自动重新部署

---

## 第七步：手机访问 🎉

在手机浏览器或微信内打开前端域名：

> **https://jiuv-client-xxx.zeabur.app**

登录信息：
- 手机号：`13800000001`
- 密码：`jiuv2024`

**添加到主屏**（变成 App）：
- iPhone：Safari → 分享 → 添加到主屏幕
- Android：Chrome → 菜单 → 添加到主屏

---

## 故障排查

| 问题 | 检查 |
|---|---|
| 登录页空白 | 检查 VITE_API_URL 是否正确，末尾需 /api |
| 登录后 401 | 检查 JWT_SECRET 前后端是否一致 |
| 数据为空 | 在后端 Shell 运行 `npx tsx src/seed.ts` |
| CORS 报错 | 检查 CLIENT_URL 是否匹配前端域名 |

---

## 费用说明

Zeabur 免费层：
- 每月 $5 额度（约 750 小时运行时间）
- PostgreSQL + 前后端三个服务够用
- 超出后按量计费，酒吧小规模使用月成本 < $1
