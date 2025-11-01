import fs from 'fs';
import path from 'path';
import Jimp from 'jimp';
import { promisify } from 'util';

// إعدادات الضغط
const COMPRESSION_SETTINGS = {
  image: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
    maxSizeKB: 2048 // 2 ميجابايت
  },
  video: {
    maxSizeKB: 10240 // 10 ميجابايت
  },
  audio: {
    maxSizeKB: 5120 // 5 ميجابايت
  }
};

// ضغط الصور باستخدام Jimp
export const compressImage = async (inputPath: string, outputPath?: string): Promise<{
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  outputPath: string;
}> => {
  try {
    const originalStats = await fs.promises.stat(inputPath);
    const originalSize = originalStats.size;

    // إذا كان الملف صغير بالفعل، لا نحتاج لضغطه
    if (originalSize <= COMPRESSION_SETTINGS.image.maxSizeKB * 1024) {
      return {
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        outputPath: inputPath
      };
    }

    const finalOutputPath = outputPath || inputPath.replace(/\.[^.]+$/, '_compressed.jpg');
    
    // قراءة وضغط الصورة
    const image = await Jimp.read(inputPath);
    const { width, height } = image.bitmap;

    // تغيير الحجم إذا كان كبيراً
    if (width > COMPRESSION_SETTINGS.image.maxWidth || height > COMPRESSION_SETTINGS.image.maxHeight) {
      image.scaleToFit(COMPRESSION_SETTINGS.image.maxWidth, COMPRESSION_SETTINGS.image.maxHeight);
    }

    // ضغط وحفظ
    await image
      .quality(COMPRESSION_SETTINGS.image.quality)
      .writeAsync(finalOutputPath);

    const compressedStats = await fs.promises.stat(finalOutputPath);
    const compressedSize = compressedStats.size;
    const compressionRatio = originalSize / compressedSize;

    console.log(`ضغط الصورة: ${originalSize} -> ${compressedSize} bytes (نسبة: ${compressionRatio.toFixed(2)}x)`);

    return {
      originalSize,
      compressedSize,
      compressionRatio,
      outputPath: finalOutputPath
    };

  } catch (error) {
    console.error('خطأ في ضغط الصورة:', error);
    throw error;
  }
};

// فحص ما إذا كان الملف يحتاج لضغط
export const needsCompression = (filePath: string, fileType: 'image' | 'video' | 'audio'): boolean => {
  try {
    const stats = fs.statSync(filePath);
    const fileSizeKB = stats.size / 1024;
    
    switch (fileType) {
      case 'image':
        return fileSizeKB > COMPRESSION_SETTINGS.image.maxSizeKB;
      case 'video':
        return fileSizeKB > COMPRESSION_SETTINGS.video.maxSizeKB;
      case 'audio':
        return fileSizeKB > COMPRESSION_SETTINGS.audio.maxSizeKB;
      default:
        return false;
    }
  } catch (error) {
    console.error('خطأ في فحص الحاجة للضغط:', error);
    return false;
  }
};

// ضغط تلقائي للملف حسب النوع
export const autoCompress = async (filePath: string, fileType: 'image' | 'video' | 'audio'): Promise<string> => {
  try {
    if (!needsCompression(filePath, fileType)) {
      return filePath; // لا يحتاج ضغط
    }

    switch (fileType) {
      case 'image':
        const result = await compressImage(filePath);
        return result.outputPath;
      
      case 'video':
        // للفيديو، نحتاج ffmpeg للضغط الفعال
        // حالياً سنعيد المسار الأصلي
        console.log('ضغط الفيديو يتطلب ffmpeg (غير متوفر حالياً)');
        return filePath;
      
      case 'audio':
        // للصوت، نحتاج أدوات ضغط صوتي
        console.log('ضغط الصوت يتطلب أدوات إضافية (غير متوفر حالياً)');
        return filePath;
      
      default:
        return filePath;
    }
  } catch (error) {
    console.error('خطأ في الضغط التلقائي:', error);
    return filePath; // إرجاع المسار الأصلي في حالة الخطأ
  }
};

// تحسين حجم الملف للتحليل السريع
export const optimizeForAnalysis = async (filePath: string, fileType: 'image' | 'video' | 'audio'): Promise<{
  optimizedPath: string;
  isOptimized: boolean;
  originalSize: number;
  optimizedSize: number;
}> => {
  try {
    const originalStats = await fs.promises.stat(filePath);
    const originalSize = originalStats.size;

    // للصور، إنشاء نسخة مصغرة للتحليل السريع
    if (fileType === 'image') {
      const tempDir = path.join(process.cwd(), 'temp', 'optimized');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const optimizedPath = path.join(tempDir, `optimized_${Date.now()}_${path.basename(filePath)}`);
      
      const image = await Jimp.read(filePath);
      
      // تصغير للتحليل السريع (حد أقصى 800x600)
      image.scaleToFit(800, 600);
      
      await image
        .quality(70) // جودة أقل للسرعة
        .writeAsync(optimizedPath);

      const optimizedStats = await fs.promises.stat(optimizedPath);
      const optimizedSize = optimizedStats.size;

      return {
        optimizedPath,
        isOptimized: true,
        originalSize,
        optimizedSize
      };
    }

    // للفيديو والصوت، استخدم الملف الأصلي حالياً
    return {
      optimizedPath: filePath,
      isOptimized: false,
      originalSize,
      optimizedSize: originalSize
    };

  } catch (error) {
    console.error('خطأ في تحسين الملف:', error);
    return {
      optimizedPath: filePath,
      isOptimized: false,
      originalSize: 0,
      optimizedSize: 0
    };
  }
};

// تنظيف الملفات المحسنة المؤقتة
export const cleanOptimizedFiles = async (): Promise<void> => {
  try {
    const optimizedDir = path.join(process.cwd(), 'temp', 'optimized');
    
    if (!fs.existsSync(optimizedDir)) {
      return;
    }

    const files = await fs.promises.readdir(optimizedDir);
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join(optimizedDir, file);
      const stats = await fs.promises.stat(filePath);
      
      // حذف الملفات الأقدم من ساعة واحدة
      if (now - stats.mtime.getTime() > 60 * 60 * 1000) {
        await fs.promises.unlink(filePath);
        console.log(`تم حذف الملف المحسن المؤقت: ${file}`);
      }
    }
  } catch (error) {
    console.error('خطأ في تنظيف الملفات المحسنة:', error);
  }
};

// تشغيل تنظيف دوري للملفات المحسنة
setInterval(cleanOptimizedFiles, 30 * 60 * 1000); // كل 30 دقيقة