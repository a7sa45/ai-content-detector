import axios from 'axios';
import { AnalyzeResponse } from '../types';

// تحديد الـ base URL حسب البيئة
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    // في المتصفح
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:5000/api';
    }
    // في الإنتاج على Vercel
    return '/api';
  }
  // في الخادم
  return 'http://localhost:5000/api';
};

// إعداد axios
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // 30 ثانية (حد Vercel)
});

// إضافة interceptor للأخطاء
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// رفع وتحليل ملف مباشرة (مبسط للVercel)
export const uploadAndAnalyzeFile = async (file: File): Promise<AnalyzeResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// رفع ملف (للتوافق مع الكود الموجود)
export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// تحليل ملف (مبسط للVercel)
export const analyzeFile = async (data: {
  filePath?: string;
  fileType: string;
  metadata: any;
}): Promise<AnalyzeResponse> => {
  // في Vercel، نحتاج لإرسال الملف مباشرة
  // هذه الدالة للتوافق مع الكود الموجود
  return {
    success: true,
    result: {
      isAIGenerated: false,
      confidenceScore: 50,
      detectionMethod: 'Vercel Compatibility Mode',
      processingTime: 100,
      fileInfo: data.metadata,
      explanation: 'استخدم uploadAndAnalyzeFile للتحليل الفعلي على Vercel'
    }
  };
};

// التحقق من حالة الخادم
export const checkServerHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// الحصول على حالة خدمة الرفع
export const getUploadStatus = async () => {
  try {
    await api.get('/health');
    return {
      success: true,
      message: 'خدمة الرفع تعمل على Vercel',
      supportedTypes: ['image', 'video', 'audio'],
      maxFileSize: '10MB'
    };
  } catch (error) {
    return {
      success: false,
      message: 'خدمة الرفع غير متوفرة'
    };
  }
};

// الحصول على حالة خدمة التحليل
export const getAnalysisStatus = async () => {
  try {
    await api.get('/health');
    return {
      success: true,
      message: 'خدمة التحليل تعمل على Vercel (مبسطة)',
      supportedTypes: ['image', 'video', 'audio'],
      apis: {
        hive: false, // غير متوفر على Vercel
        deepware: false, // غير متوفر على Vercel
        local: true // التحليل المحلي المبسط
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'خدمة التحليل غير متوفرة'
    };
  }
};