/**
 * Uzum Seller API Client
 * 
 * Base URL: https://api-seller.uzum.uz/api/seller-openapi/
 * 
 * Auth: RAW token without prefix
 * Authorization: <token>
 */

const BASE_URL = 'https://api-seller.uzum.uz/api/seller-openapi';
const USE_PROXY = import.meta.env.VITE_USE_UZUM_PROXY !== 'false'; // По умолчанию используем прокси
const PROXY_URL = '/api/uzum-proxy';

// Uzum uses RAW token without Bearer prefix
const AUTH_SCHEME = 'Raw';

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
  try {
    let response: Response;

    if (USE_PROXY) {
      // Используем Cloudflare Function прокси
      response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: endpoint,
          method: options.method || 'GET',
          headers: {
            'Authorization': buildAuthHeader(token),
          },
          body: options.body ? JSON.parse(options.body as string) : undefined,
        }),
      });
    } else {
      // Прямой запрос (может не работать из-за CORS)
      const url = `${BASE_URL}${endpoint}`;
      response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': buildAuthHeader(token),
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
    }

    const status = response.status;

    // Handle errors
    if (!response.ok) {
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
      return { data, status };
    } catch {
      // Some endpoints may return empty response
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
 * Test if token is valid
 * Uses /v1/shops endpoint to verify token and get shop info
 */
export async function testToken(token: string): Promise<{
  valid: boolean;
  error?: string;
  sellerInfo?: any;
}> {
  if (!token || token.trim().length === 0) {
    return { valid: false, error: 'Токен пустой' };
  }

  // Get shops list
  const result = await apiRequest<any[]>('/v1/shops', token, { method: 'GET' });

  if (result.error) {
    return { valid: false, error: result.error };
  }

  return { 
    valid: true, 
    sellerInfo: { 
      shops: result.data,
      shopId: result.data?.[0]?.id,
      shopName: result.data?.[0]?.name
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

/**
 * Get orders
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
