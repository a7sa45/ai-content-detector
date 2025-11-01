import FormData = require('form-data');
import { monitoredAPIRequest } from './apiOptimizationService';
import fs from 'fs';
import { AnalysisResult, FileType } from '../types';
import { createError } from '../middleware/errorHandler';
import { performAdvancedImageAnalysis } from './imageAnalysisService';
import { performAdvancedVideoAnalysis } from './videoAnalysisService';
import { performSimpleVideoAnalysis } from './simpleVideoAnalysisService';
import { performAdvancedAudioAnalysis } from './audioAnalysisService';
import { 
  ErrorType, 
  retryWithLogging, 
  handleAPIError, 
  logError 
} from './errorService';
import { 
  generateCacheKey, 
  getCachedResult, 
  cacheResult 
} from './cacheService';
import { 
  optimizeForAnalysis, 
  autoCompress 
} from './compressionService';

// تكوين APIs الكشف
const DETECTION_APIS = {
  hive: {
    endpoint: 'https://api.thehive.ai/api/v2/task/sync',
    apiKey: process.env.HIVE_API_KEY
  },
  deepware: {
    endpoint: 'https://api.deepware.ai/deepfakeDetection',
    apiKey: process.env.DEEPWARE_API_KEY
  },
  microsoft: {
    endpoint: 'https://api.videoauthenticator.microsoft.com/v1.0/detect',
    apiKey: process.env.MICROSOFT_API_KEY
  }
};

// خدمة كشف الصور المحسنة مع التحليل المتقدم
export const detectImageManipulation = async (
  filePath: string,
  metadata: any
): Promise<AnalysisResult> => {
  const startTime = Date.now();
  
  try {
    // أولاً: تشغيل التحليل المتقدم المحلي
    const advancedResult = await performAdvancedImageAnalysis(filePath, metadata);
    
    // ثانياً: محاولة استخدام Hive AI إذا كان متوفراً
    let hiveResult: AnalysisResult | null = null;
    
    if (DETECTION_APIS.hive.apiKey) {
      try {
        const formData = new FormData();
        formData.append('media', fs.createReadStream(filePath));
        
        const response = await monitoredAPIRequest('hive-image', {
          method: 'POST',
          url: DETECTION_APIS.hive.endpoint,
          data: formData,
          headers: {
            'Authorization': `Token ${DETECTION_APIS.hive.apiKey}`,
            ...formData.getHeaders()
          },
          timeout: 30000
        });

        const hiveData = response.data;
        const hiveAIGenerated = hiveData.status?.[0]?.response?.output?.[0]?.classes?.some(
          (cls: any) => cls.class === 'ai_generated' && cls.score > 0.5
        ) || false;
        
        const hiveConfidence = hiveData.status?.[0]?.response?.output?.[0]?.classes?.find(
          (cls: any) => cls.class === 'ai_generated'
        )?.score || 0;

        hiveResult = {
          isAIGenerated: hiveAIGenerated,
          confidenceScore: Math.round(hiveConfidence * 100),
          detectionMethod: 'Hive AI',
          processingTime: 0,
          fileInfo: metadata,
          detectedFeatures: hiveAIGenerated ? ['Hive AI detection'] : [],
          explanation: ''
        };
      } catch (hiveError) {
        console.log('Hive AI غير متوفر، سيتم الاعتماد على التحليل المحلي');
      }
    }

    // دمج النتائج
    const combinedResult = combineAnalysisResults(advancedResult, hiveResult);
    combinedResult.processingTime = Date.now() - startTime;

    return combinedResult;

  } catch (error: any) {
    console.error('خطأ في كشف الصور:', error);
    return await fallbackImageAnalysis(filePath, metadata, Date.now() - startTime);
  }
};

