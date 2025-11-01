// أنواع البيانات المشتركة بين الواجهة الأمامية والخلفية

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  uploadTime: Date;
  duration?: number; // للفيديو والصوت
  dimensions?: { width: number; height: number }; // للصور والفيديو
}

export interface AnalysisResult {
  isAIGenerated: boolean;
  confidenceScore: number;
  detectionMethod: string;
  processingTime: number;
  fileInfo: FileMetadata;
  detectedFeatures?: string[];
  explanation?: string;
}

export interface AnalyzeRequest {
  file: File;
  fileType: 'image' | 'video' | 'audio';
}

export interface AnalyzeResponse {
  success: boolean;
  result?: AnalysisResult;
  error?: string;
}

export interface DetectionConfig {
  imageAPI: {
    provider: 'hive' | 'clarifai';
    endpoint: string;
    apiKey: string;
  };
  videoAPI: {
    provider: 'deepware' | 'microsoft';
    endpoint: string;
    apiKey?: string;
  };
  audioAPI: {
    provider: 'hive' | 'resemble';
    endpoint: string;
    apiKey: string;
  };
}

export type FileType = 'image' | 'video' | 'audio';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ErrorResponse {
  error: string;
  code: string;
  details?: any;
}