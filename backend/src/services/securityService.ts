import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { logError, ErrorType } from './errorService';

const unlinkAsync = promisify(fs.unlink);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

// إعدادات التشفير
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

// مفتاح التشفير (يجب أن يكون في متغيرات البيئة في الإنتاج)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(KEY_LENGTH);

// واجهة بيانات الملف المشفر
export interface EncryptedFileData {
  encryptedData: Buffer;
  iv: Buffer;
  tag: Buffer;
  originalName: string;
  originalSize: number;
  encryptedAt: Date;
}

// واجهة إعدادات الحذف التلقائي
export interface AutoDeleteConfig {
  maxAge: number; // بالدقائق
  maxFiles: number;
  checkInterval: number; // بالدقائق
}

// الإعدادات الافتراضية للحذف التلقائي
const DEFAULT_AUTO_DELETE_CONFIG: AutoDeleteConfig = {
  maxAge: 30, // 30 دقيقة
  maxFiles: 100, // حد أقصى 100 ملف
  checkInterval: 5 // فحص كل 5 دقائق
};

// خدمة تشفير الملفات
export class FileEncryptionService {
  private static instance: FileEncryptionService;
  private encryptionKey: Buffer;

  private constructor() {
    this.encryptionKey = Buffer.isBuffer(ENCRYPTION_KEY) 
      ? ENCRYPTION_KEY 
      : Buffer.from(ENCRYPTION_KEY, 'hex');
    
    if (this.encryptionKey.length !== KEY_LENGTH) {
      throw new Error('مفتاح التشفير يجب أن يكون 32 بايت');
    }
  }

  public static getInstance(): FileEncryptionService {
    if (!FileEncryptionService.instance) {
      FileEncryptionService.instance = new FileEncryptionService();
    }
    return FileEncryptionService.instance;
  }

  // تشفير ملف
  public async encryptFile(filePath: string): Promise<EncryptedFileData> {
    try {
      const fileData = fs.readFileSync(filePath);
      const originalStats = fs.statSync(filePath);
      
      // إنشاء IV عشوائي
      const iv = crypto.randomBytes(IV_LENGTH);
      
      // إنشاء cipher
      const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, this.encryptionKey);
      cipher.setAAD(Buffer.from(path.basename(filePath)));
      
      // تشفير البيانات
      const encryptedData = Buffer.concat([
        cipher.update(fileData),
        cipher.final()
      ]);
      
      // الحصول على authentication tag
      const tag = cipher.getAuthTag();

      return {
        encryptedData,
        iv,
        tag,
        originalName: path.basename(filePath),
        originalSize: originalStats.size,
        encryptedAt: new Date()
      };

    } catch (error: any) {
      await logError(
        ErrorType.SYSTEM_ERROR,
        'FILE_ENCRYPTION_FAILED',
        error,
        { filePath }
      );
      throw error;
    }
  }

  // فك تشفير ملف
  public async decryptFile(encryptedData: EncryptedFileData): Promise<Buffer> {
    try {
      // إنشاء decipher
      const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, this.encryptionKey);
      decipher.setAAD(Buffer.from(encryptedData.originalName));
      decipher.setAuthTag(encryptedData.tag);
      
      // فك التشفير
      const decryptedData = Buffer.concat([
        decipher.update(encryptedData.encryptedData),
        decipher.final()
      ]);

      return decryptedData;

    } catch (error: any) {
      await logError(
        ErrorType.SYSTEM_ERROR,
        'FILE_DECRYPTION_FAILED',
        error,
        { originalName: encryptedData.originalName }
      );
      throw error;
    }
  }

  // تشفير ملف في مكانه
  public async encryptFileInPlace(filePath: string): Promise<string> {
    try {
      const encryptedData = await this.encryptFile(filePath);
      const encryptedFilePath = filePath + '.encrypted';
      
      // حفظ البيانات المشفرة
      const dataToSave = {
        ...encryptedData,
        encryptedData: encryptedData.encryptedData.toString('base64'),
        iv: encryptedData.iv.toString('base64'),
        tag: encryptedData.tag.toString('base64')
      };
      
      fs.writeFileSync(encryptedFilePath, JSON.stringify(dataToSave));
      
      // حذف الملف الأصلي
      await unlinkAsync(filePath);
      
      return encryptedFilePath;

    } catch (error: any) {
      await logError(
        ErrorType.SYSTEM_ERROR,
        'FILE_ENCRYPTION_IN_PLACE_FAILED',
        error,
        { filePath }
      );
      throw error;
    }
  }
}

