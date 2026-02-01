/**
 * Uzum Seller API Client
 * 
 * Base URL: https://api-seller.uzum.uz/api/seller-openapi
 * Auth: RAW token without Bearer prefix
 * Authorization header: <token>
 */

// Используем прокси всегда (обязательно из-за CORS)
// В dev - Vite proxy, в prod - Supabase Edge Function или Cloudflare
const USE_PROXY = true;
const PROXY_URL = import.meta.env.DEV 
  ? '/api/uzum-proxy'  // Vite proxy в разработке
  : 'https://ykbouygdeqrohizeqlmc.supabase.co/functions/v1/uzum-proxy'; // Supabase Edge Function в продакшене

// Rate limiting configuration
const RATE_LIMIT_DELAY = 500; // минимальная задержка между запросами (мс)
const MAX_RETRIES = 3; // максимальное количество повторов
const INITIAL_RETRY_DELAY = 1000; // начальная задержка при повторе (мс)

// Очередь запросов для rate limiting
let requestQueue: Promise<any> = Promise.resolve();
let lastRequestTime = 0;

/**
 * Добавить задержку для rate limiting
 */
async function rateLimitDelay() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

/**
 * Задержка с exponential backoff
 */
async function exponentialBackoff(attempt: number) {
  const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
  console.log(`⏳ Waiting ${delay}ms before retry (attempt ${attempt + 1}/${MAX_RETRIES})`);
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Base API request handler with rate limiting and retry
 */
async function apiRequest<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  // Добавляем запрос в очередь для rate limiting
  return requestQueue = requestQueue.then(async () => {
    await rateLimitDelay();
    
    // Попытки с retry при ошибке 429
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        let response: Response;

        if (USE_PROXY) {
          // Используем прокси
          const proxyBody: any = {
            path: endpoint,
            method: options.method || 'GET',
            headers: {
              'Authorization': token,
            },
          };

          // Добавляем body только если он есть и метод не GET
          if (options.body && options.method && options.method !== 'GET') {
            proxyBody.body = typeof options.body === 'string' 
              ? JSON.parse(options.body) 
              : options.body;
          }

          if (attempt === 0) {
            console.log('🔹 [Uzum API Client] Request:', {
              url: PROXY_URL,
              proxyBody: JSON.stringify(proxyBody)
            });
          }

          response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            },
            body: JSON.stringify(proxyBody),
          });
        } else {
          // Прямой запрос (продакшен - Uzum API разрешает CORS)
          const url = `https://api-seller.uzum.uz/api/seller-openapi${endpoint}`;
          response = await fetch(url, {
            ...options,
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Origin': window.location.origin,
              'Referer': window.location.href,
              ...options.headers,
            },
            mode: 'cors',
            credentials: 'omit',
          });
        }

        const status = response.status;

        // Обработка ошибки 429 - Too Many Requests
        if (status === 429) {
          if (attempt < MAX_RETRIES - 1) {
            console.warn(`⚠️ Rate limit exceeded (429), retrying... (${attempt + 1}/${MAX_RETRIES})`);
            await exponentialBackoff(attempt);
            continue; // повторяем попытку
          } else {
            console.error('❌ Max retries reached for rate limiting');
            return { error: 'Превышен лимит запросов. Попробуйте позже', status };
          }
        }

        if (!response.ok) {
          // Логируем тело ошибки для отладки
          const errorText = await response.text();
          console.error(`API Error ${status}:`, errorText);
          
          if (status === 401) return { error: 'Неверный токен', status };
          if (status === 403) return { error: 'Доступ запрещён', status };
          if (status === 404) return { error: 'Ресурс не найден', status };
          if (status === 400) return { error: `Неверный запрос: ${errorText}`, status };
          if (status >= 500) return { error: 'Ошибка сервера', status };
          
          return { error: `Ошибка ${status}`, status };
        }

        const data = await response.json();
        
        // Uzum API возвращает ответ в формате { payload: ..., timestamp: ... }
        // Извлекаем payload если он есть
        if (data && typeof data === 'object' && 'payload' in data) {
          console.log('📦 [API] Extracted payload from response');
          return { data: data.payload, status };
        }
        
        return { data, status };
      } catch (error: any) {
        if (attempt < MAX_RETRIES - 1) {
          console.warn(`⚠️ Request failed, retrying... (${attempt + 1}/${MAX_RETRIES})`, error.message);
          await exponentialBackoff(attempt);
          continue;
        }
        console.error('API Request error:', error);
        return {
          error: error.message || 'Ошибка сети',
          status: 0
        };
      }
    }
    
    // Не должно сюда попасть, но на всякий случай
    return { error: 'Неизвестная ошибка', status: 0 };
  });
}

