import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createError } from './errorHandler';
import { logError, ErrorType } from '../services/errorService';

// واجهة معلومات الطلب الأمني
interface SecurityRequestInfo {
  ip: string;
  userAgent: string;
  method: string;
  url: string;
  timestamp: Date;
  headers: Record<string, string>;
}

// خريطة لتتبع الطلبات المشبوهة
const suspiciousRequests = new Map<string, number>();
const blockedIPs = new Set<string>();

// تنظيف البيانات المؤقتة كل ساعة
setInterval(() => {
  suspiciousRequests.clear();
  console.log('🧹 تم تنظيف ذاكرة الطلبات المشبوهة');
}, 60 * 60 * 1000);

// إعدادات Rate Limiting المتقدمة
export const createAdvancedRateLimit = (options: {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: options.message,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    handler: async (req: Request, res: Response) => {
      const requestInfo: SecurityRequestInfo = {
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        method: req.method,
        url: req.url,
        timestamp: new Date(),
        headers: req.headers as Record<string, string>
      };

      // تسجيل تجاوز الحد
      await logError(
        ErrorType.SYSTEM_ERROR,
        'RATE_LIMIT_EXCEEDED',
        new Error('تم تجاوز حد الطلبات'),
        requestInfo
      );

      // زيادة عداد الطلبات المشبوهة
      const currentCount = suspiciousRequests.get(requestInfo.ip) || 0;
      suspiciousRequests.set(requestInfo.ip, currentCount + 1);

      // حظر IP إذا تجاوز الحد المسموح
      if (currentCount >= 5) {
        blockedIPs.add(requestInfo.ip);
        console.log(`🚫 تم حظر IP مؤقتاً: ${requestInfo.ip}`);
        
        await logError(
          ErrorType.SYSTEM_ERROR,
          'IP_TEMPORARILY_BLOCKED',
          new Error('تم حظر IP مؤقتاً'),
          requestInfo
        );
      }

      res.status(429).json({
        error: options.message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  });
};

// Rate limiting للملفات (أكثر تشدداً)
export const fileUploadRateLimit = createAdvancedRateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 10, // 10 ملفات كحد أقصى
  message: 'تم تجاوز حد رفع الملفات. يرجى المحاولة بعد 15 دقيقة',
  skipSuccessfulRequests: true
});

// Rate limiting للتحليل
export const analysisRateLimit = createAdvancedRateLimit({
  windowMs: 10 * 60 * 1000, // 10 دقائق
  max: 20, // 20 تحليل كحد أقصى
  message: 'تم تجاوز حد طلبات التحليل. يرجى المحاولة بعد 10 دقائق'
});

// Rate limiting عام للAPI
export const generalAPIRateLimit = createAdvancedRateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // 100 طلب كحد أقصى
  message: 'تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة بعد 15 دقيقة'
});

// middleware فحص IP المحظور
export const checkBlockedIP = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || 'unknown';
  
  if (blockedIPs.has(clientIP)) {
    res.status(403).json({
      error: 'تم حظر عنوان IP الخاص بك مؤقتاً بسبب النشاط المشبوه',
      code: 'IP_BLOCKED'
    });
    return;
  }
  
  next();
};

