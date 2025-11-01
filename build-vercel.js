#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 إعداد المشروع للنشر على Vercel...');

// 1. نسخ ملفات API الخاصة بـ Vercel
const frontendApiPath = path.join(__dirname, 'frontend/src/services/api.ts');
const vercelApiPath = path.join(__dirname, 'frontend/src/services/api-vercel.ts');

if (fs.existsSync(vercelApiPath)) {
  console.log('📝 تحديث ملف API للعمل مع Vercel...');
  
  // إنشاء نسخة احتياطية من الملف الأصلي
  if (fs.existsSync(frontendApiPath)) {
    fs.copyFileSync(frontendApiPath, frontendApiPath + '.backup');
  }
  
  // استبدال ملف API بالإصدار الخاص بـ Vercel
  fs.copyFileSync(vercelApiPath, frontendApiPath);
  console.log('✅ تم تحديث ملف API');
}

// 2. تحديث hook التحليل
const hookPath = path.join(__dirname, 'frontend/src/hooks/useAnalysis.ts');
const vercelHookPath = path.join(__dirname, 'frontend/src/hooks/useAnalysis-vercel.ts');

if (fs.existsSync(vercelHookPath)) {
  console.log('📝 تحديث hook التحليل للعمل مع Vercel...');
  
  // إنشاء نسخة احتياطية
  if (fs.existsSync(hookPath)) {
    fs.copyFileSync(hookPath, hookPath + '.backup');
  }
  
  // استبدال hook بالإصدار الخاص بـ Vercel
  fs.copyFileSync(vercelHookPath, hookPath);
  console.log('✅ تم تحديث hook التحليل');
}

// 3. تحديث package.json للواجهة الأمامية
const frontendPackagePath = path.join(__dirname, 'frontend/package.json');
if (fs.existsSync(frontendPackagePath)) {
  console.log('📝 تحديث إعدادات البناء...');
  
  const packageJson = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
  
  // إضافة script للبناء على Vercel
  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts['build:vercel'] = 'tsc && vite build';
  packageJson.scripts['vercel-build'] = 'npm run build:vercel';
  
  fs.writeFileSync(frontendPackagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ تم تحديث إعدادات البناء');
}

// 4. إنشاء ملف README خاص بـ Vercel
const vercelReadme = `# 🚀 نشر كاشف المحتوى الذكي على Vercel

## خطوات النشر:

### 1. تحضير المشروع
\`\`\`bash
node build-vercel.js
\`\`\`

### 2. رفع على GitHub
\`\`\`bash
git add .
git commit -m "🔧 إعداد Vercel"
git push
\`\`\`

### 3. النشر على Vercel
1. اذهب إلى [vercel.com](https://vercel.com)
2. ربط حساب GitHub
3. استيراد المشروع
4. إعدادات البناء:
   - **Framework Preset**: Other
   - **Root Directory**: frontend
   - **Build Command**: npm run build
   - **Output Directory**: dist

### 4. متغيرات البيئة (اختياري)
- \`NODE_ENV\`: production
- \`HIVE_API_KEY\`: مفتاح Hive AI (إذا كان متوفراً)

## ملاحظات مهمة:

⚠️ **قيود Vercel:**
- حد أقصى 10MB للملفات
- 30 ثانية timeout للـ functions
- تحليل مبسط (بدون FFmpeg)
- بدون APIs خارجية في الإصدار المجاني

✅ **ما يعمل:**
- رفع الملفات الصغيرة
- تحليل أساسي للصور
- واجهة المستخدم كاملة
- دعم اللغة العربية

🔗 **الرابط المتوقع:**
https://ai-content-detector.vercel.app
`;

fs.writeFileSync(path.join(__dirname, 'VERCEL-README.md'), vercelReadme);
console.log('✅ تم إنشاء دليل Vercel');

console.log('\n🎉 تم إعداد المشروع بنجاح للنشر على Vercel!');
console.log('\n📋 الخطوات التالية:');
console.log('1. git add .');
console.log('2. git commit -m "🔧 إعداد Vercel"');
console.log('3. git push');
console.log('4. اذهب إلى vercel.com وقم بالنشر');
console.log('\n📖 اقرأ VERCEL-README.md للتفاصيل الكاملة');