// ============================================================================
// Shop - Магазины
// ============================================================================

/**
 * GET /v1/shops - Получение списка собственных магазинов
 */
export async function getShops(token: string): Promise<{
  success: boolean;
  shops?: any[];
  error?: string;
}> {
  const result = await apiRequest<any[]>('/v1/shops', token, { method: 'GET' });

  if (result.error) {
    return { success: false, error: result.error };
  }

  console.log('🏪 Raw shops API response:', result.data);
  
  const shops = Array.isArray(result.data) ? result.data : [];
  
  console.log('🏪 Parsed shops:', shops);
  
  return { success: true, shops };
}

// ============================================================================
// Product - Товары
// ============================================================================

/**
 * GET /v1/product/shop/{shopId} - Получение SKU по ID магазина
 */
export async function getProducts(
  token: string,
  shopId: number | string
): Promise<{
  success: boolean;
  products?: any[];
  total?: number;
  error?: string;
}> {
  const result = await apiRequest<any>(
    `/v1/product/shop/${shopId}?size=100&page=0`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  console.log('📦 Raw products API response:', result.data);
  
  // API может возвращать разные структуры:
  // Вариант 1: { productList: [...], totalProductsAmount: number }
  // Вариант 2: Прямой массив [...]
  // Вариант 3: { content: [...], totalElements: number }
  let products = [];
  let total = 0;
  
  if (result.data) {
    if (Array.isArray(result.data)) {
      products = result.data;
      total = products.length;
    } else if (result.data.productList) {
      products = result.data.productList;
      total = result.data.totalProductsAmount || products.length;
    } else if (result.data.content) {
      products = result.data.content;
      total = result.data.totalElements || products.length;
    } else if (result.data.data) {
      products = Array.isArray(result.data.data) ? result.data.data : [];
      total = result.data.total || products.length;
    }
  }
  
  console.log('📦 Parsed products:', { productsCount: products.length, total, firstProduct: products[0] });
  
  return { success: true, products, total };
}

/**
 * POST /v1/product/{shopId}/sendPriceData - Изменение цен SKU
 */
export async function updateProductPrices(
  token: string,
  shopId: number | string,
  prices: Array<{ sku: string; price: number }>
): Promise<{
  success: boolean;
  error?: string;
}> {
  const result = await apiRequest<any>(
    `/v1/product/${shopId}/sendPriceData`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ prices })
    }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true };
}

// ============================================================================
// FBS - Заказы
// ============================================================================

/**
 * GET /v2/fbs/orders - Получение заказов продавца
 * Требуется только shopIds (БЕЗ shopId!)
 */