// دمج نتائج التحليل المتعددة للصور
const combineAnalysisResults = (
  advancedResult: AnalysisResult,
  hiveResult: AnalysisResult | null
): AnalysisResult => {
  if (!hiveResult) {
    return advancedResult;
  }

  // حساب متوسط مرجح للثقة
  const advancedWeight = 0.7; // وزن أكبر للتحليل المتقدم
  const hiveWeight = 0.3;
  
  const combinedConfidence = Math.round(
    (advancedResult.confidenceScore * advancedWeight) + 
    (hiveResult.confidenceScore * hiveWeight)
  );

  // تحديد النتيجة النهائية
  const isAIGenerated = combinedConfidence > 50;

  // دمج الميزات المكتشفة
  const combinedFeatures = [
    ...advancedResult.detectedFeatures || [],
    ...hiveResult.detectedFeatures || []
  ];

  let explanation = '';
  if (isAIGenerated) {
    explanation = `التحليل المتقدم والذكي اكتشف ${combinedFeatures.length} علامة مشبوهة`;
  } else {
    explanation = 'التحليل المتعدد المصادر لم يكشف علامات واضحة للتعديل';
  }

  return {
    isAIGenerated,
    confidenceScore: combinedConfidence,
    detectionMethod: 'Advanced Multi-Source Analysis (Local + Hive AI)',
    processingTime: advancedResult.processingTime,
    fileInfo: advancedResult.fileInfo,
    detectedFeatures: combinedFeatures,
    explanation
  };
};

// دمج نتائج التحليل المتعددة للفيديو
const combineVideoAnalysisResults = (
  advancedResult: AnalysisResult,
  deepwareResult: AnalysisResult | null
): AnalysisResult => {
  // إذا لم يكن هناك نتيجة من Deepware، استخدم النتيجة المحلية مباشرة
  if (!deepwareResult) {
    return advancedResult;
  }

  // إذا كانت نتيجة Deepware فاشلة أو بثقة 0، استخدم النتيجة المحلية
  if (deepwareResult.confidenceScore === 0 || deepwareResult.detectedFeatures?.includes('Deepware Scanner detection')) {
    return advancedResult;
  }

  // حساب متوسط مرجح للثقة
  const advancedWeight = 0.7; // وزن أكبر للتحليل المحلي
  const deepwareWeight = 0.3; // وزن أقل لـ Deepware Scanner
  
  const combinedConfidence = Math.round(
    (advancedResult.confidenceScore * advancedWeight) + 
    (deepwareResult.confidenceScore * deepwareWeight)
  );

  // تحديد النتيجة النهائية - إذا كان أي من التحليلين يشير للAI، اعتبره AI
  const isAIGenerated = advancedResult.isAIGenerated || deepwareResult.isAIGenerated || combinedConfidence > 50;

  // دمج الميزات المكتشفة
  const combinedFeatures = [
    ...advancedResult.detectedFeatures || [],
    ...deepwareResult.detectedFeatures || []
  ];

  let explanation = '';
  if (isAIGenerated) {
    explanation = `التحليل المتقدم للفيديو اكتشف ${combinedFeatures.length} علامة مشبوهة تشير لتقنية Deepfake`;
  } else {
    explanation = 'التحليل المتعدد المصادر للفيديو لم يكشف علامات واضحة للتعديل';
  }

  return {
    isAIGenerated,
    confidenceScore: Math.max(combinedConfidence, advancedResult.confidenceScore), // استخدم الثقة الأعلى
    detectionMethod: deepwareResult ? 'Advanced Multi-Source Video Analysis (Local + Deepware)' : 'Advanced Local Video Analysis',
    processingTime: advancedResult.processingTime,
    fileInfo: advancedResult.fileInfo,
    detectedFeatures: combinedFeatures,
    explanation
  };
};

// دمج نتائج التحليل المتعددة للصوت
const combineAudioAnalysisResults = (
  advancedResult: AnalysisResult,
  hiveResult: AnalysisResult | null
): AnalysisResult => {
  if (!hiveResult) {
    return advancedResult;
  }

  // حساب متوسط مرجح للثقة
  const advancedWeight = 0.65; // وزن للتحليل المتقدم المحلي
  const hiveWeight = 0.35; // وزن لـ Hive AI
  
  const combinedConfidence = Math.round(
    (advancedResult.confidenceScore * advancedWeight) + 
    (hiveResult.confidenceScore * hiveWeight)
  );

  // تحديد النتيجة النهائية
  const isAIGenerated = combinedConfidence > 50;

  // دمج الميزات المكتشفة
  const combinedFeatures = [
    ...advancedResult.detectedFeatures || [],
    ...hiveResult.detectedFeatures || []
  ];

  let explanation = '';
  if (isAIGenerated) {
    explanation = `التحليل المتقدم للصوت اكتشف ${combinedFeatures.length} علامة مشبوهة تشير للتوليد الاصطناعي`;
  } else {
    explanation = 'التحليل المتعدد المصادر للصوت لم يكشف علامات واضحة للتوليد الاصطناعي';
  }

  return {
    isAIGenerated,
    confidenceScore: combinedConfidence,
    detectionMethod: 'Advanced Multi-Source Audio Analysis (Local + Hive AI)',
    processingTime: advancedResult.processingTime,
    fileInfo: advancedResult.fileInfo,
    detectedFeatures: combinedFeatures,
    explanation
  };
};

