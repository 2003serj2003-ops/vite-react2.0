/**
 * Cloudflare Function для проксирования запросов к Uzum API
 * Обходит CORS блокировку браузера
 * Читает целевой path из заголовка X-Uzum-Path
 */

export async function onRequest(context) {
  const { request } = context;
  
  // Получаем путь из заголовка
  const uzumPath = request.headers.get('X-Uzum-Path');
  
  if (!uzumPath) {
    return new Response(JSON.stringify({ error: 'X-Uzum-Path header is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const uzumApiUrl = `https://api-seller.uzum.uz/api/seller-openapi${uzumPath}`;
    
    // Собираем заголовки для проксирования
    const proxyHeaders = {
      'Accept': 'application/json',
    };
    
    // Пробрасываем Authorization без изменений
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      proxyHeaders['Authorization'] = authHeader;
    }
    
    // Пробрасываем Content-Type если есть
    const contentType = request.headers.get('Content-Type');
    if (contentType) {
      proxyHeaders['Content-Type'] = contentType;
    }
    
    const requestOptions = {
      method: request.method,
      headers: proxyHeaders,
    };

    // Пробрасываем body для POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      requestOptions.body = await request.text();
    }

    const response = await fetch(uzumApiUrl, requestOptions);
    const data = await response.text();
    
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      jsonData = { raw: data };
    }

    return new Response(JSON.stringify(jsonData), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Uzum-Path'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Proxy error', 
      message: error.message 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Uzum-Path',
      'Access-Control-Max-Age': '86400'
    }
  });
}
