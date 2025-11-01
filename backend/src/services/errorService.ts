import fs from 'fs';
import path from 'path';

// أنواع الأخطاء المختلفة
export enum ErrorType {
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_PROCESSING = 'FILE_PROCESSING',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

// مستويات الخطورة
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// واجهة تفاصيل الخطأ
export interface ErrorDetails {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  arabicMessage: string;
  userMessage: string;
  code: string;
  timestamp: Date;
  context?: any;
  stackTrace?: string;
  userId?: string;
  sessionId?: string;
}

// رسائل الأخطاء باللغة العربية
const ERROR_MESSAGES: Record<string, { arabic: string; user: string }> = {
  // أخطاء رفع الملفات
  'FILE_TOO_LARGE': {
    arabic: 'حجم الملف كبير جداً',
    user: 'الملف المختار كبير جداً. الحد الأقصى المسموح هو 50 ميجابايت.'
  },
  'INVALID_FILE_TYPE': {
    arabic: 'نوع الملف غير مدعوم',
    user: 'نوع الملف غير مدعوم. يرجى اختيار ملف صورة أو فيديو أو صوت.'
  },
  'FILE_CORRUPTED': {
    arabic: 'الملف تالف أو غير قابل للقراءة',
    user: 'الملف تالف أو غير قابل للقراءة. يرجى المحاولة بملف آخر.'
  },
  'UPLOAD_FAILED': {
    arabic: 'فشل في رفع الملف',
    user: 'حدث خطأ أثناء رفع الملف. يرجى المحاولة مرة أخرى.'
  },

  // أخطاء معالجة الملفات
  'PROCESSING_FAILED': {
    arabic: 'فشل في معالجة الملف',
    user: 'حدث خطأ أثناء معالجة الملف. يرجى المحاولة مرة أخرى.'
  },
  'ANALYSIS_TIMEOUT': {
    arabic: 'انتهت مهلة التحليل',
    user: 'استغرق التحليل وقتاً أطول من المتوقع. يرجى المحاولة بملف أصغر.'
  },
  'INSUFFICIENT_STORAGE': {
    arabic: 'مساحة التخزين غير كافية',
    user: 'مساحة التخزين المؤقت ممتلئة. يرجى المحاولة لاحقاً.'
  },

  // أخطاء APIs الخارجية
  'API_UNAVAILABLE': {
    arabic: 'خدمة التحليل غير متوفرة',
    user: 'خدمة التحليل غير متوفرة حالياً. سيتم استخدام التحليل المحلي.'
  },
  'API_RATE_LIMIT': {
    arabic: 'تم تجاوز حد الطلبات',
    user: 'تم تجاوز حد الطلبات المسموح. يرجى المحاولة بعد قليل.'
  },
  'API_KEY_INVALID': {
    arabic: 'مفتاح API غير صحيح',
    user: 'حدث خطأ في التكوين. سيتم استخدام التحليل المحلي.'
  },
  'API_TIMEOUT': {
    arabic: 'انتهت مهلة الاستجابة من API',
    user: 'استغرقت خدمة التحليل وقتاً أطول من المتوقع. سيتم استخدام التحليل المحلي.'
  },

  // أخطاء التحقق من صحة البيانات
  'MISSING_FILE': {
    arabic: 'لم يتم اختيار ملف',
    user: 'يرجى اختيار ملف للتحليل.'
  },
  'INVALID_REQUEST': {
    arabic: 'طلب غير صحيح',
    user: 'البيانات المرسلة غير صحيحة. يرجى المحاولة مرة أخرى.'
  },

  // أخطاء النظام
  'SYSTEM_OVERLOAD': {
    arabic: 'النظام محمل بشكل زائد',
    user: 'النظام مشغول حالياً. يرجى المحاولة بعد قليل.'
  },
  'DATABASE_ERROR': {
    arabic: 'خطأ في قاعدة البيانات',
    user: 'حدث خطأ في النظام. يرجى المحاولة لاحقاً.'
  },
  'INTERNAL_ERROR': {
    arabic: 'خطأ داخلي في النظام',
    user: 'حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.'
  },

  // أخطاء الشبكة
  'NETWORK_ERROR': {
    arabic: 'خطأ في الاتصال',
    user: 'حدث خطأ في الاتصال. يرجى التحقق من الإنترنت والمحاولة مرة أخرى.'
  },
  'CONNECTION_TIMEOUT': {
    arabic: 'انتهت مهلة الاتصال',
    user: 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.'
  }
};

// خدمة تسجيل الأخطاء
class ErrorLogger {
  private logDir: string;
  private logFile: string;

  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.logFile = path.join(this.logDir, 'errors.log');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatLogEntry(error: ErrorDetails): string {
    const timestamp = error.timestamp.toISOString();
    const logEntry = {
      timestamp,
      type: error.type,
      severity: error.severity,
      code: error.code,
      message: error.message,
      arabicMessage: error.arabicMessage,
      context: error.context,
      userId: error.userId,
      sessionId: error.sessionId,
      stackTrace: error.stackTrace
    };

    return JSON.stringify(logEntry) + '\n';
  }

  public async logError(error: ErrorDetails): Promise<void> {
    try {
      const logEntry = this.formatLogEntry(error);
      
      // كتابة إلى ملف السجل
      fs.appendFileSync(this.logFile, logEntry);
      
      // طباعة في وحدة التحكم حسب مستوى الخطورة
      if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
        console.error('🚨 خطأ خطير:', error.arabicMessage, error.context);
      } else if (error.severity === ErrorSeverity.MEDIUM) {
        console.warn('⚠️ تحذير:', error.arabicMessage);
      } else {
        console.log('ℹ️ معلومات:', error.arabicMessage);
      }

    } catch (logError) {
      console.error('فشل في تسجيل الخطأ:', logError);
    }
  }

