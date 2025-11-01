import React from 'react';
import {
  Box,
  Typography,
  Container,
  Stack,
  Button,
} from '@mui/material';

interface HowItWorksProps {
  onBack: () => void;
}

const HowItWorks: React.FC<HowItWorksProps> = ({ onBack }) => {
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: '#ffffff',
      py: { xs: 4, sm: 6, md: 8 },
      direction: 'rtl'
    }} dir="rtl">
      <Container maxWidth="md" sx={{ px: { xs: 3, sm: 4 }, direction: 'rtl' }} dir="rtl">
        
        {/* Header */}
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
            🔬 كيف يعمل النظام؟
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ 
              maxWidth: 600, 
              mx: 'auto',
              fontSize: '1.125rem',
              lineHeight: 1.6,
              mb: 4
            }}
          >
            نستخدم 8 طرق تحليل متقدمة للتمييز بين المحتوى الطبيعي والمولد بالذكاء الاصطناعي
          </Typography>

          <Button
            variant="outlined"
            onClick={onBack}
            sx={{ mb: 4 }}
          >
            العودة للرئيسية ←
          </Button>
        </Box>

        {/* كيف يعمل التحليل */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h2" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
            🎯 عملية التحليل
          </Typography>
          
          <Stack spacing={4}>
            <Box sx={{ 
              p: 4, 
              border: '1px solid #e0e0e0', 
              borderRadius: 2,
              backgroundColor: '#f9f9f9'
            }}>
              <Typography variant="h3" gutterBottom>
                1️⃣ رفع الملف
              </Typography>
              <Typography variant="body1" color="text.secondary">
                تقوم برفع الصورة أو الفيديو أو الملف الصوتي إلى النظام بشكل آمن ومشفر
              </Typography>
            </Box>

            <Box sx={{ 
              p: 4, 
              border: '1px solid #e0e0e0', 
              borderRadius: 2,
              backgroundColor: '#f9f9f9'
            }}>
              <Typography variant="h3" gutterBottom>
                2️⃣ التحليل المتعدد
              </Typography>
              <Typography variant="body1" color="text.secondary">
                يقوم النظام بتشغيل 8 أنواع مختلفة من التحليل بالتوازي لفحص الملف من جميع الجوانب
              </Typography>
            </Box>

            <Box sx={{ 
              p: 4, 
              border: '1px solid #e0e0e0', 
              borderRadius: 2,
              backgroundColor: '#f9f9f9'
            }}>
              <Typography variant="h3" gutterBottom>
                3️⃣ حساب النتيجة
              </Typography>
              <Typography variant="body1" color="text.secondary">
                يتم دمج نتائج جميع التحليلات لحساب نسبة الثقة والوصول للنتيجة النهائية
              </Typography>
            </Box>

            <Box sx={{ 
              p: 4, 
              border: '1px solid #e0e0e0', 
              borderRadius: 2,
              backgroundColor: '#f9f9f9'
            }}>
              <Typography variant="h3" gutterBottom>
                4️⃣ عرض النتائج
              </Typography>
              <Typography variant="body1" color="text.secondary">
                تحصل على تقرير مفصل يوضح النتيجة ونسبة الثقة والأدلة المكتشفة
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* تحليل الصور */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h2" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
            🖼️ كيف نحلل الصور
          </Typography>
          
          <Stack spacing={3}>
            <Box sx={{ 
              p: 3, 
              border: '1px solid #e0e0e0', 
              borderRadius: 2 
            }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', textAlign: 'right', direction: 'rtl' }}>
                📊 فحص بيانات EXIF
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2, textAlign: 'right', direction: 'rtl' }}>
                نفحص البيانات المخفية في الصورة مثل:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right', direction: 'rtl' }}>
                • معلومات الكاميرا والعدسة<br/>
                • تاريخ ووقت التقاط الصورة<br/>
                • إعدادات التصوير (ISO، فتحة العدسة، سرعة الغالق)<br/>
                • برامج التعديل المستخدمة
              </Typography>
            </Box>

            <Box sx={{ 
              p: 3, 
              border: '1px solid #e0e0e0', 
              borderRadius: 2 
            }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#1976d2' }}>
                🌈 تحليل الألوان والضوضاء
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                نحلل الأنماط اللونية والضوضاء:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • توزيع الألوان في الصورة<br/>
                • أنماط الضوضاء الطبيعية مقابل المصطنعة<br/>
                • القمم اللونية غير الطبيعية<br/>
                • التدرجات المثالية المشبوهة
              </Typography>
            </Box>

            <Box sx={{ 
              p: 3, 
              border: '1px solid #e0e0e0', 
              borderRadius: 2 
            }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#1976d2' }}>
                ⚡ فحص الحواف والتفاصيل
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                نفحص جودة ونوعية الحواف:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • اتساق الحواف مع باقي الصورة<br/>
                • الحواف المثالية جداً (مشبوهة)<br/>
                • التفاصيل الدقيقة والملمس<br/>
                • الانتقالات بين المناطق المختلفة
              </Typography>
            </Box>

            <Box sx={{ 
              p: 3, 
              border: '1px solid #e0e0e0', 
              borderRadius: 2 
            }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#1976d2' }}>
                🔄 كشف الأنماط المتكررة
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                الذكاء الاصطناعي يميل للتكرار:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • الأنماط الدورية في الألوان<br/>
                • التكرار في الأشكال والملامس<br/>
                • التماثل المثالي غير الطبيعي<br/>
                • قلة التنوع الطبيعي
              </Typography>
            </Box>

            <Box sx={{ 
              p: 3, 
              border: '1px solid #e0e0e0', 
              borderRadius: 2 
            }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#1976d2' }}>
                🛠️ تحديد الأدوات المستخدمة
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                نحدد البرنامج المستخدم:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • أدوات تقليدية: فوتوشوب، لايتروم، جيمب<br/>
                • أدوات ذكاء اصطناعي: Midjourney، DALL-E، Stable Diffusion<br/>
                • بصمات مميزة لكل أداة<br/>
                • تحليل اسم الملف والبيانات الوصفية
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* تحليل الفيديو */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h2" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
            🎬 كيف نحلل الفيديو
          </Typography>
          
          <Stack spacing={3}>
            <Box sx={{ 
              p: 3, 
              border: '1px solid #e0e0e0', 
              borderRadius: 2 
            }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#1976d2' }}>
                🎭 كشف Deepfake
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                نحلل حركة الوجوه والتعبيرات:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • حركة العيون والرمش الطبيعي<br/>
                • تزامن حركة الشفاه مع الكلام<br/>
                • تعبيرات الوجه الطبيعية<br/>
                • اتساق الإضاءة على الوجه
              </Typography>
            </Box>

            <Box sx={{ 
              p: 3, 
              border: '1px solid #e0e0e0', 
              borderRadius: 2 
            }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#1976d2' }}>
                🎞️ تحليل الإطارات
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                نفحص التناسق بين إطارات الفيديو:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • التناسق في الحركة<br/>
                • التغيرات المفاجئة غير الطبيعية<br/>
                • جودة الانتقال بين الإطارات<br/>
                • أنماط الضغط المشبوهة
              </Typography>
            </Box>

            <Box sx={{ 
              p: 3, 
              border: '1px solid #e0e0e0', 
              borderRadius: 2 
            }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#1976d2' }}>
                💡 فحص الإضاءة
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                نحلل منطقية الإضاءة:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • اتجاه الإضاءة الطبيعي<br/>
                • الظلال المنطقية<br/>
                • التناسق في مصادر الضوء<br/>
                • الانعكاسات الطبيعية
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* تحليل الصوت */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h2" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
            🎵 كيف نحلل الصوت
          </Typography>
          
          <Stack spacing={3}>
            <Box sx={{ 
              p: 3, 
              border: '1px solid #e0e0e0', 
              borderRadius: 2 
            }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#1976d2' }}>
                🌊 تحليل الطيف الصوتي
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                نفحص الترددات والأنماط الصوتية:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • توزيع الترددات الطبيعي<br/>
                • الترددات غير الطبيعية المولدة<br/>
                • أنماط الطيف المميزة للAI<br/>
                • جودة الصوت والضوضاء الخلفية
              </Typography>
            </Box>

            <Box sx={{ 
              p: 3, 
              border: '1px solid #e0e0e0', 
              borderRadius: 2 
            }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#1976d2' }}>
                🫁 فحص أنماط التنفس
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                الأصوات الطبيعية لها أنماط تنفس مميزة:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • أصوات التنفس الطبيعية<br/>
                • الوقفات الطبيعية في الكلام<br/>
                • تغيرات النبرة الطبيعية<br/>
                • الأصوات الخلفية البيئية
              </Typography>
            </Box>

            <Box sx={{ 
              p: 3, 
              border: '1px solid #e0e0e0', 
              borderRadius: 2 
            }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#1976d2' }}>
                🎤 كشف الأصوات المصطنعة
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                نحدد علامات التوليد الصناعي:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • الأنماط المتكررة في النطق<br/>
                • النبرة المثالية جداً<br/>
                • عدم وجود أخطاء طبيعية في النطق<br/>
                • الانتقالات الحادة بين الكلمات
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* نسبة الثقة */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h2" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
            📊 كيف نحسب نسبة الثقة
          </Typography>
          
          <Box sx={{ 
            p: 4, 
            border: '1px solid #e0e0e0', 
            borderRadius: 2,
            backgroundColor: '#f9f9f9'
          }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h4" gutterBottom sx={{ color: '#4caf50' }}>
                  ✅ 0-30% - طبيعي جداً
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  المحتوى طبيعي أو معدل بأدوات تقليدية
                </Typography>
              </Box>

              <Box>
                <Typography variant="h4" gutterBottom sx={{ color: '#2196f3' }}>
                  🤔 31-50% - مشكوك فيه قليلاً
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  قد يكون معدل لكن بطريقة طبيعية
                </Typography>
              </Box>

              <Box>
                <Typography variant="h4" gutterBottom sx={{ color: '#ff9800' }}>
                  ⚠️ 51-70% - مشكوك فيه
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  علامات مشبوهة تحتاج فحص إضافي
                </Typography>
              </Box>

              <Box>
                <Typography variant="h4" gutterBottom sx={{ color: '#f44336' }}>
                  🚨 71-100% - مولد بالذكاء الاصطناعي
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ثقة عالية أن المحتوى مولد بالAI
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>

        {/* الخصوصية والأمان */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h2" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
            🛡️ الخصوصية والأمان
          </Typography>
          
          <Stack spacing={3}>
            <Box sx={{ 
              p: 3, 
              border: '1px solid #4caf50', 
              borderRadius: 2,
              backgroundColor: '#e8f5e8'
            }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#2e7d32' }}>
                🔒 حماية كاملة للخصوصية
              </Typography>
              <Typography variant="body1" color="text.secondary">
                • يتم حذف جميع الملفات فوراً بعد التحليل<br/>
                • لا نحتفظ بأي نسخ من ملفاتك<br/>
                • التشفير الكامل أثناء النقل والمعالجة<br/>
                • لا نشارك أي بيانات مع أطراف ثالثة
              </Typography>
            </Box>

            <Box sx={{ 
              p: 3, 
              border: '1px solid #2196f3', 
              borderRadius: 2,
              backgroundColor: '#e3f2fd'
            }}>
              <Typography variant="h4" gutterBottom sx={{ color: '#1565c0' }}>
                ⚡ معالجة سريعة وآمنة
              </Typography>
              <Typography variant="body1" color="text.secondary">
                • التحليل يتم محلياً على خوادمنا الآمنة<br/>
                • لا نرسل ملفاتك لأطراف خارجية<br/>
                • نتائج فورية خلال ثوانٍ<br/>
                • حماية متقدمة ضد الهجمات السيبرانية
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* زر العودة */}
        <Box textAlign="center" sx={{ mb: 6 }}>
          <Button
            variant="contained"
            size="large"
            onClick={onBack}
            sx={{ 
              px: 6, 
              py: 2,
              fontSize: '1.125rem'
            }}
          >
            🚀 جرب النظام الآن
          </Button>
        </Box>

        {/* معلومات المطور */}
        <Box 
          textAlign="center" 
          pt={4}
          sx={{ 
            borderTop: '1px solid #e0e0e0',
            mt: 6
          }}
        >
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: '0.875rem', mb: 1 }}
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
          
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: '0.75rem' }}
          >
            © 2025 جميع الحقوق محفوظة
          </Typography>
        </Box>

      </Container>
    </Box>
  );
};

export default HowItWorks;