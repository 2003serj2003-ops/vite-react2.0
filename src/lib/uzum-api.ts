/**
 * Uzum Seller API Client
 * 
 * Base URL: https://api-seller.uzum.uz/api/seller-openapi/
 * 
 * Auth: RAW token without prefix
 * Authorization: <token>
 * 
 * Official Swagger Endpoints:
 * 
 * DBS (Delivery by Seller):
 * - GET  /v2/dbs/sku/stocks - Получение остатков по SKU
 * - POST /v2/dbs/sku/stocks - Обновление остатков по SKU
 * 
 * FBS (Fulfillment by Seller):
 * - GET  /v1/fbs/order/{orderId} - Получение информации о заказе
 * - POST /v1/fbs/order/{orderId}/cancel - Отмена заказа
 * - POST /v1/fbs/order/{orderId}/confirm - Подтверждение заказа
 * - GET  /v1/fbs/order/{orderId}/labels/print - Получить этикетку для FBS заказа
 * - GET  /v1/fbs/order/return-reasons - Получение причин возврата
 * - GET  /v2/fbs/orders - Получение заказов продавца
 * - GET  /v2/fbs/orders/count - Получить количество заказов
 * - GET  /v2/fbs/sku/stocks - Получение остатков по SKU
 * - POST /v2/fbs/sku/stocks - Обновление остатков по SKU
 * 
 * Finance:
 * - GET /v1/finance/expenses - Получение списка расходов продавца
 * - GET /v1/finance/orders - Получение списка заказов
 * 
 * Invoice:
 * - GET /v1/invoice - Получение списка накладных
 * - GET /v1/return - Получение возвратов продавца
 * - GET /v1/shop/{shopId}/invoice - Получение накладных поставки по ID магазина
 * - GET /v1/shop/{shopId}/invoice/products - Получение состава накладной
 * - GET /v1/shop/{shopId}/return - Получение накладных возврата
 * - GET /v1/shop/{shopId}/return/{returnId} - Получение состава накладной возврата
 * 
 * Product:
 * - POST /v1/product/{shopId}/sendPriceData - Изменение цен SKU
 * - GET  /v1/product/shop/{shopId} - Получение SKU по ID магазина
 * 
 * Shop:
 * - GET /v1/shops - Получение списка собственных магазинов
 */

const BASE_URL = 'https://api-seller.uzum.uz/api/seller-openapi';
const USE_PROXY = import.meta.env.VITE_USE_UZUM_PROXY !== 'false'; // По умолчанию используем прокси
const PROXY_URL = '/api/uzum-proxy';

// Uzum uses RAW token without Bearer prefix
// Можно изменить на 'Bearer' или 'Token' для тестирования
let AUTH_SCHEME = 'Raw';

// Альтернативные URL для тестирования
const ALTERNATIVE_URLS = [
  'https://api-seller.uzum.uz/api/seller-openapi',
  'https://api-seller.uzum.uz/api',
  'https://api.uzum.uz/api/seller',
  'https://seller-api.uzum.uz/api',
];

/**
 * Set auth scheme for testing
 */
export function setAuthScheme(scheme: 'Raw' | 'Bearer' | 'Token') {
  AUTH_SCHEME = scheme;
  console.log(`🔧 Auth scheme changed to: ${scheme}`);
}

/**
 * Build Authorization header based on scheme
 */
function buildAuthHeader(token: string): string {
  if (AUTH_SCHEME === 'Raw') {
    return token;
  }
  return `${AUTH_SCHEME} ${token}`;
}

