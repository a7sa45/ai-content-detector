import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createError } from './errorHandler';
import { autoDeleteService } from '../services/securityService';
import { logError, ErrorType } from '../services/errorService';

// إنشاء مجلد الرفع إذا لم يكن موجوداً
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// تكوين التخزين
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // إنشاء اسم ملف فريد مع الطابع الزمني
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});

// فلترة أنواع الملفات المدعومة (مبسطة)
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  try {
    // الأنواع المدعومة
    const allowedMimes = [
      // الصور
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp',
      'image/webp', 'image/tiff', 'image/avif', 'image/heic',
      
      // الفيديو
      'video/mp4', 'video/avi', 'video/mov', 'video/webm',
      'video/wmv', 'video/flv', 'video/mkv', 'video/m4v',
      
      // الصوت
      'audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/aac',
      'audio/ogg', 'audio/flac', 'audio/m4a', 'audio/wma'
    ];

    // فحص نوع MIME
    if (!allowedMimes.includes(file.mimetype)) {
      console.log(`❌ نوع ملف غير مدعوم: ${file.mimetype}`);
      return cb(new Error(`نوع الملف ${file.mimetype} غير مدعوم`));
    }

    // فحص اسم الملف للكلمات المشبوهة
    const suspiciousNames = ['script', 'exe', 'bat', 'cmd', 'php', 'asp', 'jsp'];
    const fileName = file.originalname.toLowerCase();
    
    if (suspiciousNames.some(name => fileName.includes(name))) {
      console.log(`❌ اسم ملف مشبوه: ${file.originalname}`);
      return cb(new Error('اسم الملف يحتوي على كلمات غير مسموحة'));
    }

    console.log(`✅ ملف مقبول: ${file.originalname} (${file.mimetype})`);
    cb(null, true);

  } catch (error: any) {
    console.error('❌ خطأ في فحص الملف:', error);
    cb(new Error('خطأ في فحص الملف'));
  }
};

// تكوين multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB افتراضي
    files: 1 // ملف واحد فقط
  }
});

// دالة لتحديد نوع الملف
export const getFileType = (mimetype: string): 'image' | 'video' | 'audio' => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  throw createError('نوع ملف غير معروف', 400, 'UNKNOWN_FILE_TYPE');
};

// دالة لحذف الملف مع تسجيل محسن
export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    const result = await autoDeleteService.deleteFileImmediately(filePath);
    if (result) {
      console.log(`✅ تم حذف الملف: ${path.basename(filePath)}`);
    }
    return result;
  } catch (error: any) {
    await logError(
      ErrorType.FILE_PROCESSING,
      'FILE_DELETE_FAILED',
      error,
      { filePath }
    );
    console.error(`❌ خطأ في حذف الملف ${filePath}:`, error);
    return false;
  }
};

// دالة للحصول على إحصائيات الملفات
export const getUploadStats = async () => {
  try {
    return await autoDeleteService.getCleanupStats();
  } catch (error: any) {
    await logError(
      ErrorType.SYSTEM_ERROR,
      'UPLOAD_STATS_ERROR',
      error
    );
    return null;
  }
};

// middleware لتسجيل معلومات الرفع (مبسط)
export const logUploadActivity = (req: any, res: any, next: any) => {
  console.log(`📤 محاولة رفع ملف من IP: ${req.ip}`);
  next();
};

export { upload };