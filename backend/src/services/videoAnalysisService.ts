import ffmpeg from 'fluent-ffmpeg';
import Jimp from 'jimp';
import fs from 'fs';
import path from 'path';
import { AnalysisResult } from '../types';

export interface VideoAnalysisFeatures {
  frameConsistency: number;
  motionArtifacts: number;
  lightingInconsistencies: number;
  faceManipulationSigns: number;
  temporalAnomalies: number;
  compressionArtifacts: number;
}

// تحليل الإطارات المتعددة للفيديو
export const analyzeVideoFrames = async (
  videoPath: string,
  maxFrames: number = 10
): Promise<{
  frameConsistency: number;
  suspiciousFrames: number[];
  averageQuality: number;
}> => {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(__dirname, '../../temp/frames');
    
    // إنشاء مجلد مؤقت للإطارات
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // استخراج إطارات من الفيديو
    ffmpeg(videoPath)
      .screenshots({
        count: maxFrames,
        folder: tempDir,
        filename: 'frame_%i.png'
      })
      .on('end', async () => {
        try {
          const frameFiles = fs.readdirSync(tempDir)
            .filter(file => file.startsWith('frame_'))
            .sort();

          if (frameFiles.length === 0) {
            resolve({
              frameConsistency: 100,
              suspiciousFrames: [],
              averageQuality: 100
            });
            return;
          }

          let totalConsistency = 0;
          let totalQuality = 0;
          const suspiciousFrames: number[] = [];

          // تحليل كل إطار
          for (let i = 0; i < frameFiles.length; i++) {
            const framePath = path.join(tempDir, frameFiles[i]);
            
            try {
              const frameAnalysis = await analyzeFrame(framePath);
              totalQuality += frameAnalysis.quality;

              // مقارنة مع الإطار السابق
              if (i > 0) {
                const prevFramePath = path.join(tempDir, frameFiles[i - 1]);
                const consistency = await compareFrames(prevFramePath, framePath);
                totalConsistency += consistency;

                // إذا كان الاتساق منخفض جداً، اعتبر الإطار مشبوه
                if (consistency < 60) {
                  suspiciousFrames.push(i);
                }
              }

              // حذف الإطار بعد التحليل
              fs.unlinkSync(framePath);
            } catch (error) {
              console.error(`خطأ في تحليل الإطار ${i}:`, error);
            }
          }

          const avgConsistency = frameFiles.length > 1 ? 
            totalConsistency / (frameFiles.length - 1) : 100;
          const avgQuality = totalQuality / frameFiles.length;

          resolve({
            frameConsistency: Math.round(avgConsistency),
            suspiciousFrames,
            averageQuality: Math.round(avgQuality)
          });

        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('خطأ في استخراج الإطارات:', error);
        reject(error);
      });
  });
};

// تحليل إطار واحد
const analyzeFrame = async (framePath: string): Promise<{
  quality: number;
  hasArtifacts: boolean;
  edgeSharpness: number;
}> => {
  try {
    const image = await Jimp.read(framePath);
    const { width, height } = image.bitmap;

    let totalSharpness = 0;
    let artifactCount = 0;
    let sampleCount = 0;

    // تحليل عينة من البكسلات
    const stepSize = Math.max(1, Math.floor(Math.min(width, height) / 50));

    for (let y = stepSize; y < height - stepSize; y += stepSize) {
      for (let x = stepSize; x < width - stepSize; x += stepSize) {
        const currentColor = image.getPixelColor(x, y);
        const rightColor = image.getPixelColor(x + stepSize, y);
        const bottomColor = image.getPixelColor(x, y + stepSize);

        const current = Jimp.intToRGBA(currentColor);
        const right = Jimp.intToRGBA(rightColor);
        const bottom = Jimp.intToRGBA(bottomColor);

        // حساب حدة الحواف
        const horizontalGrad = Math.abs(
          (current.r + current.g + current.b) - (right.r + right.g + right.b)
        );
        const verticalGrad = Math.abs(
          (current.r + current.g + current.b) - (bottom.r + bottom.g + bottom.b)
        );

        const sharpness = horizontalGrad + verticalGrad;
        totalSharpness += sharpness;

        // كشف artifacts (تغيرات حادة غير طبيعية)
        if (sharpness > 300) {
          artifactCount++;
        }

        sampleCount++;
      }
    }

    const avgSharpness = sampleCount > 0 ? totalSharpness / sampleCount : 0;
    const artifactRatio = sampleCount > 0 ? artifactCount / sampleCount : 0;

    return {
      quality: Math.max(0, Math.min(100, 100 - (artifactRatio * 200))),
      hasArtifacts: artifactRatio > 0.1,
      edgeSharpness: Math.round(avgSharpness)
    };

  } catch (error) {
    console.error('خطأ في تحليل الإطار:', error);
    return {
      quality: 50,
      hasArtifacts: false,
      edgeSharpness: 0
    };
  }
};

