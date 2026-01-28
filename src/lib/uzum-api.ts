/**
 * Uzum Seller API Client
 * 
 * Base URL: https://api-seller.uzum.uz/api/seller-openapi
 * Auth: RAW token without Bearer prefix
 * Authorization header: <token>
 */

// Используем прокси для dev окружения и Cloudflare Functions для продакшена
const USE_PROXY = true;
const PROXY_URL = import.meta.env.DEV 
  ? '/api/uzum-proxy'  // Vite proxy в разработке
  : '/api/uzum-proxy'; // Cloudflare/Vercel Functions в продакшене

/**
 * Base API request handler
 */
async function apiRequest<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  try {
    let response: Response;

    if (USE_PROXY) {
      // Используем прокси
      response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: endpoint,
          method: options.method || 'GET',
          headers: {
            'Authorization': token,
          },
          body: options.body ? JSON.parse(options.body as string) : undefined,
        }),
      });
    } else {
      // Прямой запрос (будет работать только с отключённым CORS)
      const url = `https://api-seller.uzum.uz/api/seller-openapi${endpoint}`;
      response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      });
    }

    const status = response.status;

    if (!response.ok) {
      if (status === 401) return { error: 'Неверный токен', status };
      if (status === 403) return { error: 'Доступ запрещён', status };
      if (status === 404) return { error: 'Ресурс не найден', status };
      if (status >= 500) return { error: 'Ошибка сервера', status };
      
      return { error: `Ошибка ${status}`, status };
    }

    const data = await response.json();
    return { data, status };
  } catch (error: any) {
    console.error('API Request error:', error);
    return {
      error: error.message || 'Ошибка сети',
      status: 0
    };
  }
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
  queryParams.append('size', String(params?.size || 20));
  queryParams.append('page', String(params?.page || 0));
  if (params?.status) queryParams.append('status', params.status);

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

  // API возвращает массив заказов или пустой массив
  const orders = Array.isArray(result.data) ? result.data : [];
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

  return { success: true, stocks: result.data };
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
  // API требует оба параметра
  queryParams.append('shopId', String(shopId));
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

  // API возвращает массив или объект с полями
  const expenses = Array.isArray(result.data) ? result.data : (result.data?.expenses || []);
  const total = result.data?.totalElements || expenses.length;
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
