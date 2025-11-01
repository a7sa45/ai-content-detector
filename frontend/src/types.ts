// أنواع البيانات للواجهة الأمامية

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  uploadTime: Date;
  duration?: number;
  dimensions?: { width: number; height: number };
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

export interface AnalyzeResponse {
  success: boolean;
  result?: AnalysisResult;
  error?: string;
}

export type FileType = 'image' | 'video' | 'audio';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}