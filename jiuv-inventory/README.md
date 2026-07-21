# 九维精酿酒吧 · 云端进销存系统 (Jiuv Inventory)

手机优先的云端进销存系统，专为精酿酒吧设计。支持 iPhone/Android 浏览器和微信内打开，PWA 可添加到主屏。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + Vite + TailwindCSS + PWA |
| 后端 | Node.js + Express + Prisma ORM |
| 数据库 | PostgreSQL |
| 认证 | JWT（手机号 + 密码） |
| 部署 | 前端 Vercel / 后端 Render / 数据库 Supabase |

## 数据模型

沿用 Jumpwire (JBM) 的 Beer/Keg/Tap 三层分离设计：

- **Beer** — 啤酒 SKU，含 ABV/Plato/IBU 指标，双定价（500ml/350ml），金额整数分存储
- **Keg** — 批次库存，映射物理龙头（1-11 号位），以升为单位，低于 2L 触发预警
- **Tap** — 龙头状态，管理当前挂载的 Keg

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp server/.env.example server/.env
# 编辑 .env 填入数据库连接字符串

# 生成 Prisma Client + 数据库迁移
cd server && npx prisma db push && npx prisma generate && cd ..

# 生成种子数据
npm run db:seed

# 启动前后端开发服务器
npm run dev
```

前端运行在 `http://localhost:5173`，后端在 `http://localhost:3001`。

### 默认登录账号

- 手机号：`13800000001`
- 密码：`jiuv2024`

## 功能模块

### MVP 核心

- ✅ 商品管理（Beer SKU CRUD）
- ✅ 进货录入（供应商 + Keg 批次）
- ✅ 库存看板（Keg/Tap 状态 + 2L 预警）
- ✅ 销售点单（POS + 扣库存）
- ✅ 销售统计（日/周/月报表）

### 后续迭代

- 会员系统（普通/黑金分级、余额、消费统计）
- 供应链管理（采购订单、应付账款）
- 财务报表（日结、月报、利润分析）

## 部署

详见 [部署指南](./DEPLOY.md)。
