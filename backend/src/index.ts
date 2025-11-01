import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { errorHandler, handleUncaughtException } from './middleware/errorHandler';
import { uploadRoutes } from './routes/upload';
import { analyzeRoutes } from './routes/analyze';
import errorRoutes from './routes/errors';
import { clearOldLogs } from './services/errorService';
import { 
  advancedHelmet,
  generalAPIRateLimit,
  checkBlockedIP,
  detectSuspiciousActivity,
  sanitizeInput,
  csrfProtection
} from './middleware/securityMiddleware';

// تحميل متغيرات البيئة
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// إعدادات الأمان المتقدمة
app.use(advancedHelmet);

// إعدادات CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ضغط الاستجابات
app.use(compression());

// middleware الأمان والحماية (مخفف في بيئة التطوير)
if (process.env.NODE_ENV === 'production') {
  app.use(checkBlockedIP);
  app.use(detectSuspiciousActivity);
}
app.use(sanitizeInput);
app.use(csrfProtection);

// تحديد معدل الطلبات المتقدم
app.use('/api/', generalAPIRateLimit);

// معالجة JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// تسجيل الطلبات في بيئة التطوير
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.url} - IP: ${req.ip} - Origin: ${req.get('Origin')}`);
    next();
  });
}

// معالج OPTIONS للـ preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// الطرق الأساسية
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'خادم كاشف المحتوى المعدل يعمل بشكل طبيعي',
    timestamp: new Date().toISOString(),
    developer: '@a7sa45',
    x: 'https://x.com/a7sa45',
    github: 'https://github.com/a7sa45',
    version: '1.0.0'
  });
});

// طرق رفع الملفات والتحليل
app.use('/api/upload', uploadRoutes);
app.use('/api/analyze', analyzeRoutes);

// طرق إدارة الأخطاء (للتطوير فقط)
app.use('/api/errors', errorRoutes);

// طرق إدارة الأمان (للتطوير فقط)
import securityRoutes from './routes/security';
app.use('/api/security', securityRoutes);

// طرق مراقبة الأداء (للتطوير فقط)
import performanceRoutes from './routes/performance';
app.use('/api/performance', performanceRoutes);

// معالج الأخطاء العام
app.use(errorHandler);

// معالج الطرق غير الموجودة
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'الطريق المطلوب غير موجود',
    code: 'NOT_FOUND'
  });
});

// إعداد معالجة الأخطاء غير المتوقعة
handleUncaughtException();

// تنظيف السجلات القديمة عند بدء التشغيل
clearOldLogs(30).catch(console.error);

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
  console.log(`🌐 الصحة: http://localhost:${PORT}/api/health`);
  console.log(`📁 رفع الملفات: http://localhost:${PORT}/api/upload`);
  console.log(`🔍 التحليل: http://localhost:${PORT}/api/analyze`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🐛 سجل الأخطاء: http://localhost:${PORT}/api/errors/recent`);
    console.log(`📊 مراقبة الأداء: http://localhost:${PORT}/api/performance/overview`);
    console.log(`💾 إحصائيات التخزين المؤقت: http://localhost:${PORT}/api/performance/cache-stats`);
  }
});

export default app;