import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,

  Stack,
  Alert,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { AnalysisResult } from '../types';

interface AnalysisResultsProps {
  result: AnalysisResult;
  onNewAnalysis: () => void;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  onNewAnalysis,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 ' + t('common.bytes');
    const k = 1024;
    const sizes = ['bytes', 'kb', 'mb'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + t(`common.${sizes[i]}`);
  };

  const formatProcessingTime = (ms: number): string => {
    if (ms < 1000) {
      return `${ms} مللي ثانية`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)} ${t('common.seconds')}`;
    } else {
      return `${(ms / 60000).toFixed(1)} ${t('common.minutes')}`;
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getResultColor = (isAI: boolean) => {
    return isAI ? 'error' : 'success';
  };

  const getResultIcon = (isAI: boolean) => {
    return isAI ? <WarningIcon /> : <CheckIcon />;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'error';
    if (score >= 60) return 'warning';
    if (score >= 40) return 'info';
    return 'success';
  };

  return (
    <Box>
      <Fade in={true} timeout={800}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          component="h2" 
          gutterBottom 
          textAlign="center"
          sx={{ mb: { xs: 2, sm: 3 } }}
        >
          {t('results.title')}
        </Typography>
      </Fade>

      {/* النتيجة الرئيسية */}
      <Zoom in={true} timeout={1000}>
        <Box>
          <Card sx={{ 
            mb: { xs: 2, sm: 3 },
            borderRadius: { xs: 2, sm: 3 },
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: `2px solid ${result.isAIGenerated ? theme.palette.error.light : theme.palette.success.light}`,
            background: `linear-gradient(135deg, ${
              result.isAIGenerated 
                ? 'rgba(244, 67, 54, 0.05)' 
                : 'rgba(76, 175, 80, 0.05)'
            } 0%, rgba(255, 255, 255, 0.9) 100%)`
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Stack 
                direction={isMobile ? "column" : "row"} 
                spacing={2} 
                alignItems="center" 
                justifyContent="center" 
                sx={{ mb: { xs: 2, sm: 3 } }}
              >
                <Box sx={{ 
                  fontSize: { xs: '2rem', sm: '2.5rem' },
                  color: `${getResultColor(result.isAIGenerated)}.main`,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                }}>
                  {getResultIcon(result.isAIGenerated)}
                </Box>
                
                <Typography 
                  variant={isMobile ? "h6" : "h5"} 
                  component="h3" 
                  color={`${getResultColor(result.isAIGenerated)}.main`}
                  sx={{ 
                    fontWeight: 700,
                    textAlign: isMobile ? 'center' : 'left'
                  }}
                >
                  {result.isAIGenerated ? t('results.aiGenerated') : t('results.natural')}
                </Typography>
              </Stack>

              {/* نسبة الثقة */}
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body1" fontWeight="medium">
                    {t('results.confidence')}
                  </Typography>
                  <Chip
                    label={`${result.confidenceScore}%`}
                    color={getConfidenceColor(result.confidenceScore)}
                    size="small"
                  />
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={result.confidenceScore}
                  color={getConfidenceColor(result.confidenceScore)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              {/* الشرح */}
              {result.explanation && (
                <Alert
                  severity="info"
                  icon={<InfoIcon />}
                  sx={{ mb: 3 }}
                >
                  <Typography variant="body2">
                    {result.explanation}
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      </Zoom>

      {/* تفاصيل التحليل */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                تفاصيل التحليل
              </Typography>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('results.method')}
                  </Typography>
                  <Typography variant="body1">
                    {result.detectionMethod}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('results.processingTime')}
                  </Typography>
                  <Typography variant="body1">
                    {formatProcessingTime(result.processingTime)}
                  </Typography>
                </Box>

                {result.detectedFeatures && result.detectedFeatures.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {t('results.detectedFeatures')}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {result.detectedFeatures.map((feature, index) => (
                        <Chip
                          key={index}
                          label={feature}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('results.fileInfo')}
              </Typography>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('results.fileName')}
                  </Typography>
                  <Typography variant="body1">
                    {result.fileInfo.name}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('results.fileSize')}
                  </Typography>
                  <Typography variant="body1">
                    {formatFileSize(result.fileInfo.size)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('results.fileType')}
                  </Typography>
                  <Typography variant="body1">
                    {result.fileInfo.type}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('results.uploadDate')}
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(result.fileInfo.uploadTime)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* إحصائيات إضافية */}
      {result.processingTime > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              إحصائيات الأداء
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary.main">
                    {formatProcessingTime(result.processingTime)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    وقت التحليل
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary.main">
                    {result.confidenceScore}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    نسبة الثقة
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* أزرار الإجراءات */}
      <Stack 
        direction={isMobile ? "column" : "row"} 
        spacing={2} 
        justifyContent="center"
      >
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={onNewAnalysis}
          size="large"
          sx={{ 
            px: 4,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
              transform: 'translateY(-1px)'
            }
          }}
        >
          {t('results.analyzeNew')}
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          size="large"
          sx={{ 
            px: 4,
            borderRadius: 2,
            '&:hover': {
              transform: 'translateY(-1px)'
            }
          }}
        >
          {t('results.downloadReport')}
        </Button>
      </Stack>
    </Box>
  );
};

export default AnalysisResults;