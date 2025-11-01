import React from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  LinearProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { AnalysisResult } from '../types';

interface SimpleAnalysisResultsProps {
  result: AnalysisResult;
  onNewAnalysis: () => void;
  onShowHowItWorks?: () => void;
}

const SimpleAnalysisResults: React.FC<SimpleAnalysisResultsProps> = ({
  result,
  onNewAnalysis,
  onShowHowItWorks,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatProcessingTime = (ms: number): string => {
    if (ms < 1000) {
      return `${ms} مللي ثانية`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)} ثانية`;
    } else {
      return `${(ms / 60000).toFixed(1)} دقيقة`;
    }
  };

  const getResultEmoji = (isAI: boolean, confidence: number): string => {
    if (isAI) {
      if (confidence >= 80) return '🚨';
      if (confidence >= 60) return '⚠️';
      return '🤔';
    } else {
      if (confidence >= 80) return '✅';
      if (confidence >= 60) return '👍';
      return '🤷';
    }
  };

  const getResultText = (isAI: boolean): string => {
    return isAI ? 'مولد بالذكاء الاصطناعي' : 'طبيعي (غير مولد)';
  };

  const getConfidenceText = (confidence: number): string => {
    if (confidence >= 90) return 'عالية جداً';
    if (confidence >= 70) return 'عالية';
    if (confidence >= 50) return 'متوسطة';
    if (confidence >= 30) return 'منخفضة';
    return 'منخفضة جداً';
  };

  return (
    <Box sx={{ direction: 'rtl' }} dir="rtl">
      
      {/* النتيجة الرئيسية */}
      <Box sx={{ 
        textAlign: 'center', 
        mb: 6,
        p: { xs: 4, sm: 6 },
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        backgroundColor: result.isAIGenerated ? '#fff3e0' : '#e8f5e8'
      }}>
        <Typography variant="h2" sx={{ fontSize: '4rem', mb: 2 }}>
          {getResultEmoji(result.isAIGenerated, result.confidenceScore)}
        </Typography>
        
        <Typography variant="h2" gutterBottom sx={{ mb: 3 }}>
          {getResultText(result.isAIGenerated)}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {result.explanation}
        </Typography>

        {/* نسبة الثقة */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body1" fontWeight="medium">
              نسبة الثقة
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {result.confidenceScore}% ({getConfidenceText(result.confidenceScore)})
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={result.confidenceScore}
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: '#f0f0f0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: result.isAIGenerated ? '#ff9800' : '#4caf50'
              }
            }}
          />
        </Box>
      </Box>

      {/* تفاصيل التحليل */}
      <Box sx={{ 
        mb: 6,
        p: { xs: 3, sm: 4 },
        backgroundColor: '#f9f9f9',
        borderRadius: 2,
        border: '1px solid #e0e0e0'
      }}>
        <Typography variant="h3" gutterBottom sx={{ mb: 3 }}>
          📊 تفاصيل التحليل
        </Typography>
        
        <Stack spacing={3}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              طريقة التحليل
            </Typography>
            <Typography variant="body1">
              {result.detectionMethod}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              وقت المعالجة
            </Typography>
            <Typography variant="body1">
              ⏱️ {formatProcessingTime(result.processingTime)}
            </Typography>
          </Box>

          {result.detectedFeatures && result.detectedFeatures.length > 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                الميزات المكتشفة ({result.detectedFeatures.length})
              </Typography>
              <Stack spacing={1}>
                {result.detectedFeatures.map((feature, index) => (
                  <Typography key={index} variant="body2" sx={{ 
                    p: 1, 
                    backgroundColor: '#ffffff',
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}>
                    • {feature}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </Box>

      {/* معلومات الملف */}
      <Box sx={{ 
        mb: 6,
        p: { xs: 3, sm: 4 },
        backgroundColor: '#f9f9f9',
        borderRadius: 2,
        border: '1px solid #e0e0e0'
      }}>
        <Typography variant="h3" gutterBottom sx={{ mb: 3 }}>
          📄 معلومات الملف
        </Typography>
        
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              اسم الملف
            </Typography>
            <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
              {result.fileInfo.name}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              الحجم
            </Typography>
            <Typography variant="body1">
              📦 {formatFileSize(result.fileInfo.size)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              النوع
            </Typography>
            <Typography variant="body1">
              {result.fileInfo.type.startsWith('image/') && '🖼️ صورة'}
              {result.fileInfo.type.startsWith('video/') && '🎬 فيديو'}
              {result.fileInfo.type.startsWith('audio/') && '🎵 صوت'}
              {' '}({result.fileInfo.type})
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* إحصائيات سريعة */}
      <Box sx={{ 
        mb: 6,
        p: { xs: 3, sm: 4 },
        backgroundColor: '#f9f9f9',
        borderRadius: 2,
        border: '1px solid #e0e0e0'
      }}>
        <Typography variant="h3" gutterBottom sx={{ mb: 3 }}>
          ⚡ إحصائيات سريعة
        </Typography>
        
        <Stack 
          direction={isMobile ? "column" : "row"} 
          spacing={4}
          divider={<Box sx={{ width: '1px', backgroundColor: '#e0e0e0' }} />}
        >
          <Box textAlign="center">
            <Typography variant="h4" fontWeight="bold">
              {result.confidenceScore}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              نسبة الثقة
            </Typography>
          </Box>
          
          <Box textAlign="center">
            <Typography variant="h4" fontWeight="bold">
              {formatProcessingTime(result.processingTime)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              وقت التحليل
            </Typography>
          </Box>
          
          <Box textAlign="center">
            <Typography variant="h4" fontWeight="bold">
              {result.detectedFeatures?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ميزة مكتشفة
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* كيف تم التحليل - ملخص سريع */}
      <Box sx={{ 
        mb: 6,
        p: { xs: 3, sm: 4 },
        backgroundColor: '#e3f2fd',
        borderRadius: 2,
        border: '1px solid #2196f3'
      }}>
        <Typography variant="h3" gutterBottom sx={{ mb: 3, color: '#1565c0' }}>
          🔬 كيف تم التحليل؟
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'right', direction: 'rtl' }}>
          استخدمنا 8 طرق تحليل متقدمة لفحص الملف:
        </Typography>

        <Stack spacing={1} sx={{ direction: 'rtl' }}>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right', direction: 'rtl' }}>
            • 📊 فحص البيانات الوصفية والتواريخ
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right', direction: 'rtl' }}>
            • 🌈 تحليل الألوان والضوضاء الطبيعية
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right', direction: 'rtl' }}>
            • ⚡ فحص جودة الحواف والتفاصيل
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right', direction: 'rtl' }}>
            • 🔄 كشف الأنماط المتكررة والتماثل
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right', direction: 'rtl' }}>
            • 🛠️ تحديد الأدوات المستخدمة في الإنشاء
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right', direction: 'rtl' }}>
            • 📐 تحليل أنماط الضغط والكتل
          </Typography>
          {result.fileInfo.type.startsWith('video/') && (
            <>
              <Typography variant="body2" color="text.secondary">
                • 🎭 كشف تقنيات Deepfake في الوجوه
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 🎞️ فحص التناسق بين إطارات الفيديو
              </Typography>
            </>
          )}
          {result.fileInfo.type.startsWith('audio/') && (
            <>
              <Typography variant="body2" color="text.secondary">
                • 🌊 تحليل الطيف الصوتي والترددات
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 🫁 فحص أنماط التنفس الطبيعية
              </Typography>
            </>
          )}
        </Stack>
      </Box>

      {/* أزرار الإجراءات */}
      <Stack 
        direction={isMobile ? "column" : "row"} 
        spacing={2} 
        justifyContent="center"
        alignItems="center"
        sx={{ mb: 4 }}
      >
        <Button
          variant="contained"
          size="large"
          onClick={onNewAnalysis}
          sx={{ 
            px: 6, 
            py: 2,
            fontSize: '1.125rem'
          }}
        >
          🔄 تحليل ملف جديد
        </Button>
        
        <Button
          variant="outlined"
          size="large"
          onClick={onShowHowItWorks || (() => window.scrollTo({ top: 0, behavior: 'smooth' }))}
          sx={{ 
            px: 4, 
            py: 2,
            fontSize: '1rem'
          }}
        >
          📖 كيف تم التحليل؟
        </Button>
      </Stack>

      {/* معلومات المطور */}
      <Box 
        textAlign="center" 
        pt={3}
        sx={{ 
          borderTop: '1px solid #e0e0e0',
          mt: 4
        }}
      >
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: '0.75rem' }}
        >
          تطوير: <a 
            href="https://x.com/a7sa45" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: '#1976d2', 
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            𝕏 @a7sa45
          </a> | <a 
            href="https://github.com/a7sa45" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: '#1976d2', 
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            ⚡ GitHub
          </a>
        </Typography>
      </Box>
    </Box>
  );
};

export default SimpleAnalysisResults;