/**
 * Base API request with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const fullUrl = USE_PROXY ? PROXY_URL : `${BASE_URL}${endpoint}`;
  console.log(`🔵 API Request:`, { 
    endpoint,
    fullUrl,
    useProxy: USE_PROXY, 
    method: options.method || 'GET',
    authScheme: AUTH_SCHEME,
    tokenPrefix: token.substring(0, 20) + '...'
  });
  
  try {
    let response: Response;

    if (USE_PROXY) {
      // Используем Cloudflare Function прокси
      const requestBody = {
        path: endpoint,
        method: options.method || 'GET',
        headers: {
          'Authorization': buildAuthHeader(token),
        },
        body: options.body ? JSON.parse(options.body as string) : undefined,
      };
      console.log('🔵 Proxy request body:', requestBody);
      
      response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    } else {
      // Прямой запрос (может не работать из-за CORS)
      const url = `${BASE_URL}${endpoint}`;
      const headers = {
        'Authorization': buildAuthHeader(token),
        'Content-Type': 'application/json',
        ...options.headers,
      };
      
      console.log('🔵 Direct request:', {
        url,
        method: options.method || 'GET',
        headers: {
          ...headers,
          Authorization: `${headers.Authorization.substring(0, 10)}...` // Скрываем токен
        }
      });
      
      response = await fetch(url, {
        ...options,
        headers,
      });
    }

    const status = response.status;
    console.log(`🟢 API Response: ${endpoint} - Status ${status}`);

    // Handle errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🔴 API Error: ${endpoint}`, { status, errorText });
      
      if (status === 401) {
        return { error: 'Неверный токен (401 Unauthorized)', status };
      }
      if (status === 403) {
        return { error: 'Доступ запрещён (403 Forbidden)', status };
      }
      if (status === 404) {
        return { error: 'Ресурс не найден (404 Not Found)', status };
      }
      if (status >= 500) {
        return { error: `Ошибка сервера Uzum (${status})`, status };
      }
      return { error: `HTTP ошибка ${status}`, status };
    }

    // Try to parse JSON response
    try {
      const data = await response.json();
      console.log(`✅ API Data: ${endpoint}`, data);
      return { data, status };
    } catch {
      // Some endpoints may return empty response
      console.log(`⚪ API Empty: ${endpoint}`);
      return { data: {} as T, status };
    }
  } catch (error: any) {
    // Network error or CORS
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      return {
        error: 'CORS блокировка или сеть недоступна. Требуется backend-прокси.',
        status: 0
      };
    }
    return {
      error: error.message || 'Неизвестная ошибка',
      status: 0
    };
  }
}

/**
 * Diagnose API connectivity by testing different URL combinations
 * Tests official base URL with different endpoints
 */
export async function diagnoseApi(token: string): Promise<{
  success: boolean;
  workingUrl?: string;
  workingEndpoint?: string;
  data?: any;
  attempts: Array<{ url: string; endpoint: string; status: number; error?: string }>;
}> {
  console.log('🔬 Starting API diagnosis...');
  
  const baseUrls = [
    'https://api-seller.uzum.uz/api/seller-openapi',
    'https://api-seller.uzum.uz/api',
    'https://api.uzum.uz/seller',
    'https://seller-api.uzum.uz',
  ];
  
  const endpoints = [
    '/v1/shops',
    '/shops',
    '/v1/seller/shops',
  ];
  
  const attempts: Array<{ url: string; endpoint: string; status: number; error?: string }> = [];
  
  for (const baseUrl of baseUrls) {
    for (const endpoint of endpoints) {
      const fullUrl = `${baseUrl}${endpoint}`;
      console.log(`Testing: ${fullUrl}`);
      
      try {
        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Authorization': token,
            'Accept': 'application/json',
          },
        });
        
        const status = response.status;
        console.log(`  Status: ${status}`);
        
        if (status === 200) {
          const data = await response.json();
          console.log(`✅ SUCCESS! Working URL found:`, fullUrl);
          console.log(`  Data:`, data);
          
          attempts.push({ url: baseUrl, endpoint, status, error: undefined });
          
          return {
            success: true,
            workingUrl: baseUrl,
            workingEndpoint: endpoint,
            data,
            attempts,
          };
        } else {
          const errorText = await response.text();
          attempts.push({ url: baseUrl, endpoint, status, error: errorText.substring(0, 100) });
          console.log(`  Error: ${errorText.substring(0, 100)}`);
        }
      } catch (error: any) {
        console.log(`  Exception:`, error.message);
        attempts.push({ url: baseUrl, endpoint, status: 0, error: error.message });
      }
    }
  }
  
  console.log('❌ No working URL found');
  return { success: false, attempts };
}

/**
 * Test if token is valid
 * Uses /v1/shops endpoint to verify token and get shop info
 * Based on official Swagger: GET /v1/shops - Получение списка собственных магазинов
 */
