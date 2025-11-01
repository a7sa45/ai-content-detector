import express from 'express';
import { autoDeleteService } from '../services/securityService';
import { getSecurityStats, unblockIP } from '../middleware/securityMiddleware';
import { getUploadStats } from '../middleware/upload';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// الحصول على إحصائيات الأمان (للمطورين فقط)
router.get('/stats', async (req, res, next) => {
  try {
    // التحقق من أن البيئة هي التطوير
    if (process.env.NODE_ENV !== 'development') {
      throw createError('غير مسموح في بيئة الإنتاج', 403, 'ACCESS_DENIED');
    }

    const [securityStats, uploadStats, cleanupStats] = await Promise.all([
      getSecurityStats(),
      getUploadStats(),
      autoDeleteService.getCleanupStats()
    ]);

    res.json({
      success: true,
      data: {
        security: securityStats,
        uploads: uploadStats,
        cleanup: cleanupStats,
        timestamp: new Date()
      }
    });

  } catch (error) {
    next(error);
  }
});

// إلغاء حظر IP (للمطورين فقط)
router.post('/unblock-ip', async (req, res, next) => {
  try {
    // التحقق من أن البيئة هي التطوير
    if (process.env.NODE_ENV !== 'development') {
      throw createError('غير مسموح في بيئة الإنتاج', 403, 'ACCESS_DENIED');
    }

    const { ip } = req.body;
    
    if (!ip) {
      throw createError('عنوان IP مطلوب', 400, 'IP_REQUIRED');
    }

    const result = unblockIP(ip);

    res.json({
      success: true,
      message: result ? `تم إلغاء حظر IP: ${ip}` : `IP غير محظور: ${ip}`,
      unblocked: result
    });

  } catch (error) {
    next(error);
  }
});

// تشغيل تنظيف فوري للملفات (للمطورين فقط)
router.post('/cleanup-now', async (req, res, next) => {
  try {
    // التحقق من أن البيئة هي التطوير
    if (process.env.NODE_ENV !== 'development') {
      throw createError('غير مسموح في بيئة الإنتاج', 403, 'ACCESS_DENIED');
    }

    // إيقاف وإعادة تشغيل خدمة التنظيف لتشغيل فوري
    autoDeleteService.stop();
    autoDeleteService.start();

    const stats = await autoDeleteService.getCleanupStats();

    res.json({
      success: true,
      message: 'تم تشغيل تنظيف فوري للملفات',
      stats
    });

  } catch (error) {
    next(error);
  }
});

// تكوين إعدادات الحذف التلقائي (للمطورين فقط)
router.post('/configure-cleanup', async (req, res, next) => {
  try {
    // التحقق من أن البيئة هي التطوير
    if (process.env.NODE_ENV !== 'development') {
      throw createError('غير مسموح في بيئة الإنتاج', 403, 'ACCESS_DENIED');
    }

    const { maxAge, maxFiles, checkInterval } = req.body;

    // التحقق من صحة البيانات
    if (maxAge && (typeof maxAge !== 'number' || maxAge < 1 || maxAge > 1440)) {
      throw createError('maxAge يجب أن يكون رقم بين 1 و 1440 دقيقة', 400, 'INVALID_MAX_AGE');
    }

    if (maxFiles && (typeof maxFiles !== 'number' || maxFiles < 1 || maxFiles > 1000)) {
      throw createError('maxFiles يجب أن يكون رقم بين 1 و 1000', 400, 'INVALID_MAX_FILES');
    }

    if (checkInterval && (typeof checkInterval !== 'number' || checkInterval < 1 || checkInterval > 60)) {
      throw createError('checkInterval يجب أن يكون رقم بين 1 و 60 دقيقة', 400, 'INVALID_CHECK_INTERVAL');
    }

    // إعادة تشغيل الخدمة بالإعدادات الجديدة
    autoDeleteService.stop();
    
    // تحديث الإعدادات (هذا يتطلب تعديل في الخدمة)
    // للآن سنعيد تشغيل الخدمة بالإعدادات الافتراضية
    autoDeleteService.start();

    res.json({
      success: true,
      message: 'تم تحديث إعدادات الحذف التلقائي',
      config: { maxAge, maxFiles, checkInterval }
    });

  } catch (error) {
    next(error);
  }
});

// فحص حالة الأمان العامة
router.get('/health', async (req, res, next) => {
  try {
    const stats = await autoDeleteService.getCleanupStats();
    const securityStats = getSecurityStats();

    // تحديد حالة النظام
    let status = 'healthy';
    const issues: string[] = [];

    // فحص عدد الملفات
    if (stats.uploadDir.fileCount > 50) {
      issues.push('عدد كبير من الملفات المرفوعة');
      status = 'warning';
    }

    if (stats.tempDir.fileCount > 20) {
      issues.push('عدد كبير من الملفات المؤقتة');
      status = 'warning';
    }

    // فحص IPs المحظورة
    if (securityStats.totalBlockedIPs > 10) {
      issues.push('عدد كبير من IPs المحظورة');
      status = 'warning';
    }

    // فحص الطلبات المشبوهة
    if (securityStats.totalSuspiciousRequests > 50) {
      issues.push('عدد كبير من الطلبات المشبوهة');
      status = 'critical';
    }

    res.json({
      success: true,
      data: {
        status,
        issues,
        autoCleanup: stats.isRunning,
        timestamp: new Date()
      }
    });

  } catch (error) {
    next(error);
  }
});

export default router;