// خدمة الحذف التلقائي للملفات
export class AutoDeleteService {
  private static instance: AutoDeleteService;
  private config: AutoDeleteConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor(config: Partial<AutoDeleteConfig> = {}) {
    this.config = { ...DEFAULT_AUTO_DELETE_CONFIG, ...config };
  }

  public static getInstance(config?: Partial<AutoDeleteConfig>): AutoDeleteService {
    if (!AutoDeleteService.instance) {
      AutoDeleteService.instance = new AutoDeleteService(config);
    }
    return AutoDeleteService.instance;
  }

  // بدء خدمة الحذف التلقائي
  public start(): void {
    if (this.isRunning) {
      console.log('⚠️ خدمة الحذف التلقائي تعمل بالفعل');
      return;
    }

    console.log(`🗑️ بدء خدمة الحذف التلقائي - فحص كل ${this.config.checkInterval} دقائق`);
    
    this.isRunning = true;
    
    // تشغيل فوري
    this.cleanupFiles();
    
    // تشغيل دوري
    this.intervalId = setInterval(() => {
      this.cleanupFiles();
    }, this.config.checkInterval * 60 * 1000);
  }

  // إيقاف خدمة الحذف التلقائي
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 تم إيقاف خدمة الحذف التلقائي');
  }

  // تنظيف الملفات
  private async cleanupFiles(): Promise<void> {
    try {
      const uploadDir = path.join(__dirname, '../../uploads');
      const tempDir = path.join(__dirname, '../../temp');
      
      await Promise.all([
        this.cleanupDirectory(uploadDir),
        this.cleanupDirectory(tempDir)
      ]);

    } catch (error: any) {
      await logError(
        ErrorType.SYSTEM_ERROR,
        'AUTO_CLEANUP_FAILED',
        error
      );
    }
  }

  // تنظيف مجلد محدد
  private async cleanupDirectory(dirPath: string): Promise<void> {
    try {
      if (!fs.existsSync(dirPath)) {
        return;
      }

      const files = await readdirAsync(dirPath);
      const now = new Date();
      const maxAgeMs = this.config.maxAge * 60 * 1000;
      
      let deletedCount = 0;
      let totalSize = 0;

      // فحص كل ملف
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        
        try {
          const stats = await statAsync(filePath);
          const fileAge = now.getTime() - stats.mtime.getTime();
          
          // حذف الملفات القديمة
          if (fileAge > maxAgeMs) {
            await unlinkAsync(filePath);
            deletedCount++;
            totalSize += stats.size;
            
            console.log(`🗑️ تم حذف ملف قديم: ${file} (${this.formatFileSize(stats.size)})`);
          }
        } catch (fileError) {
          // تجاهل أخطاء الملفات الفردية
          console.warn(`⚠️ خطأ في معالجة الملف ${file}:`, fileError);
        }
      }

      // فحص عدد الملفات المتبقية
      const remainingFiles = await readdirAsync(dirPath);
      if (remainingFiles.length > this.config.maxFiles) {
        await this.cleanupOldestFiles(dirPath, remainingFiles.length - this.config.maxFiles);
      }

      if (deletedCount > 0) {
        console.log(`✅ تم حذف ${deletedCount} ملف (${this.formatFileSize(totalSize)}) من ${dirPath}`);
      }

    } catch (error: any) {
      await logError(
        ErrorType.SYSTEM_ERROR,
        'DIRECTORY_CLEANUP_FAILED',
        error,
        { dirPath }
      );
    }
  }

  // حذف أقدم الملفات
  private async cleanupOldestFiles(dirPath: string, countToDelete: number): Promise<void> {
    try {
      const files = await readdirAsync(dirPath);
      const fileStats: Array<{ name: string; path: string; mtime: Date; size: number }> = [];

      // جمع معلومات الملفات
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        try {
          const stats = await statAsync(filePath);
          fileStats.push({
            name: file,
            path: filePath,
            mtime: stats.mtime,
            size: stats.size
          });
        } catch {
          // تجاهل الملفات التي لا يمكن قراءتها
        }
      }

      // ترتيب حسب التاريخ (الأقدم أولاً)
      fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

      // حذف أقدم الملفات
      const filesToDelete = fileStats.slice(0, countToDelete);
      let deletedSize = 0;

      for (const file of filesToDelete) {
        try {
          await unlinkAsync(file.path);
          deletedSize += file.size;
          console.log(`🗑️ تم حذف ملف (حد العدد): ${file.name} (${this.formatFileSize(file.size)})`);
        } catch (error) {
          console.warn(`⚠️ فشل حذف الملف ${file.name}:`, error);
        }
      }

      if (filesToDelete.length > 0) {
        console.log(`✅ تم حذف ${filesToDelete.length} ملف إضافي (${this.formatFileSize(deletedSize)}) لتجاوز حد العدد`);
      }

    } catch (error: any) {
      await logError(
        ErrorType.SYSTEM_ERROR,
        'OLDEST_FILES_CLEANUP_FAILED',
        error,
        { dirPath, countToDelete }
      );
    }
  }

  // تنسيق حجم الملف
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // حذف ملف محدد فوراً
  public async deleteFileImmediately(filePath: string): Promise<boolean> {
    try {
      if (fs.existsSync(filePath)) {
        await unlinkAsync(filePath);
        console.log(`🗑️ تم حذف الملف فوراً: ${path.basename(filePath)}`);
        return true;
      }
      return false;
    } catch (error: any) {
      await logError(
        ErrorType.SYSTEM_ERROR,
        'IMMEDIATE_DELETE_FAILED',
        error,
        { filePath }
      );
      return false;
    }
  }

  // الحصول على إحصائيات التنظيف
  public async getCleanupStats(): Promise<{
    uploadDir: { fileCount: number; totalSize: number };
    tempDir: { fileCount: number; totalSize: number };
    config: AutoDeleteConfig;
    isRunning: boolean;
  }> {
    const uploadDir = path.join(__dirname, '../../uploads');
    const tempDir = path.join(__dirname, '../../temp');

    const getDirectoryStats = async (dirPath: string) => {
      try {
        if (!fs.existsSync(dirPath)) {
          return { fileCount: 0, totalSize: 0 };
        }

        const files = await readdirAsync(dirPath);
        let totalSize = 0;

        for (const file of files) {
          try {
            const stats = await statAsync(path.join(dirPath, file));
            totalSize += stats.size;
          } catch {
            // تجاهل الملفات التي لا يمكن قراءتها
          }
        }

        return { fileCount: files.length, totalSize };
      } catch {
        return { fileCount: 0, totalSize: 0 };
      }
    };

    const [uploadStats, tempStats] = await Promise.all([
      getDirectoryStats(uploadDir),
      getDirectoryStats(tempDir)
    ]);

    return {
      uploadDir: uploadStats,
      tempDir: tempStats,
      config: this.config,
      isRunning: this.isRunning
    };
  }
}

// دوال مساعدة للتصدير
export const encryptionService = FileEncryptionService.getInstance();
export const autoDeleteService = AutoDeleteService.getInstance();

// تشغيل خدمة الحذف التلقائي عند تحميل الوحدة
autoDeleteService.start();