export async function testToken(token: string): Promise<{
  valid: boolean;
  error?: string;
  sellerInfo?: any;
}> {
  if (!token || token.trim().length === 0) {
    return { valid: false, error: 'Токен пустой' };
  }

  console.log('🔍 Testing token with official endpoint: /v1/shops');
  console.log('📝 Token length:', token.length);
  console.log('📝 Token preview:', token.substring(0, 20) + '...');
  console.log('📝 Full URL will be: https://api-seller.uzum.uz/api/seller-openapi/v1/shops');
  
  // Используем официальный эндпоинт из Swagger
  const result = await apiRequest<any>('/v1/shops', token, { method: 'GET' });
  
  if (result.error) {
    console.error('❌ Token validation failed:', result.error);
    console.log('');
    console.log('💡 Running full API diagnosis...');
    
    // Запускаем диагностику если основной эндпоинт не работает
    const diagnosis = await diagnoseApi(token);
    console.log('📊 Diagnosis complete:', diagnosis);
    
    if (diagnosis.success && diagnosis.data) {
      console.log('✅ Found alternative working endpoint!');
      return {
        valid: true,
        sellerInfo: {
          shops: diagnosis.data,
          shopId: diagnosis.data?.[0]?.id,
          shopName: diagnosis.data?.[0]?.name,
          workingUrl: diagnosis.workingUrl,
          workingEndpoint: diagnosis.workingEndpoint,
        }
      };
    }
    
    return { valid: false, error: result.error };
  }
  
  if (!result.data) {
    console.error('❌ No data returned from /v1/shops');
    return { valid: false, error: 'API не вернул данные' };
  }
  
  console.log('✅ Token is valid! Shops data:', result.data);
  
  return { 
    valid: true, 
    sellerInfo: { 
      shops: result.data,
      shopId: result.data?.[0]?.id,
      shopName: result.data?.[0]?.name,
    } 
  };
}

/**
 * Get products list
 * Endpoint: /v1/product/shop/{shopId}
 */
