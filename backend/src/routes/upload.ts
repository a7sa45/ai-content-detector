import { Router, Request, Response, NextFunction } from 'express';
import { upload, getFileType, deleteFile, logUploadActivity } from '../middleware/upload';
import { createError } from '../middleware/errorHandler';
import { FileMetadata } from '../types';
import { fileUploadRateLimit, validateContentType } from '../middleware/securityMiddleware';
import path from 'path';

const router = Router();

// رفع ملف واحد (مبسط)
router.post('/', 
  logUploadActivity,
  upload.single('file'), 
  (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw createError('لم يتم رفع أي ملف', 400, 'NO_FILE_UPLOADED');
    }

    // إنشاء معلومات الملف
    const fileMetadata: FileMetadata = {
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      uploadTime: new Date()
    };

    // تحديد نوع الملف للمعالجة
    const fileType = getFileType(req.file.mimetype);

    // إضافة معلومات إضافية حسب نوع الملف
    if (fileType === 'image') {
      // يمكن إضافة معلومات الأبعاد لاحقاً باستخدام مكتبة مثل sharp
      fileMetadata.dimensions = { width: 0, height: 0 };
    } else if (fileType === 'video' || fileType === 'audio') {
      // يمكن إضافة معلومات المدة لاحقاً باستخدام مكتبة مثل ffprobe
      fileMetadata.duration = 0;
    }

    console.log(`تم رفع ملف جديد: ${req.file.originalname} (${fileType})`);

    res.json({
      success: true,
      message: 'تم رفع الملف بنجاح',
      file: {
        id: path.basename(req.file.filename, path.extname(req.file.filename)),
        path: req.file.path,
        type: fileType,
        metadata: fileMetadata
      }
    });

  } catch (error) {
    // حذف الملف في حالة حدوث خطأ
    if (req.file) {
      deleteFile(req.file.path);
    }
    next(error);
  }
});

// التحقق من حالة الرفع
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'خدمة رفع الملفات تعمل بشكل طبيعي',
    limits: {
      maxFileSize: process.env.MAX_FILE_SIZE || '52428800',
      supportedTypes: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/avi', 'video/mov', 'video/webm',
        'audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg'
      ]
    }
  });
});

export { router as uploadRoutes };