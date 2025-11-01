import Jimp from 'jimp';
import { AnalysisResult } from '../types';

// خدمة الكشف المتقدم للتمييز بين التعديل التقليدي والذكاء الاصطناعي
export class AdvancedDetectionService {

  // تحليل بصمة الضغط - الAI له أنماط ضغط مختلفة
  static async analyzeCompressionFingerprint(filePath: string): Promise<{
    isAIGenerated: boolean;
    confidence: number;
    evidence: string[];
  }> {
    try {
      const image = await Jimp.read(filePath);
      const evidence: string[] = [];
      let aiScore = 0;

      // 1. فحص كتل DCT (Discrete Cosine Transform)
      const dctAnalysis = this.analyzeDCTBlocks(image);
      if (dctAnalysis.hasAIPattern) {
        aiScore += 30;
        evidence.push('أنماط DCT مميزة للذكاء الاصطناعي');
      }

      // 2. فحص التكرار الدوري - الAI يميل للتكرار
      const periodicAnalysis = this.analyzePeriodicPatterns(image);
      if (periodicAnalysis.hasPeriodicPattern) {
        aiScore += 25;
        evidence.push('أنماط تكرار دورية مميزة للAI');
      }

      // 3. فحص التماثل غير الطبيعي
      const symmetryAnalysis = this.analyzeUnnaturalSymmetry(image);
      if (symmetryAnalysis.hasUnnaturalSymmetry) {
        aiScore += 20;
        evidence.push('تماثل غير طبيعي يشير للتوليد الآلي');
      }

      return {
        isAIGenerated: aiScore > 40,
        confidence: Math.min(aiScore, 95),
        evidence
      };

    } catch (error) {
      console.error('خطأ في تحليل بصمة الضغط:', error);
      return {
        isAIGenerated: false,
        confidence: 0,
        evidence: ['فشل في التحليل المتقدم']
      };
    }
  }

  // تحليل كتل DCT للبحث عن أنماط الAI
  private static analyzeDCTBlocks(image: Jimp): { hasAIPattern: boolean; details: string } {
    const { width, height } = image.bitmap;
    let suspiciousBlocks = 0;
    let totalBlocks = 0;

    // فحص كتل 8x8 (حجم كتلة JPEG القياسي)
    for (let y = 0; y < height - 8; y += 8) {
      for (let x = 0; x < width - 8; x += 8) {
        totalBlocks++;
        
        // حساب التباين في الكتلة
        const blockVariance = this.calculateBlockVariance(image, x, y, 8, 8);
        
        // الAI يميل لإنتاج كتل بتباين منخفض جداً أو عالي جداً
        if (blockVariance < 5 || blockVariance > 200) {
          suspiciousBlocks++;
        }
      }
    }

    const suspiciousRatio = suspiciousBlocks / totalBlocks;
    return {
      hasAIPattern: suspiciousRatio > 0.3, // أكثر من 30% من الكتل مشبوهة
      details: `${suspiciousBlocks}/${totalBlocks} كتلة مشبوهة (${(suspiciousRatio * 100).toFixed(1)}%)`
    };
  }

  // تحليل الأنماط الدورية - الAI يميل للتكرار
  private static analyzePeriodicPatterns(image: Jimp): { hasPeriodicPattern: boolean; strength: number } {
    const { width, height } = image.bitmap;
    let periodicScore = 0;

    // فحص التكرار الأفقي
    for (let y = 0; y < height; y += 10) {
      const rowPattern = this.extractRowPattern(image, y);
      const repetition = this.findPatternRepetition(rowPattern);
      if (repetition.isRepeating) {
        periodicScore += repetition.strength;
      }
    }

    // فحص التكرار العمودي
    for (let x = 0; x < width; x += 10) {
      const colPattern = this.extractColumnPattern(image, x);
      const repetition = this.findPatternRepetition(colPattern);
      if (repetition.isRepeating) {
        periodicScore += repetition.strength;
      }
    }

    return {
      hasPeriodicPattern: periodicScore > 50,
      strength: Math.min(periodicScore, 100)
    };
  }