// خدمة كشف الفيديو المحسنة مع التحليل المتقدم
export const detectVideoManipulation = async (
  filePath: string,
  metadata: any
): Promise<AnalysisResult> => {
  const startTime = Date.now();
  
  try {
    // استخدام التحليل المبسط مباشرة (لأن ffmpeg غير متوفر)
    let advancedResult: AnalysisResult;
    
    // تحقق من توفر ffmpeg
    const useAdvancedAnalysis = process.env.FFMPEG_AVAILABLE === 'true';
    
    if (useAdvancedAnalysis) {
      try {
        advancedResult = await performAdvancedVideoAnalysis(filePath, metadata);
      } catch (advancedError: any) {
        console.log('فشل التحليل المتقدم للفيديو، سيتم استخدام التحليل المبسط:', advancedError.message);
        advancedResult = await performSimpleVideoAnalysis(filePath, metadata);
      }
    } else {
      console.log('استخدام التحليل المبسط للفيديو (ffmpeg غير متوفر)');
      advancedResult = await performSimpleVideoAnalysis(filePath, metadata);
    }
    
    // ثانياً: محاولة استخدام Deepware Scanner إذا كان متوفراً (تعطيل مؤقت)
    let deepwareResult: AnalysisResult | null = null;
    
    // تعطيل Deepware مؤقتاً لأنه يسبب مشاكل في نسبة الثقة
    const useDeepware = false; // process.env.USE_DEEPWARE === 'true';
    
    if (useDeepware) {
      try {
        const formData = new FormData();
        formData.append('video', fs.createReadStream(filePath));
        
        const response = await monitoredAPIRequest('deepware-video', {
          method: 'POST',
          url: DETECTION_APIS.deepware.endpoint,
          data: formData,
          headers: formData.getHeaders(),
          timeout: 60000 // دقيقة واحدة للفيديو
        });

        const result = response.data;
        const deepwareAIGenerated = result.fake_probability > 0.5;
        const deepwareConfidence = Math.round(result.fake_probability * 100);

        deepwareResult = {
          isAIGenerated: deepwareAIGenerated,
          confidenceScore: deepwareConfidence,
          detectionMethod: 'Deepware Scanner',
          processingTime: 0,
          fileInfo: metadata,
          detectedFeatures: deepwareAIGenerated ? ['Deepware Scanner detection'] : [],
          explanation: ''
        };
      } catch (deepwareError) {
        console.log('Deepware Scanner غير متوفر، سيتم الاعتماد على التحليل المحلي');
      }
    } else {
      console.log('Deepware Scanner معطل، سيتم استخدام التحليل المحلي فقط');
    }

    // دمج النتائج
    const combinedResult = combineVideoAnalysisResults(advancedResult, deepwareResult);
    combinedResult.processingTime = Date.now() - startTime;

    return combinedResult;

  } catch (error: any) {
    console.error('خطأ في كشف الفيديو:', error);
    // استخدام التحليل المبسط كبديل
    try {
      return await performSimpleVideoAnalysis(filePath, metadata);
    } catch (simpleError: any) {
      console.error('فشل أيضاً في التحليل المبسط:', simpleError);
      return await fallbackVideoAnalysis(filePath, metadata, Date.now() - startTime);
    }
  }
};

