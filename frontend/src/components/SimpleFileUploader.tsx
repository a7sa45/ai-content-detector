import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';

interface SimpleFileUploaderProps {
  onFileAnalyze: (file: File) => Promise<void>;
  isAnalyzing: boolean;
  error: string | null;
  uploadProgress?: number;
  compressionEnabled?: boolean;
  onCompressionToggle?: (enabled: boolean) => void;
}

const SimpleFileUploader: React.FC<SimpleFileUploaderProps> = ({
  onFileAnalyze,
  isAnalyzing,
  error,
  uploadProgress = 0,
  compressionEnabled = true,
  onCompressionToggle,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);

  // أنواع الملفات المدعومة
  const acceptedFiles = {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.avif', '.heic'],
    'video/*': ['.mp4', '.avi', '.mov', '.webm', '.wmv', '.flv', '.mkv', '.m4v'],
    'audio/*': ['.mp3', '.wav', '.mpeg', '.aac', '.ogg', '.flac', '.m4a', '.wma'],
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      
      // إنشاء URL للمعاينة
      const previewUrl = URL.createObjectURL(file);
      setFilePreviewUrl(previewUrl);
      setShowPreview(true);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: acceptedFiles,
    maxFiles: 1,
    maxSize: 52428800, // 50MB
    disabled: isAnalyzing,
  });

  // تنظيف URL عند إلغاء التحديد
  const clearSelection = useCallback(() => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setShowPreview(false);
  }, [filePreviewUrl]);

  // تنظيف URL عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const handleAnalyze = async () => {
    if (selectedFile) {
      setShowPreview(false);
      await onFileAnalyze(selectedFile);
      // تنظيف بعد التحليل
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
        setFilePreviewUrl(null);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeEmoji = (file: File): string => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.startsWith('video/')) return '🎬';
    if (file.type.startsWith('audio/')) return '🎵';
    return '📄';
  };

  const getFileTypeLabel = (file: File): string => {
    if (file.type.startsWith('image/')) return 'صورة';
    if (file.type.startsWith('video/')) return 'فيديو';
    if (file.type.startsWith('audio/')) return 'صوت';
    return 'ملف';
  };

  // مكون معاينة الملف
  const renderFilePreview = () => {
    if (!selectedFile || !filePreviewUrl) return null;

    const fileType = selectedFile.type;

    if (fileType.startsWith('image/')) {
      return (
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <img
            src={filePreviewUrl}
            alt="معاينة الصورة"
            style={{
              maxWidth: '100%',
              maxHeight: '300px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}
          />
        </Box>
      );
    }

    if (fileType.startsWith('video/')) {
      return (
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <video
            src={filePreviewUrl}
            controls
            style={{
              maxWidth: '100%',
              maxHeight: '300px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}
          />
        </Box>
      );
    }

    if (fileType.startsWith('audio/')) {
      return (
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            p: 4,
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            backgroundColor: '#f9f9f9',
            mb: 3
          }}>
            <Typography variant="h2" sx={{ fontSize: '3rem', mb: 2 }}>
              🎵
            </Typography>
            <Typography variant="h6" gutterBottom>
              ملف صوتي
            </Typography>
            <Typography variant="body2" color="text.secondary">
              اضغط تشغيل للاستماع
            </Typography>
          </Box>
          <audio
            src={filePreviewUrl}
            controls
            style={{
              width: '100%',
              maxWidth: '400px'
            }}
          />
        </Box>
      );
    }

    return null;
  };

  return (
    <Box sx={{ direction: 'rtl' }} dir="rtl">
      
      {/* منطقة رفع الملفات */}
      {!showPreview && (
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed #e0e0e0',
            borderRadius: 2,
            p: { xs: 4, sm: 6 },
            textAlign: 'center',
            cursor: isAnalyzing ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: isDragActive ? '#f9f9f9' : '#ffffff',
            borderColor: isDragActive ? '#000000' : '#e0e0e0',
            opacity: isAnalyzing ? 0.6 : 1,
            '&:hover': {
              borderColor: '#000000',
              backgroundColor: '#f9f9f9',
            },
          }}
        >
          <input {...getInputProps()} />
          
          <Typography variant="h2" sx={{ fontSize: '4rem', mb: 2 }}>
            📁
          </Typography>
          
          <Typography variant="h3" gutterBottom sx={{ mb: 3 }}>
            {isDragActive ? 'أفلت الملف هنا' : 'اختر ملف أو اسحبه هنا'}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            الأنواع المدعومة: الصور، الفيديو، الصوت
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            الحد الأقصى: 50 ميجابايت
          </Typography>
          
          {!selectedFile && (
            <Button
              variant="contained"
              size="large"
              disabled={isAnalyzing}
              sx={{ px: 4, py: 1.5 }}
            >
              اختيار ملف
            </Button>
          )}
        </Box>
      )}

      {/* معاينة الملف */}
      {selectedFile && showPreview && (
        <Box sx={{ 
          border: '1px solid #e0e0e0',
          borderRadius: 2,
          p: { xs: 3, sm: 4 },
          backgroundColor: '#ffffff'
        }}>
          <Typography variant="h3" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
            معاينة الملف
          </Typography>

          {/* عرض معاينة الملف */}
          {renderFilePreview()}

          {/* معلومات الملف */}
          <Box sx={{ 
            p: 3, 
            backgroundColor: '#f9f9f9',
            borderRadius: 2,
            mb: 4
          }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h4" sx={{ fontSize: '2rem' }}>
                {getFileTypeEmoji(selectedFile)}
              </Typography>
              <Box>
                <Typography variant="body1" fontWeight="medium">
                  {selectedFile.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getFileTypeLabel(selectedFile)} • {formatFileSize(selectedFile.size)}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* خيار الضغط للصور */}
          {selectedFile.type.startsWith('image/') && onCompressionToggle && (
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Button
                variant={compressionEnabled ? "contained" : "outlined"}
                onClick={() => onCompressionToggle(!compressionEnabled)}
                disabled={isAnalyzing}
                size="small"
              >
                {compressionEnabled ? '✅' : '⬜'} ضغط الصورة تلقائياً
              </Button>
            </Box>
          )}

          {/* أزرار الإجراءات */}
          <Stack 
            direction={isMobile ? "column" : "row"} 
            spacing={2} 
            justifyContent="center"
          >
            <Button
              variant="outlined"
              size="large"
              onClick={clearSelection}
              disabled={isAnalyzing}
              sx={{ px: 4, py: 1.5 }}
            >
              اختيار ملف آخر
            </Button>
            
            <Button
              variant="contained"
              size="large"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              sx={{ px: 4, py: 1.5 }}
            >
              {isAnalyzing ? 'جاري التحليل...' : 'بدء التحليل'}
            </Button>
          </Stack>
        </Box>
      )}

      {/* شريط التقدم */}
      {isAnalyzing && (
        <Box sx={{ mt: 4 }}>
          <LinearProgress 
            variant={uploadProgress > 0 ? "determinate" : "indeterminate"}
            value={uploadProgress}
            sx={{ 
              mb: 2, 
              height: 6, 
              borderRadius: 3,
              backgroundColor: '#f0f0f0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#000000'
              }
            }}
          />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {uploadProgress === 0 && '⏳ جاري التحضير...'}
              {uploadProgress > 0 && uploadProgress < 50 && '📤 جاري رفع الملف...'}
              {uploadProgress >= 50 && uploadProgress < 100 && '🔍 جاري التحليل...'}
              {uploadProgress === 100 && '✅ اكتمل التحليل!'}
            </Typography>
            {uploadProgress > 0 && (
              <Typography variant="body2" fontWeight="medium">
                {Math.round(uploadProgress)}%
              </Typography>
            )}
          </Stack>
        </Box>
      )}

      {/* عرض الأخطاء */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mt: 3,
            borderRadius: 2,
            border: '1px solid #ffcdd2',
            backgroundColor: '#ffebee'
          }}
        >
          ❌ {error}
        </Alert>
      )}

      {/* عرض أخطاء رفض الملفات */}
      {fileRejections.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ 
            mt: 3,
            borderRadius: 2,
            border: '1px solid #fff3cd',
            backgroundColor: '#fff8e1'
          }}
        >
          ⚠️ {fileRejections[0].errors[0].code === 'file-too-large'
            ? 'حجم الملف كبير جداً (الحد الأقصى 50 ميجابايت)'
            : fileRejections[0].errors[0].code === 'file-invalid-type'
            ? 'نوع الملف غير مدعوم'
            : 'فشل في رفع الملف'
          }
        </Alert>
      )}
    </Box>
  );
};

export default SimpleFileUploader;