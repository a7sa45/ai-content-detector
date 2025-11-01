import React, { useState } from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import SimpleFileUploader from './components/SimpleFileUploader';
import SimpleAnalysisResults from './components/SimpleAnalysisResults';
import HowItWorks from './components/HowItWorks';
import { useAnalysis } from './hooks/useAnalysis';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'home' | 'how-it-works'>('home');
  
  const { 
    analysisResult, 
    isAnalyzing, 
    error, 
    analyzeFile, 
    resetAnalysis,
    uploadProgress,
    compressionEnabled,
    setCompressionEnabled
  } = useAnalysis();

  // عرض صفحة "كيف يعمل"
  if (currentPage === 'how-it-works') {
    return <HowItWorks onBack={() => setCurrentPage('home')} />;
  }

  // الصفحة الرئيسية
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: '#ffffff',
      py: { xs: 4, sm: 6, md: 8 },
      direction: 'rtl'
    }} dir="rtl">
      <Container maxWidth="md" sx={{ px: { xs: 3, sm: 4 }, direction: 'rtl' }} dir="rtl">
        
        {/* Header بسيط */}
        <Box textAlign="center" mb={{ xs: 6, sm: 8 }} sx={{ direction: 'rtl' }}>
          <Typography 
            variant="h1" 
            component="h1" 
            gutterBottom
            sx={{ 
              mb: 3,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              direction: 'rtl',
              textAlign: 'center'
            }}
          >
            🔍 كاشف المحتوى الذكي
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ 
              maxWidth: 500, 
              mx: 'auto',
              fontSize: '1.125rem',
              lineHeight: 1.6,
              mb: 4
            }}
          >
            اكتشف ما إذا كانت الصورة أو الفيديو أو الصوت مولد بالذكاء الاصطناعي
          </Typography>

          <Button
            variant="outlined"
            size="large"
            onClick={() => setCurrentPage('how-it-works')}
            sx={{ 
              px: 4, 
              py: 1.5,
              fontSize: '1rem',
              borderRadius: 2
            }}
          >
            🔬 كيف يعمل النظام؟
          </Button>
        </Box>

        {/* المحتوى الرئيسي */}
        <Box sx={{ mb: 8 }}>
          {!analysisResult ? (
            <SimpleFileUploader
              onFileAnalyze={analyzeFile}
              isAnalyzing={isAnalyzing}
              error={error}
              uploadProgress={uploadProgress}
              compressionEnabled={compressionEnabled}
              onCompressionToggle={setCompressionEnabled}
            />
          ) : (
            <SimpleAnalysisResults
              result={analysisResult}
              onNewAnalysis={resetAnalysis}
              onShowHowItWorks={() => setCurrentPage('how-it-works')}
            />
          )}
        </Box>

        {/* Footer بسيط */}
        <Box 
          textAlign="center" 
          pt={4}
          sx={{ 
            borderTop: '1px solid #e0e0e0',
            mt: 8
          }}
        >
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: '0.875rem', mb: 2 }}
          >
            🛡️ نحترم خصوصيتك - يتم حذف الملفات فوراً بعد التحليل
          </Typography>
          
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
            </a> | © 2025 جميع الحقوق محفوظة
          </Typography>
        </Box>
        
      </Container>
    </Box>
  );
};

export default App;