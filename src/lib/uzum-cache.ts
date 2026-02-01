/**
 * Система кеширования для UZUM интеграции
 * 
 * Проблема: При переходе между разделами данные загружаются заново
 * Решение: Кешируем данные в памяти и переиспользуем при навигации
 * 
 * Особенности:
 * - Данные загружаются только 1 раз при первом входе
 * - При переходе между разделами используются закешированные данные
 * - Можно принудительно обновить через кнопку "Обновить"
 * - При выходе из интеграции кеш очищается автоматически
 */

interface CachedData {
  shops: any[] | null;
  products: any[] | null;
  orders: any[] | null;
  financeOrders: any[] | null;
  financeExpenses: any[] | null;
  stocks: any[] | null;
  invoices: any[] | null;
  returns: any[] | null;
  shopInvoices: any[] | null;
  stats: {
    totalProducts: number;
    activeOrders: number;
    pendingOrders: number;
    revenue: number;
    toPay: number;
    profit: number;
    fboStock: number;
    fbsStock: number;
    dbsStock: number;
  } | null;
  lastUpdate: number | null;
}

interface CacheInstance {
  token: string;
  shopId: number | null;
  data: CachedData;
}

// Глобальный кеш (сбрасывается при перезагрузке страницы)
let globalCache: CacheInstance | null = null;

// TTL кеша - 5 минут (300000 мс)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Инициализация кеша для новой сессии
 */
export function initCache(token: string, shopId: number | null = null): void {
  console.log('🗄️ [Cache] Initializing cache for new session');
  globalCache = {
    token,
    shopId,
    data: {
      shops: null,
      products: null,
      orders: null,
      financeOrders: null,
      financeExpenses: null,
      stocks: null,
      invoices: null,
      returns: null,
      shopInvoices: null,
      stats: null,
      lastUpdate: null,
    },
  };
}

/**
 * Очистка кеша (при выходе из интеграции)
 */
export function clearCache(): void {
  console.log('🗑️ [Cache] Clearing cache');
  globalCache = null;
}

/**
 * Проверка валидности кеша
 */
export function isCacheValid(): boolean {
  if (!globalCache || !globalCache.data.lastUpdate) {
    return false;
  }

  const age = Date.now() - globalCache.data.lastUpdate;
  const isValid = age < CACHE_TTL;

  console.log(`🕐 [Cache] Cache age: ${Math.round(age / 1000)}s, valid: ${isValid}`);
  
  return isValid;
}

/**
 * Проверка наличия данных в кеше
 */
export function hasCachedData(key: keyof CachedData): boolean {
  if (!globalCache) return false;
  
  const hasData = globalCache.data[key] !== null;
  console.log(`🔍 [Cache] Check ${key}: ${hasData ? '✓ cached' : '✗ not cached'}`);
  
  return hasData;
}

/**
 * Получение данных из кеша
 */
export function getCachedData<T>(key: keyof CachedData): T | null {
  if (!globalCache) {
    console.log(`⚠️ [Cache] Cache not initialized`);
    return null;
  }

  const data = globalCache.data[key] as T | null;
  
  if (data !== null) {
    console.log(`✅ [Cache] Retrieved ${key} from cache`);
  } else {
    console.log(`❌ [Cache] ${key} not in cache`);
  }
  
  return data;
}

/**
 * Сохранение данных в кеш
 */
export function setCachedData<T>(key: keyof CachedData, data: T): void {
  if (!globalCache) {
    console.warn('⚠️ [Cache] Cannot set data - cache not initialized');
    return;
  }

  (globalCache.data[key] as any) = data;
  globalCache.data.lastUpdate = Date.now();
  
  console.log(`💾 [Cache] Saved ${key} to cache`);
}

/**
 * Обновление Shop ID в кеше
 */
export function updateShopId(shopId: number): void {
  if (globalCache) {
    globalCache.shopId = shopId;
    console.log(`🏪 [Cache] Updated shopId: ${shopId}`);
  }
}

/**
 * Получение текущего Shop ID
 */
export function getCachedShopId(): number | null {
  return globalCache?.shopId || null;
}

/**
 * Принудительная инвалидация кеша (для кнопки "Обновить")
 */
export function invalidateCache(): void {
  if (globalCache) {
    console.log('🔄 [Cache] Invalidating cache - forcing reload');
    globalCache.data.lastUpdate = null;
    
    // Очищаем все данные кроме shopId и token
    globalCache.data = {
      shops: null,
      products: null,
      orders: null,
      financeOrders: null,
      financeExpenses: null,
      stocks: null,
      invoices: null,
      returns: null,
      shopInvoices: null,
      stats: null,
      lastUpdate: null,
    };
  }
}

/**
 * Получение информации о состоянии кеша (для отладки)
 */
export function getCacheInfo(): {
  initialized: boolean;
  hasData: boolean;
  age: number | null;
  valid: boolean;
  cachedKeys: string[];
} {
  if (!globalCache) {
    return {
      initialized: false,
      hasData: false,
      age: null,
      valid: false,
      cachedKeys: [],
    };
  }

  const cachedKeys = Object.keys(globalCache.data).filter(
    key => key !== 'lastUpdate' && (globalCache!.data as any)[key] !== null
  );

  const age = globalCache.data.lastUpdate 
    ? Date.now() - globalCache.data.lastUpdate 
    : null;

  return {
    initialized: true,
    hasData: cachedKeys.length > 0,
    age,
    valid: isCacheValid(),
    cachedKeys,
  };
}

/**
 * Логирование состояния кеша
 */
export function logCacheState(): void {
  const info = getCacheInfo();
  console.log('📊 [Cache] State:', {
    initialized: info.initialized,
    hasData: info.hasData,
    age: info.age ? `${Math.round(info.age / 1000)}s` : 'N/A',
    valid: info.valid,
    cachedKeys: info.cachedKeys,
  });
}

export default {
  initCache,
  clearCache,
  isCacheValid,
  hasCachedData,
  getCachedData,
  setCachedData,
  updateShopId,
  getCachedShopId,
  invalidateCache,
  getCacheInfo,
  logCacheState,
};
