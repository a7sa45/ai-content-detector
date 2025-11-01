import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadFile, analyzeFile } from '../services/api';
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

  // Mutation لرفع الملف
  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onError: (error: any) => {
      setError(error.response?.data?.error || 'فشل في رفع الملف');
    },
  });

  // Mutation للتحليل
  const analysisMutation = useMutation({
    mutationFn: analyzeFile,
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

      // ضغط الملف إذا كان مفعلاً وكان صورة
      let processedFile = file;
      if (compressionEnabled && fileType === 'image') {
        const { result: compressedFile, duration } = await measurePerformance(
          () => compressFileBeforeUpload(file),
          'ضغط الصورة'
        );
        processedFile = compressedFile;
        
        console.log(`تم ضغط الصورة من ${Math.round(file.size / 1024)}KB إلى ${Math.round(compressedFile.size / 1024)}KB`);
      }

      setUploadProgress(10);

      // رفع الملف مع قياس الأداء
      const uploadStartTime = Date.now();
      const uploadResult = await uploadMutation.mutateAsync(processedFile);
      const uploadDuration = Date.now() - uploadStartTime;
      
      // حساب سرعة الرفع
      networkMonitor.measureUploadSpeed(processedFile.size, uploadDuration);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'فشل في رفع الملف');
      }

      setUploadProgress(50);

      // تحليل الملف مع قياس الأداء
      const { result: analysisData } = await measurePerformance(
        () => analysisMutation.mutateAsync({
          filePath: uploadResult.file.path,
          fileType,
          metadata: uploadResult.file.metadata,
        }),
        'تحليل الملف'
      );

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
    isAnalyzing: uploadMutation.isPending || analysisMutation.isPending,
    error,
    analyzeFile: handleAnalyzeFile,
    resetAnalysis,
    uploadProgress,
    compressionEnabled,
    setCompressionEnabled,
  };
};