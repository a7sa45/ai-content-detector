import axios from 'axios';
import { AnalyzeResponse } from '../types';

// إعداد axios
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 300000, // 5 دقائق للتحليل
});

// إضافة interceptor للأخطاء
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// رفع ملف
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

// تحليل ملف
export const analyzeFile = async (data: {
  filePath: string;
  fileType: string;
  metadata: any;
}): Promise<AnalyzeResponse> => {
  const response = await api.post('/analyze', data);
  return response.data;
};

// التحقق من حالة الخادم
export const checkServerHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// الحصول على حالة خدمة الرفع
export const getUploadStatus = async () => {
  const response = await api.get('/upload/status');
  return response.data;
};

// الحصول على حالة خدمة التحليل
export const getAnalysisStatus = async () => {
  const response = await api.get('/analyze/status');
  return response.data;
};