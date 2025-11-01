import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// إعدادات تحسين الأداء
const API_OPTIMIZATION_CONFIG = {
  timeout: 30000, // 30 ثانية
  maxRetries: 2,
  retryDelay: 1000, // ثانية واحدة
  connectionPooling: true,
  keepAlive: true,
  maxSockets: 10
};

// إنشاء instance محسن من axios
const optimizedAxios = axios.create({
  timeout: API_OPTIMIZATION_CONFIG.timeout,
  headers: {
    'Connection': 'keep-alive',
    'Keep-Alive': 'timeout=5, max=1000'
  },
  // تفعيل ضغط البيانات
  decompress: true,
  maxContentLength: 50 * 1024 * 1024, // 50 ميجابايت
  maxBodyLength: 50 * 1024 * 1024
});

// إضافة interceptor لتحسين الطلبات
optimizedAxios.interceptors.request.use(
  (config) => {
    // إضافة ضغط للطلبات الكبيرة
    if (config.headers) {
      config.headers['Accept-Encoding'] = 'gzip, deflate, br';
    }
    
    console.log(`📤 طلب API: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('خطأ في إعداد الطلب:', error);
    return Promise.reject(error);
  }
);

// إضافة interceptor لمعالجة الاستجابات
optimizedAxios.interceptors.response.use(
  (response) => {
    console.log(`📥 استجابة API: ${response.status} - ${response.config.url} - ${response.headers['content-length'] || 'unknown'} bytes`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`❌ خطأ API: ${error.response.status} - ${error.config?.url}`);
    } else if (error.request) {
      console.error(`🔌 خطأ شبكة: ${error.config?.url}`);
    } else {
      console.error('خطأ في إعداد الطلب:', error.message);
    }
    return Promise.reject(error);
  }
);

// دالة طلب محسنة مع إعادة المحاولة
export const optimizedRequest = async <T = any>(
  config: AxiosRequestConfig,
  retries: number = API_OPTIMIZATION_CONFIG.maxRetries
): Promise<AxiosResponse<T>> => {
  try {
    const startTime = Date.now();
    const response = await optimizedAxios.request<T>(config);
    const duration = Date.now() - startTime;
    
    console.log(`⚡ طلب API مكتمل في ${duration}ms`);
    return response;
    
  } catch (error: any) {
    if (retries > 0 && shouldRetry(error)) {
      console.log(`🔄 إعادة محاولة الطلب... المحاولات المتبقية: ${retries}`);
      
      // انتظار قبل إعادة المحاولة
      await new Promise(resolve => setTimeout(resolve, API_OPTIMIZATION_CONFIG.retryDelay));
      
      return optimizedRequest(config, retries - 1);
    }
    
    throw error;
  }
};

// تحديد ما إذا كان يجب إعادة المحاولة
const shouldRetry = (error: any): boolean => {
  // إعادة المحاولة للأخطاء المؤقتة
  if (error.code === 'ECONNRESET' || 
      error.code === 'ETIMEDOUT' || 
      error.code === 'ENOTFOUND') {
    return true;
  }
  
  // إعادة المحاولة لرموز HTTP معينة
  if (error.response) {
    const status = error.response.status;
    return status === 429 || // Too Many Requests
           status === 502 || // Bad Gateway
           status === 503 || // Service Unavailable
           status === 504;   // Gateway Timeout
  }
  
  return false;
};

// دالة لطلبات متوازية محسنة
export const parallelRequests = async <T = any>(
  requests: AxiosRequestConfig[],
  maxConcurrency: number = 3
): Promise<Array<AxiosResponse<T> | Error>> => {
  const results: Array<AxiosResponse<T> | Error> = [];
  
  // تقسيم الطلبات إلى مجموعات
  for (let i = 0; i < requests.length; i += maxConcurrency) {
    const batch = requests.slice(i, i + maxConcurrency);
    
    const batchPromises = batch.map(async (config) => {
      try {
        return await optimizedRequest<T>(config);
      } catch (error) {
        return error as Error;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
};

// مراقب أداء API
export class APIPerformanceMonitor {
  private static instance: APIPerformanceMonitor;
  private metrics: Map<string, {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalResponseTime: number;
    averageResponseTime: number;
    lastRequestTime: number;
  }> = new Map();

  static getInstance(): APIPerformanceMonitor {
    if (!APIPerformanceMonitor.instance) {
      APIPerformanceMonitor.instance = new APIPerformanceMonitor();
    }
    return APIPerformanceMonitor.instance;
  }

  recordRequest(apiName: string, responseTime: number, success: boolean): void {
    const current = this.metrics.get(apiName) || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      lastRequestTime: 0
    };

    current.totalRequests++;
    current.totalResponseTime += responseTime;
    current.averageResponseTime = current.totalResponseTime / current.totalRequests;
    current.lastRequestTime = Date.now();

    if (success) {
      current.successfulRequests++;
    } else {
      current.failedRequests++;
    }

    this.metrics.set(apiName, current);
  }

  getMetrics(apiName?: string): any {
    if (apiName) {
      return this.metrics.get(apiName) || null;
    }
    
    const allMetrics: any = {};
    this.metrics.forEach((value, key) => {
      allMetrics[key] = {
        ...value,
        successRate: (value.successfulRequests / value.totalRequests) * 100
      };
    });
    
    return allMetrics;
  }

  resetMetrics(apiName?: string): void {
    if (apiName) {
      this.metrics.delete(apiName);
    } else {
      this.metrics.clear();
    }
  }
}

// دالة مساعدة لطلب API مع مراقبة الأداء
export const monitoredAPIRequest = async <T = any>(
  apiName: string,
  config: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  const monitor = APIPerformanceMonitor.getInstance();
  const startTime = Date.now();
  
  try {
    const response = await optimizedRequest<T>(config);
    const responseTime = Date.now() - startTime;
    
    monitor.recordRequest(apiName, responseTime, true);
    return response;
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    monitor.recordRequest(apiName, responseTime, false);
    throw error;
  }
};

// تصدير instance محسن من axios
export { optimizedAxios };
export default optimizedAxios;