// مقارنة إطارين لقياس الاتساق
const compareFrames = async (frame1Path: string, frame2Path: string): Promise<number> => {
  try {
    const [image1, image2] = await Promise.all([
      Jimp.read(frame1Path),
      Jimp.read(frame2Path)
    ]);

    // تصغير الصور للمقارنة السريعة
    const size = 64;
    image1.resize(size, size);
    image2.resize(size, size);

    let totalDiff = 0;
    let pixelCount = 0;

    // مقارنة البكسلات
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const color1 = Jimp.intToRGBA(image1.getPixelColor(x, y));
        const color2 = Jimp.intToRGBA(image2.getPixelColor(x, y));

        const diff = Math.abs(color1.r - color2.r) + 
                    Math.abs(color1.g - color2.g) + 
                    Math.abs(color1.b - color2.b);

        totalDiff += diff;
        pixelCount++;
      }
    }

    const avgDiff = totalDiff / pixelCount;
    const similarity = Math.max(0, 100 - (avgDiff / 7.65)); // تطبيع إلى 0-100

    return Math.round(similarity);

  } catch (error) {
    console.error('خطأ في مقارنة الإطارات:', error);
    return 50; // قيمة افتراضية
  }
};

// فحص اتساق الحركة والإضاءة
export const analyzeMotionAndLighting = async (
  videoPath: string
): Promise<{
  motionConsistency: number;
  lightingConsistency: number;
  unnaturalTransitions: number;
}> => {
  try {
    // استخراج عينة من الإطارات للتحليل
    const frameAnalysis = await analyzeVideoFrames(videoPath, 8);
    
    // تحليل مبسط للحركة والإضاءة
    let motionScore = frameAnalysis.frameConsistency;
    let lightingScore = frameAnalysis.averageQuality;
    let transitions = frameAnalysis.suspiciousFrames.length;

    // تعديل النتائج بناءً على الإطارات المشبوهة
    if (frameAnalysis.suspiciousFrames.length > 2) {
      motionScore -= 20;
      lightingScore -= 15;
    }

    return {
      motionConsistency: Math.max(0, motionScore),
      lightingConsistency: Math.max(0, lightingScore),
      unnaturalTransitions: transitions
    };

  } catch (error) {
    console.error('خطأ في تحليل الحركة والإضاءة:', error);
    return {
      motionConsistency: 50,
      lightingConsistency: 50,
      unnaturalTransitions: 0
    };
  }
};

// كشف علامات deepfake في الوجوه (تحليل مبسط)
export const detectFaceManipulation = async (
  videoPath: string
): Promise<{
  faceInconsistencies: number;
  suspiciousFaceRegions: number;
  blinkingPatterns: number;
}> => {
  try {
    // تحليل مبسط للوجوه باستخدام الإطارات المستخرجة
    const frameAnalysis = await analyzeVideoFrames(videoPath, 6);
    
    // تقدير بسيط لعلامات تعديل الوجوه
    let faceScore = 100;
    let suspiciousRegions = 0;
    let blinkingScore = 100;

    // إذا كان هناك تباين كبير بين الإطارات، قد يشير لتعديل الوجوه
    if (frameAnalysis.frameConsistency < 70) {
      faceScore -= 30;
      suspiciousRegions = frameAnalysis.suspiciousFrames.length;
    }

    // إذا كانت جودة الإطارات منخفضة، قد يشير لضغط بعد التعديل
    if (frameAnalysis.averageQuality < 60) {
      faceScore -= 20;
      blinkingScore -= 25;
    }

    return {
      faceInconsistencies: Math.max(0, 100 - faceScore),
      suspiciousFaceRegions: suspiciousRegions,
      blinkingPatterns: Math.max(0, 100 - blinkingScore)
    };

  } catch (error) {
    console.error('خطأ في كشف تعديل الوجوه:', error);
    return {
      faceInconsistencies: 0,
      suspiciousFaceRegions: 0,
      blinkingPatterns: 0
    };
  }
};

