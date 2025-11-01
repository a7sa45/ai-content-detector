// Vercel Serverless Function للخادم الخلفي المبسط
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();

// إعدادات CORS
app.use(cors({
  origin: ['https://ai-content-detector.vercel.app', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// إعداد multer للذاكرة (بدلاً من القرص)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// API الصحة
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'خادم كاشف المحتوى المعدل يعمل على Vercel',
    timestamp: new Date().toISOString(),
    developer: '@a7sa45',
    x: 'https://x.com/a7sa45',
    github: 'https://github.com/a7sa45',
    version: '1.0.0-vercel'
  });
});

// تحليل مبسط (بدون APIs خارجية)
app.post('/api/analyze', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'لم يتم رفع أي ملف'
      });
    }

    const file = req.file;
    const suspiciousFactors = [];
    
    // تحليل بسيط للملف
    if (file.size < 50000) {
      suspiciousFactors.push('حجم ملف صغير جداً');
    }
    
    if (file.originalname.toLowerCase().includes('ai') || 
        file.originalname.toLowerCase().includes('generated')) {
      suspiciousFactors.push('اسم الملف يشير للتوليد');
    }

    // تحليل نوع الملف
    let fileType = 'unknown';
    if (file.mimetype.startsWith('image/')) fileType = 'image';
    else if (file.mimetype.startsWith('video/')) fileType = 'video';
    else if (file.mimetype.startsWith('audio/')) fileType = 'audio';

    const isAIGenerated = suspiciousFactors.length > 0;
    const confidenceScore = Math.min(suspiciousFactors.length * 35, 85);

    const result = {
      isAIGenerated,
      confidenceScore,
      detectionMethod: 'Vercel Simplified Analysis',
      processingTime: 500,
      fileInfo: {
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        uploadTime: new Date()
      },
      detectedFeatures: suspiciousFactors,
      explanation: isAIGenerated 
        ? `تم اكتشاف ${suspiciousFactors.length} علامة مشبوهة (تحليل مبسط)`
        : 'لم يتم اكتشاف علامات واضحة (تحليل مبسط)'
    };

    res.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('خطأ في التحليل:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في تحليل الملف'
    });
  }
});

// رفع الملفات (مبسط)
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'لم يتم رفع أي ملف'
      });
    }

    res.json({
      success: true,
      file: {
        path: 'memory-buffer', // الملف في الذاكرة
        metadata: {
          name: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype,
          uploadTime: new Date()
        }
      }
    });

  } catch (error) {
    console.error('خطأ في رفع الملف:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في رفع الملف'
    });
  }
});

// معالج الأخطاء
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'خطأ في الخادم'
  });
});

// معالج الطرق غير الموجودة
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'الطريق المطلوب غير موجود',
    code: 'NOT_FOUND'
  });
});

module.exports = app;