export async function getFbsOrders(
  token: string,
  shopId: number | string,
  params?: {
    size?: number;
    page?: number;
    status?: string;
  }
): Promise<{
  success: boolean;
  orders?: any[];
  error?: string;
}> {
  const queryParams = new URLSearchParams();
  // FBS API требует только shopIds (БЕЗ shopId!)
  queryParams.append('shopIds', String(shopId));
  
  // Добавляем size и page только если явно указаны
  // API поддерживает максимум size=50
  if (params?.size) {
    const size = Math.min(params.size, 50);
    queryParams.append('size', String(size));
  }
  if (params?.page !== undefined) {
    queryParams.append('page', String(params.page));
  }
  if (params?.status) {
    queryParams.append('status', params.status);
  }

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const result = await apiRequest<any>(
    `/v2/fbs/orders${query}`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  console.log('📋 Raw fbs orders API response:', result.data);

  // API возвращает структуру { orders: [] } после извлечения payload
  // или может вернуть просто массив
  let orders: any[] = [];
  
  if (Array.isArray(result.data)) {
    orders = result.data;
  } else if (result.data && typeof result.data === 'object' && 'orders' in result.data) {
    orders = Array.isArray(result.data.orders) ? result.data.orders : [];
  }
  
  return { success: true, orders };
}

/**
 * GET /v2/fbs/orders/count - Получить количество заказов
 * Требуется только shopIds (БЕЗ shopId!)
 */
export async function getFbsOrdersCount(
  token: string,
  shopId: number | string,
  params?: {
    status?: string;
  }
): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  const queryParams = new URLSearchParams();
  // FBS API требует только shopIds (БЕЗ shopId!)
  queryParams.append('shopIds', String(shopId));
  if (params?.status) queryParams.append('status', params.status);

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const result = await apiRequest<any>(
    `/v2/fbs/orders/count${query}`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  console.log('📋 Raw orders count API response:', result.data);
  
  // API возвращает объект с полями или число
  const count = typeof result.data === 'number' ? result.data : (result.data?.total || result.data?.count || 0);
  
  console.log('📋 Parsed count:', count);
  
  return { success: true, count };
}

/**
 * GET /v1/fbs/order/{orderId} - Получение информации о заказе
 */
export async function getFbsOrder(
  token: string,
  orderId: string | number
): Promise<{
  success: boolean;
  order?: any;
  error?: string;
}> {
  const result = await apiRequest<any>(
    `/v1/fbs/order/${orderId}`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true, order: result.data };
}

/**
 * POST /v1/fbs/order/{orderId}/confirm - Подтверждение заказа
 */
export async function confirmFbsOrder(
  token: string,
  orderId: string | number
): Promise<{
  success: boolean;
  error?: string;
}> {
  const result = await apiRequest<any>(
    `/v1/fbs/order/${orderId}/confirm`,
    token,
    { method: 'POST' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true };
}

/**
 * POST /v1/fbs/order/{orderId}/cancel - Отмена заказа
 */
export async function cancelFbsOrder(
  token: string,
  orderId: string | number
): Promise<{
  success: boolean;
  error?: string;
}> {
  const result = await apiRequest<any>(
    `/v1/fbs/order/${orderId}/cancel`,
    token,
    { method: 'POST' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true };
}

/**
 * GET /v1/fbs/order/{orderId}/labels/print - Получить этикетку для FBS заказа
 * Возвращает PDF файл в формате base64 или URL
 * @param size - LARGE (58x40mm) или BIG (43x25mm)
 */
export async function getFbsOrderLabel(
  token: string,
  orderId: string | number,
  size: 'LARGE' | 'BIG' = 'LARGE'
): Promise<{
  success: boolean;
  label?: any;
  labelUrl?: string;
  labelPdf?: string; // base64 encoded PDF
  error?: string;
}> {
  // Добавляем параметр size в URL
  const result = await apiRequest<any>(
    `/v1/fbs/order/${orderId}/labels/print?size=${size}`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  // API может вернуть разные форматы:
  // 1. PDF как base64 строка
  // 2. URL на PDF файл
  // 3. Объект с данными для генерации этикетки
  const data = result.data;
  
  // Проверяем, является ли ответ base64 PDF
  if (typeof data === 'string') {
    if (data.startsWith('http')) {
      // Это URL
      return { success: true, labelUrl: data, label: data };
    } else if (data.startsWith('JVBER') || data.includes('PDF')) {
      // Это base64 PDF (начинается с JVBERi0 в base64)
      return { success: true, labelPdf: data, label: data };
    }
  }
  
  // Если это объект с полем url или pdf
  if (data && typeof data === 'object') {
    if (data.url) {
      return { success: true, labelUrl: data.url, label: data };
    }
    if (data.pdf) {
      return { success: true, labelPdf: data.pdf, label: data };
    }
    if (data.base64) {
      return { success: true, labelPdf: data.base64, label: data };
    }
  }

  // Возвращаем как есть
  return { success: true, label: result.data };
}

/**
 * GET /v1/fbs/order/return-reasons - Получение причин возврата
 */
export async function getFbsReturnReasons(token: string): Promise<{
  success: boolean;
  reasons?: any[];
  error?: string;
}> {
  const result = await apiRequest<any>(
    '/v1/fbs/order/return-reasons',
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true, reasons: result.data };
}

// ============================================================================
// DBS/FBS Stocks - Остатки
// ============================================================================

/**
 * GET /v2/fbs/sku/stocks - Получение остатков по SKU
 */
export async function getFbsSkuStocks(
  token: string,
  params?: {
    limit?: number;
    offset?: number;
  }
): Promise<{
  success: boolean;
  stocks?: any[];
  error?: string;
}> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.offset) queryParams.append('offset', String(params.offset));

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const result = await apiRequest<any>(
    `/v2/fbs/sku/stocks${query}`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  console.log('📊 [getFbsSkuStocks] Raw API response:', JSON.stringify(result.data, null, 2));
  
  // API может возвращать разные структуры:
  // Вариант 1: Прямой массив [...]
  // Вариант 2: { items: [...] }
  // Вариант 3: { stocks: [...] }
  // Вариант 4: { data: [...] }
  // Вариант 5: { skuAmountList: [...] } ← UZUM API использует это!
  let stocks = null;
  
  if (result.data) {
    if (Array.isArray(result.data)) {
      stocks = result.data;
    } else if (Array.isArray(result.data.skuAmountList)) {
      // UZUM API возвращает данные в поле skuAmountList
      stocks = result.data.skuAmountList;
      console.log('📊 [getFbsSkuStocks] Found skuAmountList with', stocks.length, 'items');
    } else if (Array.isArray(result.data.items)) {
      stocks = result.data.items;
    } else if (Array.isArray(result.data.stocks)) {
      stocks = result.data.stocks;
    } else if (Array.isArray(result.data.data)) {
      stocks = result.data.data;
    }
  }

  const parsedStocks = stocks || [];
  console.log('📊 [getFbsSkuStocks] Parsed stocks:', { 
    success: parsedStocks.length > 0, 
    count: parsedStocks.length,
    sample: parsedStocks[0] || null 
  });

  if (parsedStocks.length === 0) {
    console.warn('📊 [getFbsSkuStocks] No stocks found! Response keys:', Object.keys(result.data || {}));
  }

  return { success: true, stocks: parsedStocks };
}

/**
 * POST /v2/fbs/sku/stocks - Обновление остатков по SKU
 */
export async function updateFbsSkuStocks(
  token: string,
  stocks: Array<{ sku: string; stock: number }>
): Promise<{
  success: boolean;
  error?: string;
}> {
  const result = await apiRequest<any>(
    '/v2/fbs/sku/stocks',
    token,
    {
      method: 'POST',
      body: JSON.stringify({ stocks })
    }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true };
}

// ============================================================================
// Finance - Финансы
// ============================================================================

/**
 * GET /v1/finance/orders - Получение списка заказов
 * Требует обязательные параметры shopId и shopIds
 */
export async function getFinanceOrders(
  token: string,
  shopId: number | string,
  params?: {
    size?: number;
    page?: number;
    dateFrom?: number;
    dateTo?: number;
    group?: boolean;
    statuses?: string[];
  }
): Promise<{
  success: boolean;
  orders?: any[];
  total?: number;
  error?: string;
}> {
  const queryParams = new URLSearchParams();
  // API требует оба параметра
  queryParams.append('shopId', String(shopId));
  queryParams.append('shopIds', String(shopId));
  queryParams.append('size', String(params?.size || 20));
  queryParams.append('page', String(params?.page || 0));
  if (params?.dateFrom) queryParams.append('dateFrom', String(params.dateFrom));
  if (params?.dateTo) queryParams.append('dateTo', String(params.dateTo));
  if (params?.group !== undefined) queryParams.append('group', String(params.group));
  if (params?.statuses?.length) {
    params.statuses.forEach(status => queryParams.append('statuses', status));
  }

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const result = await apiRequest<any>(
    `/v1/finance/orders${query}`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  console.log('💰 Raw finance orders API response:', result.data);

  // API возвращает { orderItems: [], totalElements: number }
  const orders = result.data?.orderItems || [];
  const total = result.data?.totalElements || 0;
  return { success: true, orders, total };
}

/**
 * GET /v1/finance/expenses - Получение списка расходов продавца
 * Требует обязательные параметры shopId и shopIds
 */
export async function getFinanceExpenses(
  token: string,
  shopId: number | string,
  params?: {
    size?: number;
    page?: number;
    dateFrom?: number;
    dateTo?: number;
  }
): Promise<{
  success: boolean;
  expenses?: any[];
  total?: number;
  error?: string;
}> {
  const queryParams = new URLSearchParams();
  // API требует shopIds параметр
  queryParams.append('shopIds', String(shopId));
  queryParams.append('size', String(params?.size || 20));
  queryParams.append('page', String(params?.page || 0));
  if (params?.dateFrom) queryParams.append('dateFrom', String(params.dateFrom));
  if (params?.dateTo) queryParams.append('dateTo', String(params.dateTo));

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const result = await apiRequest<any>(
    `/v1/finance/expenses${query}`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  console.log('💸 Raw finance expenses API response:', result.data);

  // API возвращает разные структуры:
  // Вариант 1: {payments: [...]} ← UZUM API использует это!
  // Вариант 2: {payload: {payments: [...]}}
  // Вариант 3: Прямой массив [...]
  // Вариант 4: {expenses: [...]}
  let expenses: any[] = [];
  let total = 0;

  if (result.data?.payments && Array.isArray(result.data.payments)) {
    // UZUM API возвращает данные напрямую в поле payments
    expenses = result.data.payments;
    total = result.data.totalElements || expenses.length;
    console.log('💸 [getFinanceExpenses] Found payments array with', expenses.length, 'items');
  } else if (result.data?.payload?.payments) {
    expenses = result.data.payload.payments;
    total = result.data.payload.totalElements || expenses.length;
  } else if (Array.isArray(result.data)) {
    expenses = result.data;
    total = expenses.length;
  } else if (result.data?.expenses) {
    expenses = result.data.expenses;
    total = result.data.totalElements || expenses.length;
  } else {
    console.warn('💸 [getFinanceExpenses] Unknown response structure:', Object.keys(result.data || {}));
  }

  console.log('💸 [getFinanceExpenses] Parsed expenses:', {
    success: expenses.length > 0,
    count: expenses.length,
    sample: expenses[0]
  });

  return { success: true, expenses, total };
}

// ============================================================================
// Invoice - Накладные
// ============================================================================

/**
 * GET /v1/invoice - Получение списка накладных
 */
export async function getInvoices(
  token: string,
  params?: {
    limit?: number;
    offset?: number;
  }
): Promise<{
  success: boolean;
  invoices?: any[];
  error?: string;
}> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.offset) queryParams.append('offset', String(params.offset));

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const result = await apiRequest<any>(
    `/v1/invoice${query}`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true, invoices: result.data };
}

/**
 * GET /v1/shop/{shopId}/invoice - Получение накладных поставки по ID магазина
 */
export async function getShopInvoices(
  token: string,
  shopId: number | string,
  params?: {
    limit?: number;
    offset?: number;
  }
): Promise<{
  success: boolean;
  invoices?: any[];
  error?: string;
}> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.offset) queryParams.append('offset', String(params.offset));

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const result = await apiRequest<any>(
    `/v1/shop/${shopId}/invoice${query}`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true, invoices: result.data };
}

/**
 * GET /v1/shop/{shopId}/invoice/products - Получение состава накладной
 */
export async function getShopInvoiceProducts(
  token: string,
  shopId: number | string,
  params?: {
    invoiceId?: string | number;
  }
): Promise<{
  success: boolean;
  products?: any[];
  error?: string;
}> {
  const queryParams = new URLSearchParams();
  if (params?.invoiceId) queryParams.append('invoiceId', String(params.invoiceId));

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const result = await apiRequest<any>(
    `/v1/shop/${shopId}/invoice/products${query}`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true, products: result.data };
}

// ============================================================================
// Return - Возвраты
// ============================================================================

/**
 * GET /v1/return - Получение возвратов продавца
 */
export async function getReturns(
  token: string,
  params?: {
    limit?: number;
    offset?: number;
  }
): Promise<{
  success: boolean;
  returns?: any[];
  error?: string;
}> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.offset) queryParams.append('offset', String(params.offset));

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const result = await apiRequest<any>(
    `/v1/return${query}`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true, returns: result.data };
}

/**
 * GET /v1/shop/{shopId}/return - Получение накладных возврата
 */
export async function getShopReturns(
  token: string,
  shopId: number | string,
  params?: {
    limit?: number;
    offset?: number;
  }
): Promise<{
  success: boolean;
  returns?: any[];
  error?: string;
}> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.offset) queryParams.append('offset', String(params.offset));

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const result = await apiRequest<any>(
    `/v1/shop/${shopId}/return${query}`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true, returns: result.data };
}

/**
 * GET /v1/shop/{shopId}/return/{returnId} - Получение состава накладной возврата
 */
export async function getShopReturnDetails(
  token: string,
  shopId: number | string,
  returnId: string | number
): Promise<{
  success: boolean;
  returnDetails?: any;
  error?: string;
}> {
  const result = await apiRequest<any>(
    `/v1/shop/${shopId}/return/${returnId}`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true, returnDetails: result.data };
}