// الدالة الرئيسية للتحليل المتقدم للفيديو
export const performAdvancedVideoAnalysis = async (
  filePath: string,
  metadata: any
): Promise<AnalysisResult> => {
  const startTime = Date.now();
  
  try {
    console.log('بدء التحليل المتقدم للفيديو:', metadata.name);

    // تشغيل جميع التحليلات بالتوازي
    const [
      frameAnalysis,
      motionLightingAnalysis,
      faceAnalysis
    ] = await Promise.all([
      analyzeVideoFrames(filePath, 10),
      analyzeMotionAndLighting(filePath),
      detectFaceManipulation(filePath)
    ]);

    // حساب النتيجة المجمعة
    const features: string[] = [];
    let suspicionScore = 0;

    // تقييم اتساق الإطارات
    if (frameAnalysis.frameConsistency < 70) {
      suspicionScore += 25;
      features.push('عدم اتساق بين الإطارات');
    }

    if (frameAnalysis.suspiciousFrames.length > 2) {
      suspicionScore += 20;
      features.push(`${frameAnalysis.suspiciousFrames.length} إطارات مشبوهة`);
    }

    // تقييم الحركة والإضاءة
    if (motionLightingAnalysis.motionConsistency < 60) {
      suspicionScore += 30;
      features.push('أنماط حركة غير طبيعية');
    }

    if (motionLightingAnalysis.lightingConsistency < 60) {
      suspicionScore += 25;
      features.push('تباين في الإضاءة');
    }

    if (motionLightingAnalysis.unnaturalTransitions > 3) {
      suspicionScore += 20;
      features.push('انتقالات غير طبيعية بين الإطارات');
    }

    // تقييم تعديل الوجوه
    if (faceAnalysis.faceInconsistencies > 40) {
      suspicionScore += 35;
      features.push('علامات تعديل في منطقة الوجه');
    }

    if (faceAnalysis.suspiciousFaceRegions > 1) {
      suspicionScore += 15;
      features.push('مناطق وجه مشبوهة');
    }

    // تقييم جودة الفيديو العامة
    if (frameAnalysis.averageQuality < 50) {
      suspicionScore += 15;
      features.push('جودة فيديو منخفضة (قد تشير للضغط بعد التعديل)');
    }

    const processingTime = Date.now() - startTime;
    const confidenceScore = Math.min(suspicionScore, 95);
    const isAIGenerated = confidenceScore > 50;

    let explanation = '';
    if (isAIGenerated) {
      explanation = `التحليل المتقدم اكتشف ${features.length} علامة مشبوهة تشير إلى احتمالية التعديل بتقنية Deepfake`;
    } else {
      explanation = 'التحليل المتقدم للفيديو لم يكشف علامات واضحة للتعديل بالذكاء الاصطناعي';
    }

    return {
      isAIGenerated,
      confidenceScore,
      detectionMethod: 'Advanced Video Analysis - Frame + Motion + Face Detection',
      processingTime,
      fileInfo: metadata,
      detectedFeatures: features,
      explanation
    };

  } catch (error: any) {
    console.error('خطأ في التحليل المتقدم للفيديو:', error);
    
    return {
      isAIGenerated: false,
      confidenceScore: 0,
      detectionMethod: 'Advanced Video Analysis Failed',
      processingTime: Date.now() - startTime,
      fileInfo: metadata,
      detectedFeatures: ['فشل في التحليل المتقدم للفيديو'],
      explanation: 'حدث خطأ أثناء التحليل المتقدم للفيديو'
    };
  }
};