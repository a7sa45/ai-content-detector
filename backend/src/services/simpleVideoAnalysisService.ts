import fs from 'fs';
import path from 'path';
import { AnalysisResult } from '../types';

// تحليل فيديو مبسط بدون ffmpeg
export const performSimpleVideoAnalysis = async (
  filePath: string,
  metadata: any
): Promise<AnalysisResult> => {
  const startTime = Date.now();
  
  try {
    console.log('بدء التحليل المبسط للفيديو:', metadata.name);

    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    const fileName = metadata.name.toLowerCase();
    const nameLength = path.basename(fileName, path.extname(fileName)).length;
    
    // حساب النتيجة المجمعة
    const features: string[] = [];
    let suspicionScore = 0;

    // تحليل اسم الملف
    const suspiciousKeywords = [
      'deepfake', 'faceswap', 'generated', 'ai', 'synthetic', 'fake',
      'swap', 'morph', 'artificial', 'bot', 'avatar', 'virtual', 'sora',
      'runway', 'pika', 'stable', 'diffusion', 'midjourney', 'dall'
    ];
    
    const hasSuspiciousName = suspiciousKeywords.some(keyword => 
      fileName.includes(keyword)
    );
    
    if (hasSuspiciousName) {
      suspicionScore += 60; // زيادة النقاط للكلمات المشبوهة
      features.push('اسم الملف يحتوي على كلمات مشبوهة');
    }

    // فحص إضافي للأسماء التي تحتوي على أرقام عشوائية (نمط شائع في AI)
    const hasRandomNumbers = /\d{4,}/.test(fileName); // 4 أرقام متتالية أو أكثر
    if (hasRandomNumbers && nameLength < 15) {
      suspicionScore += 15;
      features.push('اسم ملف يحتوي على أرقام عشوائية');
    }

    // تحليل حجم الملف
    if (fileSize < 1000000) { // أقل من 1MB
      suspicionScore += 20;
      features.push('حجم فيديو صغير جداً');
    } else if (fileSize > 100000000) { // أكبر من 100MB
      suspicionScore += 10;
      features.push('حجم فيديو كبير جداً');
    }

    // تحليل امتداد الملف
    const extension = path.extname(fileName);
    const commonExtensions = ['.mp4', '.avi', '.mov', '.mkv'];
    
    if (!commonExtensions.includes(extension)) {
      suspicionScore += 15;
      features.push('امتداد ملف غير شائع');
    }

    // تحليل نسبة الحجم إلى الاسم (ملفات AI غالباً ما تكون بأسماء قصيرة وأحجام محددة)
    if (nameLength < 5 && fileSize > 10000000) {
      suspicionScore += 15;
      features.push('نسبة غير طبيعية بين اسم الملف وحجمه');
    }

    // تحليل وقت الإنشاء
    const creationTime = stats.birthtime;
    const modificationTime = stats.mtime;
    
    if (Math.abs(creationTime.getTime() - modificationTime.getTime()) < 1000) {
      // إذا كان وقت الإنشاء والتعديل متطابقان تقريباً
      suspicionScore += 10;
      features.push('أوقات إنشاء وتعديل متطابقة (قد يشير للتوليد)');
    }

    // تحليل نوع MIME
    if (metadata.type) {
      const mimeType = metadata.type.toLowerCase();
      
      // بعض أنواع MIME قد تشير لملفات مولدة
      if (mimeType.includes('quicktime') && fileSize < 5000000) {
        suspicionScore += 15;
        features.push('نوع MIME وحجم مشبوه');
      }
    }

    // تحليل البيانات الثنائية الأولية (أول 1KB)
    try {
      const buffer = Buffer.alloc(1024);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, 1024, 0);
      fs.closeSync(fd);

      // فحص أنماط مشبوهة في البداية
      const headerString = buffer.toString('hex');
      
      // بعض الأنماط التي قد تشير لملفات مولدة أو معدلة
      const suspiciousPatterns = [
        'ffff', // padding مشبوه
        '0000000000000000', // zeros كثيرة
      ];

      let patternMatches = 0;
      suspiciousPatterns.forEach(pattern => {
        if (headerString.includes(pattern)) {
          patternMatches++;
        }
      });

      if (patternMatches > 1) {
        suspicionScore += 20;
        features.push('أنماط مشبوهة في بداية الملف');
      }

    } catch (error) {
      // تجاهل أخطاء قراءة البيانات الثنائية
    }

    // تحليل إضافي بناءً على البيانات الوصفية
    if (metadata.duration !== undefined) {
      if (metadata.duration < 5) { // أقل من 5 ثوان
        suspicionScore += 35; // زيادة النقاط للفيديوهات القصيرة
        features.push('مدة فيديو قصيرة جداً (نمط شائع في AI)');
      } else if (metadata.duration > 600) { // أكثر من 10 دقائق
        suspicionScore += 10;
        features.push('مدة فيديو طويلة');
      }
    }

    // تحليل خاص للفيديوهات عالية الدقة بأحجام صغيرة (ضغط متقدم = AI محتمل)
    if (fileSize < 10000000 && metadata.dimensions) { // أقل من 10MB
      const { width = 0, height = 0 } = metadata.dimensions;
      if (width > 720 || height > 720) {
        suspicionScore += 20;
        features.push('نسبة ضغط عالية مع دقة عالية (مشبوه)');
      }
    }

    // فحص نمط الأسماء الافتراضية للأدوات
    const defaultPatterns = [
      /^video_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/, // video_2024-01-01_12-30-45
      /^output_\d+/, // output_123
      /^render_\d+/, // render_456
      /^generated_\d+/, // generated_789
      /^ai_video_\d+/ // ai_video_123
    ];

    const hasDefaultPattern = defaultPatterns.some(pattern => pattern.test(fileName));
    if (hasDefaultPattern) {
      suspicionScore += 40;
      features.push('نمط اسم افتراضي لأدوات التوليد');
    }

    // حساب النتيجة النهائية
    const processingTime = Date.now() - startTime;
    const confidenceScore = Math.min(suspicionScore, 95);
    
    // إذا كان هناك 3 ميزات مشبوهة أو أكثر، اعتبره AI
    const isAIGenerated = confidenceScore > 40 || features.length >= 3;

    // تسجيل النتائج للتشخيص
    console.log(`تحليل الفيديو: ${metadata.name}`);
    console.log(`نقاط الشك: ${suspicionScore}`);
    console.log(`عدد الميزات: ${features.length}`);
    console.log(`الميزات: ${features.join(', ')}`);
    console.log(`نسبة الثقة: ${confidenceScore}%`);
    console.log(`النتيجة: ${isAIGenerated ? 'مولد بالAI' : 'طبيعي'}`);

    let explanation = '';
    if (isAIGenerated) {
      explanation = `التحليل المبسط للفيديو اكتشف ${features.length} علامة مشبوهة تشير إلى احتمالية التعديل بالذكاء الاصطناعي`;
    } else {
      explanation = 'التحليل المبسط للفيديو لم يكشف علامات واضحة للتعديل بالذكاء الاصطناعي';
    }

    // تحليل إضافي للفيديوهات المولدة بالAI
    const aiKeywords = ['ai', 'generated', 'deepfake', 'synthetic', 'artificial'];
    const hasAIKeywords = aiKeywords.some(keyword => fileName.includes(keyword));
    
    if (hasAIKeywords) {
      return {
        isAIGenerated: true,
        confidenceScore: Math.max(confidenceScore, 85),
        detectionMethod: 'Simple Video Analysis - AI Keyword Detection',
        processingTime,
        fileInfo: metadata,
        detectedFeatures: [...features, 'اسم الملف يشير بوضوح للتوليد بالذكاء الاصطناعي'],
        explanation: 'اسم الملف يحتوي على كلمات تشير بوضوح إلى أنه مولد بالذكاء الاصطناعي'
      };
    }

    // تحليل خاص للفيديوهات القصيرة عالية الجودة (نمط شائع في AI)
    if (fileSize > 5000000 && fileSize < 20000000 && nameLength < 10) {
      suspicionScore += 20;
      features.push('نمط حجم وتسمية مشبوه (نمط شائع في فيديوهات AI)');
    }

    return {
      isAIGenerated,
      confidenceScore,
      detectionMethod: 'Simple Video Analysis - File Properties & Metadata',
      processingTime,
      fileInfo: metadata,
      detectedFeatures: features,
      explanation
    };

  } catch (error: any) {
    console.error('خطأ في التحليل المبسط للفيديو:', error);
    
    return {
      isAIGenerated: false,
      confidenceScore: 0,
      detectionMethod: 'Simple Video Analysis Failed',
      processingTime: Date.now() - startTime,
      fileInfo: metadata,
      detectedFeatures: ['فشل في التحليل المبسط للفيديو'],
      explanation: 'حدث خطأ أثناء التحليل المبسط للفيديو'
    };
  }
};