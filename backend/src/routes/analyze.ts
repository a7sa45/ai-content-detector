import { Router, Request, Response, NextFunction } from 'express';
import { analyzeFile } from '../services/detectionService';
import { getFileType, deleteFile } from '../middleware/upload';
import { createError } from '../middleware/errorHandler';
import { AnalyzeResponse } from '../types';
import { analysisRateLimit, validateContentType } from '../middleware/securityMiddleware';
import fs from 'fs';
import path from 'path';

const router = Router();

// تحليل ملف مرفوع مع حماية أمنية
router.post('/', 
  analysisRateLimit,
  validateContentType(['application/json']),
  async (req: Request, res: Response, next: NextFunction) => {
  let filePath: string | undefined;
  
  try {
    const { filePath: requestFilePath, fileType, metadata } = req.body;
    
    if (!requestFilePath || !fileType || !metadata) {
      throw createError(
        'بيانات غير مكتملة. يجب توفير مسار الملف ونوعه ومعلوماته',
        400,
        'MISSING_REQUIRED_DATA'
      );
    }

    filePath = requestFilePath as string;

    // التحقق من وجود الملف
    if (!fs.existsSync(filePath)) {
      throw createError('الملف غير موجود', 404, 'FILE_NOT_FOUND');
    }

    // التحقق من نوع الملف
    const detectedFileType = getFileType(metadata.type);
    if (detectedFileType !== fileType) {
      throw createError(
        'نوع الملف المرسل لا يطابق النوع المكتشف',
        400,
        'FILE_TYPE_MISMATCH'
      );
    }

    console.log(`بدء تحليل ملف: ${metadata.name} (${fileType})`);

    // تحليل الملف
    const result = await analyzeFile(filePath, fileType, metadata);

    console.log(`انتهى تحليل ملف: ${metadata.name} - النتيجة: ${result.isAIGenerated ? 'معدل' : 'طبيعي'}`);

    const response: AnalyzeResponse = {
      success: true,
      result
    };

    res.json(response);

  } catch (error: any) {
    console.error('خطأ في تحليل الملف:', error);
    
    const response: AnalyzeResponse = {
      success: false,
      error: error.message || 'خطأ في تحليل الملف'
    };

    res.status(error.statusCode || 500).json(response);
  } finally {
    // حذف الملف بعد التحليل للحفاظ على الخصوصية
    if (filePath) {
      setTimeout(() => {
        deleteFile(filePath!);
      }, 5000); // انتظار 5 ثوان قبل الحذف
    }
  }
});

// تحليل ملف بالمعرف مع حماية أمنية
router.post('/by-id/:fileId', 
  analysisRateLimit,
  validateContentType(['application/json']),
  async (req: Request, res: Response, next: NextFunction) => {
  const { fileId } = req.params;
  const { fileType, metadata } = req.body;
  
  try {
    if (!fileId || !fileType || !metadata) {
      throw createError(
        'بيانات غير مكتملة. يجب توفير معرف الملف ونوعه ومعلوماته',
        400,
        'MISSING_REQUIRED_DATA'
      );
    }

    // البحث عن الملف في مجلد الرفع
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const files = fs.readdirSync(uploadDir);
    const matchingFile = files.find(file => file.includes(fileId));

    if (!matchingFile) {
      throw createError('الملف غير موجود أو انتهت صلاحيته', 404, 'FILE_NOT_FOUND');
    }

    const filePath = path.join(uploadDir, matchingFile);
    
    // تحليل الملف مباشرة
    const result = await analyzeFile(filePath, fileType, metadata);
    
    const response: AnalyzeResponse = {
      success: true,
      result
    };

    res.json(response);
    
    // حذف الملف بعد التحليل
    setTimeout(() => {
      deleteFile(filePath);
    }, 5000);

  } catch (error) {
    next(error);
  }
});

// الحصول على حالة التحليل
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'خدمة التحليل تعمل بشكل طبيعي',
    supportedTypes: ['image', 'video', 'audio'],
    apis: {
      hive: !!process.env.HIVE_API_KEY,
      deepware: true, // مجاني
      microsoft: !!process.env.MICROSOFT_API_KEY
    }
  });
});

// إحصائيات التحليل (اختياري)
router.get('/stats', (req: Request, res: Response) => {
  // يمكن إضافة إحصائيات حقيقية لاحقاً
  res.json({
    success: true,
    stats: {
      totalAnalyses: 0,
      imageAnalyses: 0,
      videoAnalyses: 0,
      audioAnalyses: 0,
      aiDetectedCount: 0,
      averageProcessingTime: 0
    }
  });
});

export { router as analyzeRoutes };