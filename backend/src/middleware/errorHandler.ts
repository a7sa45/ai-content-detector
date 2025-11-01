import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types';
import { 
  ErrorType, 
  ErrorSeverity, 
  logError, 
  createErrorDetails,
  ErrorDetails 
} from '../services/errorService';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
  type?: ErrorType;
  context?: any;
}

export const errorHandler = async (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // تحديد نوع الخطأ إذا لم يكن محدداً
  let errorType = err.type || ErrorType.SYSTEM_ERROR;
  let errorCode = err.code || 'INTERNAL_SERVER_ERROR';

  // معالجة أنواع الأخطاء المختلفة وتحديد النوع والكود
  if (err.name === 'ValidationError') {
    errorType = ErrorType.VALIDATION_ERROR;
    errorCode = 'VALIDATION_ERROR';
  } else if (err.name === 'MulterError') {
    errorType = ErrorType.FILE_UPLOAD;
    if (err.message.includes('File too large')) {
      errorCode = 'FILE_TOO_LARGE';
    } else if (err.message.includes('Unexpected field')) {
      errorCode = 'INVALID_FILE_TYPE';
    } else {
      errorCode = 'UPLOAD_FAILED';
    }
  } else if (err.message.includes('ENOENT')) {
    errorType = ErrorType.FILE_PROCESSING;
    errorCode = 'FILE_NOT_FOUND';
  } else if (err.message.includes('EACCES')) {
    errorType = ErrorType.SYSTEM_ERROR;
    errorCode = 'ACCESS_DENIED';
  } else if (err.message.includes('timeout') || err.code?.includes('TIMEOUT')) {
    errorType = ErrorType.TIMEOUT_ERROR;
    errorCode = 'ANALYSIS_TIMEOUT';
  } else if (err.message.includes('network') || err.code?.includes('NETWORK')) {
    errorType = ErrorType.NETWORK_ERROR;
    errorCode = 'NETWORK_ERROR';
  }

  // تسجيل الخطأ باستخدام النظام الجديد
  const errorDetails = await logError(
    errorType,
    errorCode,
    err,
    {
      ...err.context,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    },
    req.headers['user-id'] as string,
    req.headers['session-id'] as string
  );

  // تحديد رمز الحالة
  const statusCode = err.statusCode || 500;

  // إنشاء الاستجابة
  const errorResponse: ErrorResponse = {
    error: errorDetails.userMessage,
    code: errorDetails.code,
    timestamp: errorDetails.timestamp,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: errorDetails 
    })
  };

  res.status(statusCode).json(errorResponse);
};

// دالة لإنشاء خطأ مخصص محسنة
export const createError = (
  message: string, 
  statusCode: number = 500, 
  code?: string,
  type?: ErrorType,
  context?: any
): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  error.type = type;
  error.context = context;
  error.isOperational = true;
  return error;
};

// دالة للتعامل مع الأخطاء غير المتوقعة محسنة
export const handleUncaughtException = () => {
  process.on('uncaughtException', async (err) => {
    await logError(
      ErrorType.SYSTEM_ERROR,
      'UNCAUGHT_EXCEPTION',
      err,
      { processId: process.pid }
    );
    
    console.error('🚨 خطأ غير متوقع - إغلاق النظام:', err);
    
    // إعطاء وقت لتسجيل الخطأ قبل الإغلاق
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    await logError(
      ErrorType.SYSTEM_ERROR,
      'UNHANDLED_REJECTION',
      reason as Error,
      { promise: promise.toString(), processId: process.pid }
    );
    
    console.error('🚨 رفض غير معالج - إغلاق النظام:', reason);
    
    // إعطاء وقت لتسجيل الخطأ قبل الإغلاق
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // معالج إشارات الإغلاق
  process.on('SIGTERM', async () => {
    console.log('📝 تم استلام إشارة SIGTERM - إغلاق النظام بأمان...');
    
    await logError(
      ErrorType.SYSTEM_ERROR,
      'SYSTEM_SHUTDOWN',
      new Error('System shutdown requested'),
      { signal: 'SIGTERM', processId: process.pid }
    );
    
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('📝 تم استلام إشارة SIGINT - إغلاق النظام بأمان...');
    
    await logError(
      ErrorType.SYSTEM_ERROR,
      'SYSTEM_SHUTDOWN',
      new Error('System shutdown requested'),
      { signal: 'SIGINT', processId: process.pid }
    );
    
    process.exit(0);
  });
};