export async function getProducts(
  token: string,
  shopId: number | string
): Promise<{
  success: boolean;
  products?: any[];
  error?: string;
}> {
  if (!shopId) {
    return { success: false, error: 'shopId обязателен' };
  }

  const result = await apiRequest<any[]>(
    `/v1/product/shop/${shopId}`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  // API returns array of products
  const products = Array.isArray(result.data) ? result.data : [];
  return { success: true, products };
}

/**
 * Get shops list
 * Endpoint: /v1/shops
 */
export async function getShops(token: string): Promise<{
  success: boolean;
  shops?: any[];
  error?: string;
}> {
  const result = await apiRequest<any[]>(
    '/v1/shops',
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  // API returns array of shops
  const shops = Array.isArray(result.data) ? result.data : [];
  return { success: true, shops };
}

// ============================================================================
// FBS (Fulfillment by Seller) - Заказы FBS
// ============================================================================

/**
 * Get FBS orders
 * Endpoint: /v2/fbs/orders
 */
export async function getFbsOrders(
  token: string,
  params?: {
    limit?: number;
    offset?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<{
  success: boolean;
  orders?: any[];
  error?: string;
}> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.offset) queryParams.append('offset', String(params.offset));
  if (params?.status) queryParams.append('status', params.status);
  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const result = await apiRequest<any>(
    `/v2/fbs/orders${query}`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true, orders: result.data };
}

/**
 * Get FBS orders count
 * Endpoint: /v2/fbs/orders/count
 */
export async function getFbsOrdersCount(
  token: string,
  params?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const result = await apiRequest<any>(
    `/v2/fbs/orders/count${query}`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true, count: result.data };
}

/**
 * Get FBS order details
 * Endpoint: /v1/fbs/order/{orderId}
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
 * Confirm FBS order
 * Endpoint: /v1/fbs/order/{orderId}/confirm
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
 * Cancel FBS order
 * Endpoint: /v1/fbs/order/{orderId}/cancel
 */
export async function cancelFbsOrder(
  token: string,
  orderId: string | number,
  reason?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const result = await apiRequest<any>(
    `/v1/fbs/order/${orderId}/cancel`,
    token,
    {
      method: 'POST',
      body: reason ? JSON.stringify({ reason }) : undefined
    }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true };
}

/**
 * Get FBS order label
 * Endpoint: /v1/fbs/order/{orderId}/labels/print
 */
export async function getFbsOrderLabel(
  token: string,
  orderId: string | number
): Promise<{
  success: boolean;
  label?: any;
  error?: string;
}> {
  const result = await apiRequest<any>(
    `/v1/fbs/order/${orderId}/labels/print`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true, label: result.data };
}

/**
 * Get FBS return reasons
 * Endpoint: /v1/fbs/order/return-reasons
 */
export async function getFbsReturnReasons(
  token: string
): Promise<{
  success: boolean;
  reasons?: any[];
  error?: string;
}> {
  const result = await apiRequest<any[]>(
    '/v1/fbs/order/return-reasons',
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true, reasons: result.data };
}

/**
 * Get FBS SKU stocks
 * Endpoint: /v2/fbs/sku/stocks
 */
export async function getFbsSkuStocks(
  token: string,
  params?: {
    shopId?: number;
    sku?: string;
  }
): Promise<{
  success: boolean;
  stocks?: any[];
  error?: string;
}> {
  const queryParams = new URLSearchParams();
  if (params?.shopId) queryParams.append('shopId', String(params.shopId));
  if (params?.sku) queryParams.append('sku', params.sku);

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const result = await apiRequest<any>(
    `/v2/fbs/sku/stocks${query}`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true, stocks: result.data };
}

/**
 * Update FBS SKU stocks
 * Endpoint: /v2/fbs/sku/stocks
 */
export async function updateFbsSkuStocks(
  token: string,
  stocks: Array<{
    sku: string;
    stock: number;
  }>
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
 * Get finance orders
 * Endpoint: /v1/finance/orders
 */
export async function getFinanceOrders(
  token: string,
  params?: {
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<{
  success: boolean;
  orders?: any[];
  error?: string;
}> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.offset) queryParams.append('offset', String(params.offset));
  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const result = await apiRequest<any>(
    `/v1/finance/orders${query}`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true, orders: result.data };
}

/**
 * Get finance expenses
 * Endpoint: /v1/finance/expenses
 */
export async function getFinanceExpenses(
  token: string,
  params?: {
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<{
  success: boolean;
  expenses?: any[];
  error?: string;
}> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.offset) queryParams.append('offset', String(params.offset));
  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const result = await apiRequest<any>(
    `/v1/finance/expenses${query}`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true, expenses: result.data };
}

// ============================================================================
// Invoice - Накладные
// ============================================================================

/**
 * Get invoices
 * Endpoint: /v1/invoice
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
 * Get shop invoices
 * Endpoint: /v1/shop/{shopId}/invoice
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
 * Get shop invoice products
 * Endpoint: /v1/shop/{shopId}/invoice/products
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

/**
 * Get returns
 * Endpoint: /v1/return
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
 * Get shop returns
 * Endpoint: /v1/shop/{shopId}/return
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
 * Get shop return details
 * Endpoint: /v1/shop/{shopId}/return/{returnId}
 */
export async function getShopReturnDetails(
  token: string,
  shopId: number | string,
  returnId: number | string
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

// ============================================================================
// Product - Товары
// ============================================================================

/**
 * Update product prices
 * Endpoint: /v1/product/{shopId}/sendPriceData
 */
export async function updateProductPrices(
  token: string,
  shopId: number | string,
  prices: Array<{
    sku: string;
    price: number;
  }>
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

/**
 * Get orders (legacy)
 * Endpoint may vary, check API docs
 */
export async function getOrders(
  token: string,
  shopId?: number | string
): Promise<{
  success: boolean;
  orders?: any[];
  error?: string;
}> {
  const params = shopId ? `?shopId=${shopId}` : '';
  const result = await apiRequest<{ orders?: any[]; data?: any[] }>(
    `/orders${params}`,
    token,
    { method: 'GET' }
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  const orders = result.data?.orders || result.data?.data || [];
  return { success: true, orders };
}