  public async getRecentErrors(limit: number = 100): Promise<ErrorDetails[]> {
    try {
      if (!fs.existsSync(this.logFile)) {
        return [];
      }

      const logContent = fs.readFileSync(this.logFile, 'utf-8');
      const lines = logContent.trim().split('\n').slice(-limit);
      
      return lines
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(entry => entry !== null);

    } catch (error) {
      console.error('فشل في قراءة سجل الأخطاء:', error);
      return [];
    }
  }

  public async clearOldLogs(daysToKeep: number = 30): Promise<void> {
    try {
      if (!fs.existsSync(this.logFile)) {
        return;
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const logContent = fs.readFileSync(this.logFile, 'utf-8');
      const lines = logContent.trim().split('\n');
      
      const recentLines = lines.filter(line => {
        try {
          const entry = JSON.parse(line);
          const entryDate = new Date(entry.timestamp);
          return entryDate >= cutoffDate;
        } catch {
          return false;
        }
      });

      fs.writeFileSync(this.logFile, recentLines.join('\n') + '\n');
      console.log(`تم تنظيف سجل الأخطاء: تم الاحتفاظ بـ ${recentLines.length} إدخال`);

    } catch (error) {
      console.error('فشل في تنظيف سجل الأخطاء:', error);
    }
  }
}

// إنشاء مثيل واحد من مسجل الأخطاء
const errorLogger = new ErrorLogger();

// دالة إنشاء تفاصيل الخطأ
export function createErrorDetails(
  type: ErrorType,
  code: string,
  originalError?: Error,
  context?: any,
  userId?: string,
  sessionId?: string
): ErrorDetails {
  const errorMessages = ERROR_MESSAGES[code] || {
    arabic: 'خطأ غير معروف',
    user: 'حدث خطأ غير متوقع'
  };

  // تحديد مستوى الخطورة بناءً على نوع الخطأ
  let severity: ErrorSeverity;
  switch (type) {
    case ErrorType.SYSTEM_ERROR:
      severity = ErrorSeverity.CRITICAL;
      break;
    case ErrorType.API_ERROR:
    case ErrorType.FILE_PROCESSING:
      severity = ErrorSeverity.HIGH;
      break;
    case ErrorType.NETWORK_ERROR:
    case ErrorType.TIMEOUT_ERROR:
      severity = ErrorSeverity.MEDIUM;
      break;
    default:
      severity = ErrorSeverity.LOW;
  }

  return {
    type,
    severity,
    message: originalError?.message || errorMessages.arabic,
    arabicMessage: errorMessages.arabic,
    userMessage: errorMessages.user,
    code,
    timestamp: new Date(),
    context,
    stackTrace: originalError?.stack,
    userId,
    sessionId
  };
}

// دالة تسجيل الخطأ
export async function logError(
  type: ErrorType,
  code: string,
  originalError?: Error,
  context?: any,
  userId?: string,
  sessionId?: string
): Promise<ErrorDetails> {
  const errorDetails = createErrorDetails(type, code, originalError, context, userId, sessionId);
  await errorLogger.logError(errorDetails);
  return errorDetails;
}

// دالة الحصول على الأخطاء الأخيرة
export async function getRecentErrors(limit?: number): Promise<ErrorDetails[]> {
  return errorLogger.getRecentErrors(limit);
}

// دالة تنظيف السجلات القديمة
export async function clearOldLogs(daysToKeep?: number): Promise<void> {
  return errorLogger.clearOldLogs(daysToKeep);
}

// دالة إعادة المحاولة مع تسجيل الأخطاء
export async function retryWithLogging<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  errorType: ErrorType = ErrorType.API_ERROR,
  context?: any
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // تسجيل المحاولة الفاشلة
      await logError(
        errorType,
        'RETRY_ATTEMPT_FAILED',
        lastError,
        { ...context, attempt, maxRetries }
      );

      // إذا كانت هذه المحاولة الأخيرة، ارمي الخطأ
      if (attempt === maxRetries) {
        break;
      }

      // انتظار قبل المحاولة التالية
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }

  // تسجيل فشل جميع المحاولات
  await logError(
    errorType,
    'ALL_RETRIES_FAILED',
    lastError!,
    { ...context, totalAttempts: maxRetries }
  );

  throw lastError;
}

// دالة معالجة الأخطاء للـ APIs الخارجية
export function handleAPIError(error: any, apiName: string, context?: any): ErrorDetails {
  let code = 'API_UNKNOWN_ERROR';
  let type = ErrorType.API_ERROR;

  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    code = 'API_UNAVAILABLE';
    type = ErrorType.NETWORK_ERROR;
  } else if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
    code = 'API_TIMEOUT';
    type = ErrorType.TIMEOUT_ERROR;
  } else if (error.response?.status === 429) {
    code = 'API_RATE_LIMIT';
  } else if (error.response?.status === 401 || error.response?.status === 403) {
    code = 'API_KEY_INVALID';
  } else if (error.response?.status >= 500) {
    code = 'API_UNAVAILABLE';
  }

  return createErrorDetails(
    type,
    code,
    error,
    { ...context, apiName, statusCode: error.response?.status }
  );
}

// تصدير مسجل الأخطاء للاستخدام المباشر
export { errorLogger };