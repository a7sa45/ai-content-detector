import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  Chip,
  Stack,
  FormControlLabel,
  Switch,
  Tooltip,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Compress as CompressIcon,
  AudioFile as AudioIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface FileUploaderProps {
  onFileAnalyze: (file: File) => Promise<void>;
  isAnalyzing: boolean;
  error: string | null;
  uploadProgress?: number;
  compressionEnabled?: boolean;
  onCompressionToggle?: (enabled: boolean) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileAnalyze,
  isAnalyzing,
  error,
  uploadProgress = 0,
  compressionEnabled = true,
  onCompressionToggle,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);

  // تحديد الملفات المقبولة - مقسمة حسب مستوى الدعم
  const fullySupported = {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp'], // مدعومة بالكامل
    'video/*': ['.mp4', '.avi', '.mov', '.webm'], // مدعومة بالكامل
    'audio/*': ['.mp3', '.wav', '.mpeg'], // مدعومة بالكامل
  };

  const partiallySupported = {
    'image/*': ['.webp', '.tiff', '.avif', '.heic'], // تحليل اسم الملف فقط
    'video/*': ['.wmv', '.flv', '.mkv', '.m4v'], // تحليل اسم الملف فقط
    'audio/*': ['.aac', '.ogg', '.flac', '.m4a', '.wma'], // تحليل اسم الملف فقط
  };

  // دمج جميع الأنواع المدعومة
  const acceptedFiles = {
    'image/*': [...fullySupported['image/*'], ...partiallySupported['image/*']],
    'video/*': [...fullySupported['video/*'], ...partiallySupported['video/*']],
    'audio/*': [...fullySupported['audio/*'], ...partiallySupported['audio/*']],
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

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: acceptedFiles,
    maxFiles: 1,
    maxSize: 52428800, // 50MB
    disabled: isAnalyzing,
  });

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

  // مكون معاينة الملف
  const renderFilePreview = () => {
    if (!selectedFile || !filePreviewUrl) return null;

    const fileType = selectedFile.type;

    if (fileType.startsWith('image/')) {
      return (
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <img
            src={filePreviewUrl}
            alt="معاينة الصورة"
            style={{
              maxWidth: '100%',
              maxHeight: isMobile ? '200px' : '300px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          />
        </Box>
      );
    }

    if (fileType.startsWith('video/')) {
      return (
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <video
            src={filePreviewUrl}
            controls
            style={{
              maxWidth: '100%',
              maxHeight: isMobile ? '200px' : '300px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          />
        </Box>
      );
    }

    if (fileType.startsWith('audio/')) {
      return (
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Box sx={{
            p: { xs: 2, sm: 3 },
            border: '2px dashed',
            borderColor: 'primary.main',
            borderRadius: 2,
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            color: 'primary.main',
            mb: 2
          }}>
            <AudioIcon sx={{ fontSize: { xs: 40, sm: 48 }, mb: 1 }} />
            <Typography variant={isMobile ? "body1" : "h6"} gutterBottom fontWeight="bold">
              🎵 ملف صوتي
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
              maxWidth: isMobile ? '100%' : '400px',
              height: '40px'
            }}
          />
        </Box>
      );
    }

    return null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 ' + t('common.bytes');
    const k = 1024;
    const sizes = ['bytes', 'kb', 'mb'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + t(`common.${sizes[i]}`);
  };



  const getSupportLevelChip = (file: File) => {
    const fullySupported = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp',
      'video/mp4', 'video/avi', 'video/mov', 'video/webm',
      'audio/mp3', 'audio/wav', 'audio/mpeg'
    ];

    const isFullySupported = fullySupported.includes(file.type);
    
    return (
      <Chip 
        label={isFullySupported ? 'تحليل كامل' : 'تحليل اسم الملف'} 
        size="small" 
        color={isFullySupported ? 'success' : 'warning'}
        variant="outlined"
      />
    );
  };

  const getFileTypeLabel = (file: File): string => {
    if (file.type.startsWith('image/')) return 'صورة';
    if (file.type.startsWith('video/')) return 'فيديو';
    if (file.type.startsWith('audio/')) return 'صوت';
    return 'ملف';
  };

  return (
    <Box>
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        component="h2" 
        gutterBottom 
        textAlign="center"
        sx={{ mb: { xs: 2, sm: 3 } }}
      >
        {t('upload.title')}
      </Typography>

      {/* منطقة رفع الملفات */}
      {!showPreview && (
        <Fade in={!showPreview} timeout={800}>
          <Card
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
              cursor: isAnalyzing ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              mb: { xs: 2, sm: 3 },
              opacity: isAnalyzing ? 0.6 : 1,
              borderRadius: { xs: 2, sm: 3 },
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'action.hover',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(25, 118, 210, 0.15)',
              },
            }}
          >
          <CardContent sx={{ 
            textAlign: 'center', 
            py: { xs: 4, sm: 5, md: 6 },
            px: { xs: 2, sm: 3 }
          }}>
            <input {...getInputProps()} />
            
            <Zoom in={true} timeout={1000}>
              <UploadIcon sx={{ 
                fontSize: { xs: 48, sm: 56, md: 64 }, 
                color: 'primary.main', 
                mb: 2,
                filter: 'drop-shadow(0 4px 8px rgba(25, 118, 210, 0.3))'
              }} />
            </Zoom>
            
            <Typography 
              variant={isMobile ? "body1" : "h6"} 
              gutterBottom
              sx={{ fontWeight: 500 }}
            >
              {isDragActive
                ? 'أفلت الملف هنا...'
                : t('upload.dragDrop')
              }
            </Typography>
            
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 2,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {t('upload.supportedFormats')}
            </Typography>
            
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              {t('upload.maxSize')}
            </Typography>
            
            {!selectedFile && (
              <Fade in={true} timeout={1200}>
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  sx={{ 
                    mt: { xs: 2, sm: 3 },
                    px: { xs: 3, sm: 4 },
                    py: { xs: 1, sm: 1.5 },
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                    '&:hover': {
                      boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                  disabled={isAnalyzing}
                >
                  {t('upload.selectFile')}
                </Button>
              </Fade>
            )}
          </CardContent>
        </Card>
      </Fade>
      )}

      {/* معاينة الملف */}
      {selectedFile && showPreview && (
        <Fade in={showPreview} timeout={800}>
          <Card sx={{ 
            mb: { xs: 2, sm: 3 },
            borderRadius: { xs: 2, sm: 3 },
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            border: '2px solid rgba(25, 118, 210, 0.2)',
            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(255, 255, 255, 0.95) 100%)'
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                gutterBottom
                sx={{ 
                  fontWeight: 700, 
                  color: 'primary.main',
                  textAlign: 'center',
                  mb: 3
                }}
              >
                🔍 معاينة الملف
              </Typography>

              {/* عرض معاينة الملف */}
              {renderFilePreview()}

              {/* معلومات الملف */}
              <Box sx={{ 
                p: 2, 
                backgroundColor: 'rgba(25, 118, 210, 0.05)',
                borderRadius: 2,
                mb: 3
              }}>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  📄 {selectedFile.name}
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <Chip 
                    label={getFileTypeLabel(selectedFile)} 
                    size="small" 
                    color="primary" 
                  />
                  <Chip 
                    label={formatFileSize(selectedFile.size)} 
                    size="small" 
                    variant="outlined" 
                  />
                  {getSupportLevelChip(selectedFile)}
                </Stack>
              </Box>

              {/* خيار الضغط للصور */}
              {selectedFile.type.startsWith('image/') && onCompressionToggle && (
                <Box sx={{ mb: 3 }}>
                  <Tooltip title="ضغط الصورة يقلل من حجم الملف ويسرع عملية الرفع والتحليل">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={compressionEnabled}
                          onChange={(e) => onCompressionToggle(e.target.checked)}
                          disabled={isAnalyzing}
                        />
                      }
                      label={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CompressIcon fontSize="small" />
                          <Typography variant="body2">
                            ضغط الصورة تلقائياً
                          </Typography>
                        </Stack>
                      }
                    />
                  </Tooltip>
                </Box>
              )}

              {/* أزرار الإجراءات */}
              <Stack direction={isMobile ? "column" : "row"} spacing={2}>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="large"
                  fullWidth={isMobile}
                  onClick={clearSelection}
                  disabled={isAnalyzing}
                  sx={{ 
                    py: 2,
                    fontSize: '1rem',
                    borderRadius: 2,
                  }}
                >
                  🔄 اختيار ملف آخر
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  sx={{ 
                    py: 2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    '&:hover': {
                      boxShadow: '0 8px 20px rgba(25, 118, 210, 0.5)',
                      transform: 'translateY(-2px)',
                      background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                    },
                    '&:disabled': {
                      background: 'rgba(0, 0, 0, 0.12)',
                      transform: 'none'
                    }
                  }}
                >
                  {isAnalyzing ? '🔍 جاري التحليل...' : '🚀 بدء التحليل'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* شريط التقدم المحسن */}
      {isAnalyzing && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress 
            variant={uploadProgress > 0 ? "determinate" : "indeterminate"}
            value={uploadProgress}
            sx={{ mb: 1, height: 8, borderRadius: 4 }}
          />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {uploadProgress === 0 && 'جاري التحضير...'}
              {uploadProgress > 0 && uploadProgress < 50 && 'جاري رفع الملف...'}
              {uploadProgress >= 50 && uploadProgress < 100 && 'جاري التحليل...'}
              {uploadProgress === 100 && 'اكتمل التحليل!'}
            </Typography>
            {uploadProgress > 0 && (
              <Typography variant="body2" color="primary" fontWeight="medium">
                {Math.round(uploadProgress)}%
              </Typography>
            )}
          </Stack>
        </Box>
      )}

      {/* عرض الأخطاء */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* عرض أخطاء رفض الملفات */}
      {fileRejections.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {fileRejections[0].errors[0].code === 'file-too-large'
              ? t('upload.error.fileSize')
              : fileRejections[0].errors[0].code === 'file-invalid-type'
              ? t('upload.error.fileType')
              : t('upload.error.uploadFailed')
            }
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default FileUploader;