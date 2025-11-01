import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { AnalysisResult } from '../types';

// إعدادات التخزين المؤقت
const CACHE_DIR = path.join(process.cwd(), 'temp', 'cache');
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 ساعة
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100 ميجابايت

// إنشاء مجلد التخزين المؤقت إذا لم يكن موجوداً
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// إنشاء مفتاح تخزين مؤقت للملف
export const generateCacheKey = (filePath: string, fileSize: number, modifiedTime: number): string => {
  const hash = crypto.createHash('md5');
  hash.update(`${filePath}-${fileSize}-${modifiedTime}`);
  return hash.digest('hex');
};

// حفظ النتيجة في التخزين المؤقت
export const cacheResult = async (cacheKey: string, result: AnalysisResult): Promise<void> => {
  try {
    const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`);
    const cacheData = {
      timestamp: Date.now(),
      result
    };
    
    await fs.promises.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
    console.log(`تم حفظ النتيجة في التخزين المؤقت: ${cacheKey}`);
  } catch (error) {
    console.error('خطأ في حفظ التخزين المؤقت:', error);
  }
};

// استرجاع النتيجة من التخزين المؤقت
export const getCachedResult = async (cacheKey: string): Promise<AnalysisResult | null> => {
  try {
    const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`);
    
    if (!fs.existsSync(cacheFile)) {
      return null;
    }

    const cacheData = JSON.parse(await fs.promises.readFile(cacheFile, 'utf8'));
    
    // فحص انتهاء صلاحية التخزين المؤقت
    if (Date.now() - cacheData.timestamp > CACHE_EXPIRY) {
      await fs.promises.unlink(cacheFile);
      return null;
    }

    console.log(`تم استرجاع النتيجة من التخزين المؤقت: ${cacheKey}`);
    return cacheData.result;
  } catch (error) {
    console.error('خطأ في استرجاع التخزين المؤقت:', error);
    return null;
  }
};

// تنظيف التخزين المؤقت المنتهي الصلاحية
export const cleanExpiredCache = async (): Promise<void> => {
  try {
    const files = await fs.promises.readdir(CACHE_DIR);
    let totalSize = 0;
    const fileStats: Array<{ file: string; stats: fs.Stats }> = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(CACHE_DIR, file);
        const stats = await fs.promises.stat(filePath);
        totalSize += stats.size;
        fileStats.push({ file, stats });
      }
    }

    // حذف الملفات المنتهية الصلاحية
    const now = Date.now();
    for (const { file, stats } of fileStats) {
      if (now - stats.mtime.getTime() > CACHE_EXPIRY) {
        await fs.promises.unlink(path.join(CACHE_DIR, file));
        console.log(`تم حذف ملف التخزين المؤقت المنتهي الصلاحية: ${file}`);
      }
    }

    // إذا تجاوز الحجم الحد الأقصى، احذف الملفات الأقدم
    if (totalSize > MAX_CACHE_SIZE) {
      const sortedFiles = fileStats
        .filter(({ file, stats }) => now - stats.mtime.getTime() <= CACHE_EXPIRY)
        .sort((a, b) => a.stats.mtime.getTime() - b.stats.mtime.getTime());

      let currentSize = totalSize;
      for (const { file } of sortedFiles) {
        if (currentSize <= MAX_CACHE_SIZE * 0.8) break; // اترك 20% مساحة
        
        const filePath = path.join(CACHE_DIR, file);
        const stats = await fs.promises.stat(filePath);
        await fs.promises.unlink(filePath);
        currentSize -= stats.size;
        console.log(`تم حذف ملف التخزين المؤقت لتوفير المساحة: ${file}`);
      }
    }

  } catch (error) {
    console.error('خطأ في تنظيف التخزين المؤقت:', error);
  }
};

// إحصائيات التخزين المؤقت
export const getCacheStats = async (): Promise<{
  totalFiles: number;
  totalSize: number;
  oldestFile: Date | null;
  newestFile: Date | null;
}> => {
  try {
    const files = await fs.promises.readdir(CACHE_DIR);
    let totalSize = 0;
    let oldestTime = Infinity;
    let newestTime = 0;

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(CACHE_DIR, file);
        const stats = await fs.promises.stat(filePath);
        totalSize += stats.size;
        
        const mtime = stats.mtime.getTime();
        if (mtime < oldestTime) oldestTime = mtime;
        if (mtime > newestTime) newestTime = mtime;
      }
    }

    return {
      totalFiles: files.filter(f => f.endsWith('.json')).length,
      totalSize,
      oldestFile: oldestTime === Infinity ? null : new Date(oldestTime),
      newestFile: newestTime === 0 ? null : new Date(newestTime)
    };
  } catch (error) {
    console.error('خطأ في جلب إحصائيات التخزين المؤقت:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      oldestFile: null,
      newestFile: null
    };
  }
};

// تشغيل تنظيف دوري للتخزين المؤقت
setInterval(cleanExpiredCache, 60 * 60 * 1000); // كل ساعة