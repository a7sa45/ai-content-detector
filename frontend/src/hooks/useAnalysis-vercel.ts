import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadAndAnalyzeFile, checkServerHealth } from '../services/api-vercel';
import { AnalysisResult, FileType } from '../types';
import { 
  compressFileBeforeUpload, 
  networkMonitor, 
  measurePerformance 
} from '../services/performanceService';

export interface UseAnalysisReturn {
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;
  error: string | null;
  analyzeFile: (file: File) => Promise<void>;
  resetAnalysis: () => void;
  uploadProgress: number;
  compressionEnabled: boolean;
  setCompressionEnabled: (enabled: boolean) => void;
}

export const useAnalysis = (): UseAnalysisReturn => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [compressionEnabled, setCompressionEnabled] = useState<boolean>(true);

  // Mutation للتحليل المباشر (Vercel)
  const analysisMutation = useMutation({
    mutationFn: uploadAndAnalyzeFile,
    onSuccess: (data) => {
      if (data.success && data.result) {
        setAnalysisResult(data.result);
        setError(null);
      } else {
        setError(data.error || 'فشل في تحليل الملف');
      }
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'فشل في تحليل الملف');
    },
  });

  const handleAnalyzeFile = async (file: File) => {
    try {
      setError(null);
      setAnalysisResult(null);
      setUploadProgress(0);

      // التحقق من حالة الخادم
      try {
        await checkServerHealth();
      } catch (healthError) {
        throw new Error('الخادم غير متوفر حالياً');
      }

      // قياس زمن الاستجابة
      await networkMonitor.measureLatency();

      // تحديد نوع الملف
      let fileType: FileType;
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type.startsWith('video/')) {
        fileType = 'video';
      } else if (file.type.startsWith('audio/')) {
        fileType = 'audio';
      } else {
        throw new Error('نوع الملف غير مدعوم');
      }

      // التحقق من حجم الملف (حد Vercel: 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('حجم الملف كبير جداً. الحد الأقصى 10MB على Vercel');
      }

      setUploadProgress(20);

      // ضغط الملف إذا كان مفعلاً وكان صورة
      let processedFile = file;
      if (compressionEnabled && fileType === 'image') {
        try {
          const { result: compressedFile } = await measurePerformance(
            () => compressFileBeforeUpload(file),
            'ضغط الصورة'
          );
          processedFile = compressedFile;
          
          console.log(`تم ضغط الصورة من ${Math.round(file.size / 1024)}KB إلى ${Math.round(compressedFile.size / 1024)}KB`);
        } catch (compressionError) {
          console.warn('فشل في ضغط الصورة، سيتم استخدام الملف الأصلي');
        }
      }

      setUploadProgress(50);

      // تحليل الملف مع قياس الأداء
      const analysisStartTime = Date.now();
      await analysisMutation.mutateAsync(processedFile);
      const analysisDuration = Date.now() - analysisStartTime;
      
      // حساب سرعة المعالجة
      networkMonitor.measureUploadSpeed(processedFile.size, analysisDuration);

      setUploadProgress(100);

    } catch (error: any) {
      setError(error.message || 'حدث خطأ غير متوقع');
      setUploadProgress(0);
    }
  };

  const resetAnalysis = () => {
    setAnalysisResult(null);
    setError(null);
    setUploadProgress(0);
  };

  return {
    analysisResult,
    isAnalyzing: analysisMutation.isPending,
    error,
    analyzeFile: handleAnalyzeFile,
    resetAnalysis,
    uploadProgress,
    compressionEnabled,
    setCompressionEnabled,
  };
};