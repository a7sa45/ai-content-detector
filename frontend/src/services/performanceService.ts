// خدمة تحسين أداء الواجهة الأمامية

// تحسين تحميل الصور
export const optimizeImageLoading = () => {
  // تحميل كسول للصور
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src || '';
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
};

// ضغط الملفات قبل الرفع
export const compressFileBeforeUpload = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    // للصور فقط
    if (file.type.startsWith('image/')) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // تحديد الحد الأقصى للأبعاد
        const maxWidth = 1920;
        const maxHeight = 1080;
        
        let { width, height } = img;
        
        // تصغير الحجم إذا كان كبيراً
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // رسم الصورة المضغوطة
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8); // جودة 80%
      };
      
      img.src = URL.createObjectURL(file);
    } else {
      // للملفات الأخرى، إرجاع الملف كما هو
      resolve(file);
    }
  });
};

// مراقب أداء الشبكة
export class NetworkPerformanceMonitor {
  private static instance: NetworkPerformanceMonitor;
  private metrics: {
    uploadSpeed: number;
    downloadSpeed: number;
    latency: number;
    connectionType: string;
  } = {
    uploadSpeed: 0,
    downloadSpeed: 0,
    latency: 0,
    connectionType: 'unknown'
  };

  static getInstance(): NetworkPerformanceMonitor {
    if (!NetworkPerformanceMonitor.instance) {
      NetworkPerformanceMonitor.instance = new NetworkPerformanceMonitor();
    }
    return NetworkPerformanceMonitor.instance;
  }

  async measureLatency(): Promise<number> {
    try {
      const start = performance.now();
      await fetch('/api/health', { method: 'HEAD' });
      const end = performance.now();
      
      this.metrics.latency = end - start;
      return this.metrics.latency;
    } catch (error) {
      console.error('فشل في قياس زمن الاستجابة:', error);
      return 0;
    }
  }

  measureUploadSpeed(fileSize: number, uploadTime: number): number {
    // حساب سرعة الرفع بالكيلوبايت/ثانية
    const speedKBps = (fileSize / 1024) / (uploadTime / 1000);
    this.metrics.uploadSpeed = speedKBps;
    return speedKBps;
  }

  getConnectionInfo(): string {
    // @ts-ignore - Navigator.connection قد لا يكون متوفراً في جميع المتصفحات
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      this.metrics.connectionType = connection.effectiveType || 'unknown';
      return connection.effectiveType;
    }
    
    return 'unknown';
  }

  getMetrics() {
    return { ...this.metrics };
  }

  // تحديد ما إذا كان الاتصال بطيئاً
  isSlowConnection(): boolean {
    const connectionType = this.getConnectionInfo();
    return connectionType === 'slow-2g' || connectionType === '2g';
  }

  // اقتراح إعدادات محسنة بناءً على الأداء
  getOptimizationSuggestions(): {
    compressImages: boolean;
    reduceQuality: boolean;
    showProgress: boolean;
    chunkUpload: boolean;
  } {
    const isSlowConnection = this.isSlowConnection();
    const highLatency = this.metrics.latency > 1000; // أكثر من ثانية
    
    return {
      compressImages: isSlowConnection || this.metrics.uploadSpeed < 100, // أقل من 100 KB/s
      reduceQuality: isSlowConnection,
      showProgress: true, // دائماً اعرض التقدم
      chunkUpload: this.metrics.uploadSpeed < 50 // رفع مجزأ للاتصالات البطيئة جداً
    };
  }
}

// تحسين استخدام الذاكرة
export const optimizeMemoryUsage = () => {
  // تنظيف URLs المؤقتة
  const cleanupObjectURLs = () => {
    // هذه دالة يجب استدعاؤها بعد استخدام createObjectURL
    console.log('تنظيف URLs المؤقتة...');
  };

  // مراقبة استخدام الذاكرة
  const monitorMemoryUsage = () => {
    // @ts-ignore - performance.memory قد لا يكون متوفراً في جميع المتصفحات
    if (performance.memory) {
      // @ts-ignore
      const memoryInfo = performance.memory;
      console.log('استخدام الذاكرة:', {
        used: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) + ' MB',
        total: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024) + ' MB',
        limit: Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024) + ' MB'
      });
    }
  };

  return { cleanupObjectURLs, monitorMemoryUsage };
};

// تحسين تجربة المستخدم بناءً على الأداء
export const adaptUIForPerformance = () => {
  const monitor = NetworkPerformanceMonitor.getInstance();
  const suggestions = monitor.getOptimizationSuggestions();
  
  return {
    shouldShowCompressionOption: suggestions.compressImages,
    shouldReduceAnimations: monitor.isSlowConnection(),
    shouldShowDetailedProgress: suggestions.showProgress,
    shouldUseChunkedUpload: suggestions.chunkUpload,
    recommendedImageQuality: suggestions.reduceQuality ? 'low' : 'high'
  };
};

// دالة لقياس أداء العمليات
export const measurePerformance = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - start;
    
    console.log(`⚡ ${operationName} اكتملت في ${Math.round(duration)}ms`);
    
    return { result, duration };
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`❌ ${operationName} فشلت بعد ${Math.round(duration)}ms:`, error);
    throw error;
  }
};

// تصدير singleton للمراقب
export const networkMonitor = NetworkPerformanceMonitor.getInstance();