// middleware كشف الطلبات المشبوهة
export const detectSuspiciousActivity = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const requestInfo: SecurityRequestInfo = {
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      method: req.method,
      url: req.url,
      timestamp: new Date(),
      headers: req.headers as Record<string, string>
    };

    let suspiciousScore = 0;
    const suspiciousIndicators: string[] = [];

    // فحص User-Agent المشبوه
    const userAgent = requestInfo.userAgent.toLowerCase();
    const suspiciousUserAgents = [
      'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 
      'python', 'java', 'go-http', 'postman'
    ];
    
    if (suspiciousUserAgents.some(agent => userAgent.includes(agent))) {
      suspiciousScore += 2;
      suspiciousIndicators.push('User-Agent مشبوه');
    }

    // فحص عدم وجود User-Agent
    if (!requestInfo.userAgent || requestInfo.userAgent === 'unknown') {
      suspiciousScore += 3;
      suspiciousIndicators.push('User-Agent مفقود');
    }

    // فحص طلبات متتالية سريعة
    const recentRequests = suspiciousRequests.get(requestInfo.ip) || 0;
    if (recentRequests > 3) {
      suspiciousScore += 2;
      suspiciousIndicators.push('طلبات متتالية سريعة');
    }

    // فحص حجم الطلب الكبير
    const contentLength = parseInt(req.get('Content-Length') || '0');
    if (contentLength > 100 * 1024 * 1024) { // أكبر من 100MB
      suspiciousScore += 3;
      suspiciousIndicators.push('حجم طلب كبير جداً');
    }

    // فحص headers مشبوهة
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-originating-ip'];
    const hasSuspiciousHeaders = suspiciousHeaders.some(header => req.get(header));
    if (hasSuspiciousHeaders) {
      suspiciousScore += 1;
      suspiciousIndicators.push('Headers مشبوهة');
    }

    // فحص محاولة الوصول لمسارات حساسة
    const sensitivePaths = ['/admin', '/config', '/env', '/.env', '/backup'];
    if (sensitivePaths.some(path => requestInfo.url.includes(path))) {
      suspiciousScore += 4;
      suspiciousIndicators.push('محاولة الوصول لمسار حساس');
    }

    // إذا كان النشاط مشبوهاً جداً (أقل تشدداً في التطوير)
    const suspiciousThreshold = process.env.NODE_ENV === 'production' ? 5 : 8;
    
    if (suspiciousScore >= suspiciousThreshold) {
      await logError(
        ErrorType.SYSTEM_ERROR,
        'SUSPICIOUS_ACTIVITY_DETECTED',
        new Error('تم اكتشاف نشاط مشبوه'),
        { ...requestInfo, suspiciousScore, indicators: suspiciousIndicators }
      );

      // في بيئة التطوير، لا تحظر IP المحلي
      if (process.env.NODE_ENV === 'production' || !requestInfo.ip.includes('127.0.0.1') && !requestInfo.ip.includes('localhost')) {
        blockedIPs.add(requestInfo.ip);
      }
      
      res.status(403).json({
        error: 'تم اكتشاف نشاط مشبوه. تم حظر الوصول مؤقتاً',
        code: 'SUSPICIOUS_ACTIVITY'
      });
      return;
    }

    // تسجيل النشاط المشبوه المتوسط
    if (suspiciousScore >= 3) {
      await logError(
        ErrorType.SYSTEM_ERROR,
        'MODERATE_SUSPICIOUS_ACTIVITY',
        new Error('نشاط مشبوه متوسط'),
        { ...requestInfo, suspiciousScore, indicators: suspiciousIndicators }
      );
    }

    next();

  } catch (error: any) {
    await logError(
      ErrorType.SYSTEM_ERROR,
      'SECURITY_MIDDLEWARE_ERROR',
      error,
      { url: req.url, method: req.method }
    );
    next(); // المتابعة حتى لو فشل الفحص الأمني
  }
};

// middleware التحقق من صحة نوع المحتوى
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.get('Content-Type');
    
    if (req.method === 'POST' || req.method === 'PUT') {
      if (!contentType) {
        return res.status(400).json({
          error: 'نوع المحتوى مطلوب',
          code: 'CONTENT_TYPE_REQUIRED'
        });
      }

      const isAllowed = allowedTypes.some(type => 
        contentType.toLowerCase().includes(type.toLowerCase())
      );

      if (!isAllowed) {
        return res.status(400).json({
          error: 'نوع المحتوى غير مدعوم',
          code: 'INVALID_CONTENT_TYPE',
          allowedTypes
        });
      }
    }

    next();
  };
};

// middleware حماية من CSRF
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // تجاهل طلبات GET
  if (req.method === 'GET') {
    return next();
  }

  // في بيئة التطوير، كن أقل تشدداً
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const origin = req.get('Origin');
  const referer = req.get('Referer');
  const host = req.get('Host');

  // التحقق من Origin أو Referer
  if (!origin && !referer) {
    return res.status(403).json({
      error: 'طلب غير آمن - Origin أو Referer مطلوب',
      code: 'CSRF_PROTECTION'
    });
  }

  // التحقق من أن Origin يطابق Host
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return res.status(403).json({
          error: 'طلب غير آمن - Origin غير متطابق',
          code: 'CSRF_PROTECTION'
        });
      }
    } catch (error) {
      // إذا فشل parsing الURL، تجاهل في بيئة التطوير
      console.warn('خطأ في parsing Origin URL:', origin);
    }
  }

  next();
};

// إعدادات Helmet المتقدمة
export const advancedHelmet = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // تعطيل لتجنب مشاكل مع رفع الملفات
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true
});

// middleware تنظيف البيانات المدخلة
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // تنظيف query parameters
  for (const key in req.query) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = (req.query[key] as string)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
  }

  // تنظيف body parameters
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
    }
  }

  next();
};

// دالة إلغاء حظر IP (للاستخدام الإداري)
export const unblockIP = (ip: string): boolean => {
  if (blockedIPs.has(ip)) {
    blockedIPs.delete(ip);
    suspiciousRequests.delete(ip);
    console.log(`✅ تم إلغاء حظر IP: ${ip}`);
    return true;
  }
  return false;
};

// دالة الحصول على إحصائيات الأمان
export const getSecurityStats = () => {
  return {
    blockedIPs: Array.from(blockedIPs),
    suspiciousRequests: Object.fromEntries(suspiciousRequests),
    totalBlockedIPs: blockedIPs.size,
    totalSuspiciousRequests: Array.from(suspiciousRequests.values()).reduce((a, b) => a + b, 0)
  };
};