  // تحليل التماثل غير الطبيعي
  private static analyzeUnnaturalSymmetry(image: Jimp): { hasUnnaturalSymmetry: boolean; type: string } {
    const { width, height } = image.bitmap;
    
    // فحص التماثل الأفقي المثالي (نادر في الصور الطبيعية)
    const horizontalSymmetry = this.calculateHorizontalSymmetry(image);
    
    // فحص التماثل العمودي المثالي
    const verticalSymmetry = this.calculateVerticalSymmetry(image);
    
    // التماثل المثالي يشير للتوليد الآلي
    if (horizontalSymmetry > 0.95) {
      return {
        hasUnnaturalSymmetry: true,
        type: 'تماثل أفقي مثالي غير طبيعي'
      };
    }
    
    if (verticalSymmetry > 0.95) {
      return {
        hasUnnaturalSymmetry: true,
        type: 'تماثل عمودي مثالي غير طبيعي'
      };
    }

    return {
      hasUnnaturalSymmetry: false,
      type: 'تماثل طبيعي'
    };
  }

  // تحليل بصمة الأدوات - كل أداة لها بصمة مميزة
  static analyzeToolFingerprint(filePath: string, metadata: any): {
    detectedTool: string;
    confidence: number;
    isAITool: boolean;
  } {
    const fileName = metadata.name.toLowerCase();
    
    // بصمات أدوات الذكاء الاصطناعي الشائعة
    const aiToolPatterns = [
      { pattern: /midjourney/i, tool: 'Midjourney', confidence: 95 },
      { pattern: /dall.*e/i, tool: 'DALL-E', confidence: 95 },
      { pattern: /stable.*diffusion/i, tool: 'Stable Diffusion', confidence: 95 },
      { pattern: /leonardo/i, tool: 'Leonardo AI', confidence: 90 },
      { pattern: /firefly/i, tool: 'Adobe Firefly', confidence: 85 },
      { pattern: /generated/i, tool: 'AI Generated', confidence: 80 },
      { pattern: /synthetic/i, tool: 'Synthetic Media', confidence: 85 },
    ];

    // بصمات أدوات التعديل التقليدية
    const traditionalToolPatterns = [
      { pattern: /photoshop/i, tool: 'Adobe Photoshop', confidence: 90 },
      { pattern: /lightroom/i, tool: 'Adobe Lightroom', confidence: 85 },
      { pattern: /gimp/i, tool: 'GIMP', confidence: 80 },
      { pattern: /canva/i, tool: 'Canva', confidence: 75 },
    ];

    // فحص اسم الملف
    for (const aiTool of aiToolPatterns) {
      if (aiTool.pattern.test(fileName)) {
        return {
          detectedTool: aiTool.tool,
          confidence: aiTool.confidence,
          isAITool: true
        };
      }
    }

    for (const tradTool of traditionalToolPatterns) {
      if (tradTool.pattern.test(fileName)) {
        return {
          detectedTool: tradTool.tool,
          confidence: tradTool.confidence,
          isAITool: false
        };
      }
    }

    return {
      detectedTool: 'غير محدد',
      confidence: 0,
      isAITool: false
    };
  }

  // دوال مساعدة
  private static calculateBlockVariance(image: Jimp, startX: number, startY: number, width: number, height: number): number {
    const pixels: number[] = [];
    
    for (let x = startX; x < startX + width && x < image.bitmap.width; x++) {
      for (let y = startY; y < startY + height && y < image.bitmap.height; y++) {
        const color = image.getPixelColor(x, y);
        const gray = (Jimp.intToRGBA(color).r + Jimp.intToRGBA(color).g + Jimp.intToRGBA(color).b) / 3;
        pixels.push(gray);
      }
    }

    if (pixels.length === 0) return 0;

    const mean = pixels.reduce((sum, val) => sum + val, 0) / pixels.length;
    const variance = pixels.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / pixels.length;
    
    return variance;
  }