// خدمة كشف الصوت المحسنة مع التحليل المتقدم
export const detectAudioManipulation = async (
  filePath: string,
  metadata: any
): Promise<AnalysisResult> => {
  const startTime = Date.now();
  
  try {
    // أولاً: تشغيل التحليل المتقدم المحلي
    const advancedResult = await performAdvancedAudioAnalysis(filePath, metadata);
    
    // ثانياً: محاولة استخدام Hive AI إذا كان متوفراً
    let hiveResult: AnalysisResult | null = null;
    
    if (DETECTION_APIS.hive.apiKey) {
      try {
        const formData = new FormData();
        formData.append('media', fs.createReadStream(filePath));
        
        const response = await monitoredAPIRequest('hive-audio', {
          method: 'POST',
          url: DETECTION_APIS.hive.endpoint,
          data: formData,
          headers: {
            'Authorization': `Token ${DETECTION_APIS.hive.apiKey}`,
            ...formData.getHeaders()
          },
          timeout: 45000 // 45 ثانية
        });

        const hiveData = response.data;
        const hiveAIGenerated = hiveData.status?.[0]?.response?.output?.[0]?.classes?.some(
          (cls: any) => cls.class === 'synthetic_speech' && cls.score > 0.5
        ) || false;
        
        const hiveConfidence = hiveData.status?.[0]?.response?.output?.[0]?.classes?.find(
          (cls: any) => cls.class === 'synthetic_speech'
        )?.score || 0;

        hiveResult = {
          isAIGenerated: hiveAIGenerated,
          confidenceScore: Math.round(hiveConfidence * 100),
          detectionMethod: 'Hive AI',
          processingTime: 0,
          fileInfo: metadata,
          detectedFeatures: hiveAIGenerated ? ['Hive AI synthetic speech detection'] : [],
          explanation: ''
        };
      } catch (hiveError) {
        console.log('Hive AI غير متوفر، سيتم الاعتماد على التحليل المحلي');
      }
    }

    // دمج النتائج
    const combinedResult = combineAudioAnalysisResults(advancedResult, hiveResult);
    combinedResult.processingTime = Date.now() - startTime;

    return combinedResult;

  } catch (error: any) {
    console.error('خطأ في كشف الصوت:', error);
    return await fallbackAudioAnalysis(filePath, metadata, Date.now() - startTime);
  }
};

// تحليل بديل للصور (تحليل البيانات الوصفية والأنماط الأساسية)
const fallbackImageAnalysis = async (
  filePath: string,
  metadata: any,
  processingTime: number
): Promise<AnalysisResult> => {
  // تحليل بسيط للبيانات الوصفية والحجم
  const stats = fs.statSync(filePath);
  const suspiciousFactors = [];
  
  // فحص حجم الملف (الصور المولدة بالAI غالباً ما تكون بأحجام معينة)
  if (stats.size < 50000) suspiciousFactors.push('حجم ملف صغير جداً');
  if (metadata.name.includes('generated') || metadata.name.includes('ai')) {
    suspiciousFactors.push('اسم الملف يشير للتوليد');
  }
  
  const isAIGenerated = suspiciousFactors.length > 0;
  const confidenceScore = suspiciousFactors.length * 30; // تقدير بسيط

  return {
    isAIGenerated,
    confidenceScore: Math.min(confidenceScore, 85), // حد أقصى 85% للتحليل البديل
    detectionMethod: 'Fallback Analysis - Metadata & Pattern Check',
    processingTime,
    fileInfo: metadata,
    detectedFeatures: suspiciousFactors,
    explanation: isAIGenerated 
      ? 'تم اكتشاف بعض العلامات المشبوهة (تحليل أساسي)'
      : 'لم يتم اكتشاف علامات واضحة (تحليل أساسي)'
  };
};

// تحليل بديل للفيديو
const fallbackVideoAnalysis = async (
  filePath: string,
  metadata: any,
  processingTime: number
): Promise<AnalysisResult> => {
  const stats = fs.statSync(filePath);
  const suspiciousFactors = [];
  
  if (stats.size < 1000000) suspiciousFactors.push('حجم فيديو صغير جداً');
  if (metadata.name.toLowerCase().includes('deepfake')) {
    suspiciousFactors.push('اسم الملف يشير للتعديل');
  }
  
  const isAIGenerated = suspiciousFactors.length > 0;
  const confidenceScore = suspiciousFactors.length * 25;

  return {
    isAIGenerated,
    confidenceScore: Math.min(confidenceScore, 75),
    detectionMethod: 'Fallback Analysis - Basic Video Check',
    processingTime,
    fileInfo: metadata,
    detectedFeatures: suspiciousFactors,
    explanation: isAIGenerated 
      ? 'تم اكتشاف بعض العلامات المشبوهة (تحليل أساسي)'
      : 'لم يتم اكتشاف علامات واضحة (تحليل أساسي)'
  };
};

