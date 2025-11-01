import { Router } from 'express';
import { APIPerformanceMonitor } from '../services/apiOptimizationService';
import { getCacheStats } from '../services/cacheService';

const router = Router();

// جلب إحصائيات أداء APIs
router.get('/api-metrics', async (req, res) => {
  try {
    const monitor = APIPerformanceMonitor.getInstance();
    const metrics = monitor.getMetrics();
    
    res.json({
      success: true,
      data: {
        apis: metrics,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'فشل في جلب إحصائيات الأداء',
      details: error.message
    });
  }
});

// جلب إحصائيات التخزين المؤقت
router.get('/cache-stats', async (req, res) => {
  try {
    const cacheStats = await getCacheStats();
    
    res.json({
      success: true,
      data: {
        cache: {
          ...cacheStats,
          totalSizeMB: Math.round(cacheStats.totalSize / (1024 * 1024) * 100) / 100
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'فشل في جلب إحصائيات التخزين المؤقت',
      details: error.message
    });
  }
});

// جلب إحصائيات شاملة للأداء
router.get('/overview', async (req, res) => {
  try {
    const monitor = APIPerformanceMonitor.getInstance();
    const apiMetrics = monitor.getMetrics();
    const cacheStats = await getCacheStats();
    
    // حساب إحصائيات إجمالية
    const totalRequests = Object.values(apiMetrics).reduce(
      (sum: number, metric: any) => sum + metric.totalRequests, 0
    );
    
    const totalSuccessful = Object.values(apiMetrics).reduce(
      (sum: number, metric: any) => sum + metric.successfulRequests, 0
    );
    
    const overallSuccessRate = totalRequests > 0 ? 
      Math.round((totalSuccessful / totalRequests) * 100) : 0;
    
    const averageResponseTime = Object.values(apiMetrics).reduce(
      (sum: number, metric: any) => sum + metric.averageResponseTime, 0
    ) / Object.keys(apiMetrics).length || 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalAPIRequests: totalRequests,
          overallSuccessRate,
          averageResponseTime: Math.round(averageResponseTime),
          cacheHitRate: cacheStats.totalFiles > 0 ? 
            Math.round((cacheStats.totalFiles / (totalRequests + cacheStats.totalFiles)) * 100) : 0
        },
        apis: apiMetrics,
        cache: {
          ...cacheStats,
          totalSizeMB: Math.round(cacheStats.totalSize / (1024 * 1024) * 100) / 100
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'فشل في جلب نظرة عامة على الأداء',
      details: error.message
    });
  }
});

// إعادة تعيين إحصائيات الأداء
router.post('/reset-metrics', async (req, res) => {
  try {
    const { apiName } = req.body;
    const monitor = APIPerformanceMonitor.getInstance();
    
    monitor.resetMetrics(apiName);
    
    res.json({
      success: true,
      message: apiName ? 
        `تم إعادة تعيين إحصائيات ${apiName}` : 
        'تم إعادة تعيين جميع الإحصائيات'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'فشل في إعادة تعيين الإحصائيات',
      details: error.message
    });
  }
});

// فحص صحة النظام
router.get('/health-check', async (req, res) => {
  try {
    const monitor = APIPerformanceMonitor.getInstance();
    const apiMetrics = monitor.getMetrics();
    const cacheStats = await getCacheStats();
    
    // فحص صحة APIs
    const apiHealth: any = {};
    Object.entries(apiMetrics).forEach(([apiName, metrics]: [string, any]) => {
      const recentFailures = metrics.failedRequests / metrics.totalRequests;
      const isHealthy = recentFailures < 0.5 && metrics.averageResponseTime < 30000;
      
      apiHealth[apiName] = {
        status: isHealthy ? 'healthy' : 'degraded',
        successRate: Math.round((metrics.successfulRequests / metrics.totalRequests) * 100),
        averageResponseTime: Math.round(metrics.averageResponseTime),
        lastRequest: new Date(metrics.lastRequestTime).toISOString()
      };
    });
    
    // فحص صحة التخزين المؤقت
    const cacheSizeMB = Math.round(cacheStats.totalSize / (1024 * 1024) * 100) / 100;
    const cacheHealth = {
      status: cacheSizeMB < 90 ? 'healthy' : 'warning', // تحذير إذا تجاوز 90 ميجا
      totalFiles: cacheStats.totalFiles,
      sizeMB: cacheSizeMB
    };
    
    const overallHealth = Object.values(apiHealth).every((api: any) => api.status === 'healthy') &&
                         cacheHealth.status === 'healthy' ? 'healthy' : 'degraded';

    res.json({
      success: true,
      data: {
        overall: overallHealth,
        apis: apiHealth,
        cache: cacheHealth,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'فشل في فحص صحة النظام',
      details: error.message
    });
  }
});

export default router;