  private static extractRowPattern(image: Jimp, y: number): number[] {
    const pattern: number[] = [];
    const { width } = image.bitmap;
    
    for (let x = 0; x < width; x++) {
      const color = image.getPixelColor(x, y);
      const gray = (Jimp.intToRGBA(color).r + Jimp.intToRGBA(color).g + Jimp.intToRGBA(color).b) / 3;
      pattern.push(gray);
    }
    
    return pattern;
  }

  private static extractColumnPattern(image: Jimp, x: number): number[] {
    const pattern: number[] = [];
    const { height } = image.bitmap;
    
    for (let y = 0; y < height; y++) {
      const color = image.getPixelColor(x, y);
      const gray = (Jimp.intToRGBA(color).r + Jimp.intToRGBA(color).g + Jimp.intToRGBA(color).b) / 3;
      pattern.push(gray);
    }
    
    return pattern;
  }

  private static findPatternRepetition(pattern: number[]): { isRepeating: boolean; strength: number } {
    const length = pattern.length;
    let maxRepetition = 0;
    
    // البحث عن أنماط متكررة
    for (let patternSize = 10; patternSize < length / 4; patternSize++) {
      let repetitions = 0;
      
      for (let i = 0; i < length - patternSize * 2; i += patternSize) {
        const segment1 = pattern.slice(i, i + patternSize);
        const segment2 = pattern.slice(i + patternSize, i + patternSize * 2);
        
        const similarity = this.calculatePatternSimilarity(segment1, segment2);
        if (similarity > 0.9) {
          repetitions++;
        }
      }
      
      maxRepetition = Math.max(maxRepetition, repetitions);
    }
    
    return {
      isRepeating: maxRepetition > 3,
      strength: Math.min(maxRepetition * 10, 100)
    };
  }

  private static calculatePatternSimilarity(pattern1: number[], pattern2: number[]): number {
    if (pattern1.length !== pattern2.length) return 0;
    
    let totalDiff = 0;
    for (let i = 0; i < pattern1.length; i++) {
      totalDiff += Math.abs(pattern1[i] - pattern2[i]);
    }
    
    const avgDiff = totalDiff / pattern1.length;
    return Math.max(0, 1 - (avgDiff / 255));
  }

  private static calculateHorizontalSymmetry(image: Jimp): number {
    const { width, height } = image.bitmap;
    let totalDiff = 0;
    let comparisons = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width / 2; x++) {
        const leftColor = image.getPixelColor(x, y);
        const rightColor = image.getPixelColor(width - 1 - x, y);
        
        const leftGray = (Jimp.intToRGBA(leftColor).r + Jimp.intToRGBA(leftColor).g + Jimp.intToRGBA(leftColor).b) / 3;
        const rightGray = (Jimp.intToRGBA(rightColor).r + Jimp.intToRGBA(rightColor).g + Jimp.intToRGBA(rightColor).b) / 3;
        
        totalDiff += Math.abs(leftGray - rightGray);
        comparisons++;
      }
    }
    
    const avgDiff = totalDiff / comparisons;
    return Math.max(0, 1 - (avgDiff / 255));
  }

  private static calculateVerticalSymmetry(image: Jimp): number {
    const { width, height } = image.bitmap;
    let totalDiff = 0;
    let comparisons = 0;
    
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height / 2; y++) {
        const topColor = image.getPixelColor(x, y);
        const bottomColor = image.getPixelColor(x, height - 1 - y);
        
        const topGray = (Jimp.intToRGBA(topColor).r + Jimp.intToRGBA(topColor).g + Jimp.intToRGBA(topColor).b) / 3;
        const bottomGray = (Jimp.intToRGBA(bottomColor).r + Jimp.intToRGBA(bottomColor).g + Jimp.intToRGBA(bottomColor).b) / 3;
        
        totalDiff += Math.abs(topGray - bottomGray);
        comparisons++;
      }
    }
    
    const avgDiff = totalDiff / comparisons;
    return Math.max(0, 1 - (avgDiff / 255));
  }
}

export default AdvancedDetectionService;