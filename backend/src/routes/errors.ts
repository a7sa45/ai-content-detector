import express from 'express';
import { getRecentErrors, clearOldLogs } from '../services/errorService';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// الحصول على الأخطاء الأخيرة (للمطورين فقط)
router.get('/recent', async (req, res, next) => {
  try {
    // التحقق من أن البيئة هي التطوير
    if (process.env.NODE_ENV !== 'development') {
      throw createError('غير مسموح في بيئة الإنتاج', 403, 'ACCESS_DENIED');
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const errors = await getRecentErrors(limit);

    res.json({
      success: true,
      data: {
        errors,
        count: errors.length,
        timestamp: new Date()
      }
    });

  } catch (error) {
    next(error);
  }
});

// تنظيف السجلات القديمة (للمطورين فقط)
router.post('/cleanup', async (req, res, next) => {
  try {
    // التحقق من أن البيئة هي التطوير
    if (process.env.NODE_ENV !== 'development') {
      throw createError('غير مسموح في بيئة الإنتاج', 403, 'ACCESS_DENIED');
    }

    const daysToKeep = parseInt(req.body.daysToKeep) || 30;
    await clearOldLogs(daysToKeep);

    res.json({
      success: true,
      message: `تم تنظيف السجلات الأقدم من ${daysToKeep} يوم`
    });

  } catch (error) {
    next(error);
  }
});

// إحصائيات الأخطاء (للمطورين فقط)
router.get('/stats', async (req, res, next) => {
  try {
    // التحقق من أن البيئة هي التطوير
    if (process.env.NODE_ENV !== 'development') {
      throw createError('غير مسموح في بيئة الإنتاج', 403, 'ACCESS_DENIED');
    }

    const errors = await getRecentErrors(1000); // آخر 1000 خطأ
    
    // تجميع الإحصائيات
    const stats = {
      total: errors.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byCode: {} as Record<string, number>,
      last24Hours: 0,
      lastWeek: 0
    };

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    errors.forEach(error => {
      // تجميع حسب النوع
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      
      // تجميع حسب الخطورة
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
      
      // تجميع حسب الكود
      stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1;
      
      // حساب الأخطاء الأخيرة
      const errorDate = new Date(error.timestamp);
      if (errorDate >= oneDayAgo) {
        stats.last24Hours++;
      }
      if (errorDate >= oneWeekAgo) {
        stats.lastWeek++;
      }
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    next(error);
  }
});

export default router;