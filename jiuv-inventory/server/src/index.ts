import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured in production');
}

const app = express();

// 中间件
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// API 路由
app.use('/api', routes);

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: '接口不存在' });
});

// 错误处理
app.use((err: Error & { statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ 服务器错误:', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.statusCode ? err.message : '服务器内部错误',
  });
});

const PORT = parseInt(process.env.PORT || '3001', 10);

app.listen(PORT, () => {
  console.log(`\n🍺 九维进销存后端服务已启动`);
  console.log(`   地址: http://localhost:${PORT}`);
  console.log(`   健康检查: http://localhost:${PORT}/api/health\n`);
});

export default app;