// تحليل بديل للصوت
const fallbackAudioAnalysis = async (
  filePath: string,
  metadata: any,
  processingTime: number
): Promise<AnalysisResult> => {
  const stats = fs.statSync(filePath);
  const suspiciousFactors = [];
  
  if (stats.size < 100000) suspiciousFactors.push('حجم ملف صوتي صغير جداً');
  if (metadata.name.toLowerCase().includes('synthetic') || 
      metadata.name.toLowerCase().includes('tts')) {
    suspiciousFactors.push('اسم الملف يشير للتوليد الصناعي');
  }
  
  const isAIGenerated = suspiciousFactors.length > 0;
  const confidenceScore = suspiciousFactors.length * 35;

  return {
    isAIGenerated,
    confidenceScore: Math.min(confidenceScore, 80),
    detectionMethod: 'Fallback Analysis - Basic Audio Check',
    processingTime,
    fileInfo: metadata,
    detectedFeatures: suspiciousFactors,
    explanation: isAIGenerated 
      ? 'تم اكتشاف بعض العلامات المشبوهة (تحليل أساسي)'
      : 'لم يتم اكتشاف علامات واضحة (تحليل أساسي)'
  };
};

// الدالة الرئيسية للكشف حسب نوع الملف مع معالجة أخطاء محسنة وتخزين مؤقت
export const analyzeFile = async (
  filePath: string,
  fileType: FileType,
  metadata: any
): Promise<AnalysisResult> => {
  console.log(`بدء تحليل ملف ${fileType}: ${metadata.name}`);
  
  try {
    // إنشاء مفتاح التخزين المؤقت
    const fileStats = await fs.promises.stat(filePath);
    const cacheKey = generateCacheKey(filePath, fileStats.size, fileStats.mtime.getTime());
    
    // فحص التخزين المؤقت أولاً
    const cachedResult = await getCachedResult(cacheKey);
    if (cachedResult) {
      console.log(`استخدام النتيجة المحفوظة مسبقاً للملف: ${metadata.name}`);
      return cachedResult;
    }

    // تحسين الملف للتحليل السريع
    const optimizationResult = await optimizeForAnalysis(filePath, fileType);
    const analysisPath = optimizationResult.optimizedPath;
    
    console.log(`تحليل الملف: ${optimizationResult.isOptimized ? 'محسن' : 'أصلي'} - الحجم: ${optimizationResult.optimizedSize} bytes`);

    // استخدام إعادة المحاولة مع تسجيل الأخطاء
    const result = await retryWithLogging(
      async () => {
        switch (fileType) {
          case 'image':
            return await detectImageManipulation(analysisPath, metadata);
          case 'video':
            return await detectVideoManipulation(analysisPath, metadata);
          case 'audio':
            return await detectAudioManipulation(analysisPath, metadata);
          default:
            throw createError(
              'نوع ملف غير مدعوم للتحليل', 
              400, 
              'UNSUPPORTED_FILE_TYPE',
              ErrorType.VALIDATION_ERROR,
              { fileType, fileName: metadata.name }
            );
        }
      },
      2, // محاولتان فقط
      2000, // انتظار ثانيتان بين المحاولات
      ErrorType.FILE_PROCESSING,
      { fileType, fileName: metadata.name, fileSize: metadata.size }
    );

    // حفظ النتيجة في التخزين المؤقت
    await cacheResult(cacheKey, result);

    // تنظيف الملف المحسن إذا كان مؤقتاً
    if (optimizationResult.isOptimized && analysisPath !== filePath) {
      try {
        await fs.promises.unlink(analysisPath);
      } catch (cleanupError) {
        console.warn('تحذير: فشل في حذف الملف المحسن المؤقت:', cleanupError);
      }
    }

    return result;

  } catch (error: any) {
    // تسجيل الخطأ النهائي
    await logError(
      ErrorType.FILE_PROCESSING,
      'ANALYSIS_FAILED',
      error,
      { fileType, fileName: metadata.name, fileSize: metadata.size }
    );

    throw createError(
      'فشل في تحليل الملف',
      500,
      'ANALYSIS_FAILED',
      ErrorType.FILE_PROCESSING,
      { fileType, fileName: metadata.name, originalError: error.message }
    );
  }
};