# Патчи исправления прокси Uzum API

## 1. src/lib/uzum-api.ts

```diff
 async function apiRequest<T>(
   endpoint: string,
   token: string,
   options: RequestInit = {}
 ): Promise<{ data?: T; error?: string; status: number }> {
   try {
     let response: Response;
 
     if (USE_PROXY) {
-      // Используем прокси
-      response = await fetch(PROXY_URL, {
-        method: 'POST',
-        headers: {
-          'Content-Type': 'application/json',
-        },
-        body: JSON.stringify({
-          path: endpoint,
-          method: options.method || 'GET',
-          headers: {
-            'Authorization': token,
-          },
-          body: options.body ? JSON.parse(options.body as string) : undefined,
-        }),
-      });
+      // Используем прокси - передаем путь через заголовок
+      const method = options.method || 'GET';
+      const headers: Record<string, string> = {
+        'X-Uzum-Path': endpoint,
+        'Authorization': token,
+        'Accept': 'application/json',
+      };
+      
+      if (options.body || method === 'POST' || method === 'PUT' || method === 'PATCH') {
+        headers['Content-Type'] = 'application/json';
+      }
+
+      response = await fetch(PROXY_URL, {
+        method,
+        headers,
+        body: options.body,
+      });
     } else {
       // Прямой запрос (будет работать только с отключённым CORS)
       const url = `https://api-seller.uzum.uz/api/seller-openapi${endpoint}`;
```

**Ключевое изменение:**
- ❌ Был: POST запрос с JSON body { path, method, headers, body }
- ✅ Стал: Прямой HTTP запрос с заголовком X-Uzum-Path

---

## 2. vite.config.ts

```diff
   server: {
     proxy: {
       // Прокси для Uzum API
       '/api/uzum-proxy': {
         target: 'https://api-seller.uzum.uz',
         changeOrigin: true,
         secure: false,
-        rewrite: (path) => path.replace(/^\/api\/uzum-proxy/, '/api/seller-openapi'),
+        configure: (proxy, _options) => {
+          proxy.on('proxyReq', (proxyReq, req) => {
+            // Читаем целевой path из заголовка
+            const uzumPath = req.headers['x-uzum-path'] || '';
+            // Меняем путь запроса на целевой Uzum API endpoint
+            proxyReq.path = `/api/seller-openapi${uzumPath}`;
+            
+            // Пробрасываем Authorization без изменений
+            if (req.headers['authorization']) {
+              proxyReq.setHeader('Authorization', req.headers['authorization']);
+            }
+          });
+        },
       },
     },
   },
```

**Ключевое изменение:**
- ❌ Был: Простой rewrite пути (не работал с заголовками)
- ✅ Стал: Чтение пути из заголовка X-Uzum-Path и динамическое проксирование

---

## 3. functions/api/uzum-proxy.js

```diff
 /**
  * Cloudflare Function для проксирования запросов к Uzum API
  * Обходит CORS блокировку браузера
+ * Читает целевой path из заголовка X-Uzum-Path
  */
 
-export async function onRequestPost(context) {
+export async function onRequest(context) {
+  const { request } = context;
+  
+  // Получаем путь из заголовка
+  const uzumPath = request.headers.get('X-Uzum-Path');
+  
+  if (!uzumPath) {
+    return new Response(JSON.stringify({ error: 'X-Uzum-Path header is required' }), {
+      status: 400,
+      headers: { 'Content-Type': 'application/json' }
+    });
+  }
+
   try {
-    const { path, method = 'GET', headers = {}, body } = await context.request.json();
-
-    if (!path) {
-      return new Response(JSON.stringify({ error: 'Path is required' }), {
-        status: 400,
-        headers: { 'Content-Type': 'application/json' }
-      });
-    }
-
-    const uzumApiUrl = `https://api-seller.uzum.uz/api/seller-openapi${path}`;
+    const uzumApiUrl = `https://api-seller.uzum.uz/api/seller-openapi${uzumPath}`;
     
+    // Собираем заголовки для проксирования
+    const proxyHeaders = {
+      'Accept': 'application/json',
+    };
+    
+    // Пробрасываем Authorization без изменений
+    const authHeader = request.headers.get('Authorization');
+    if (authHeader) {
+      proxyHeaders['Authorization'] = authHeader;
+    }
+    
+    // Пробрасываем Content-Type если есть
+    const contentType = request.headers.get('Content-Type');
+    if (contentType) {
+      proxyHeaders['Content-Type'] = contentType;
+    }
+    
     const requestOptions = {
-      method,
-      headers: {
-        'Content-Type': 'application/json',
-        ...headers
-      }
+      method: request.method,
+      headers: proxyHeaders,
     };
 
-    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
-      requestOptions.body = JSON.stringify(body);
+    // Пробрасываем body для POST/PUT/PATCH
+    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
+      requestOptions.body = await request.text();
     }
 
     const response = await fetch(uzumApiUrl, requestOptions);
```

```diff
         'Content-Type': 'application/json',
         'Access-Control-Allow-Origin': '*',
         'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
-        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
+        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Uzum-Path'
       }
```

**Ключевые изменения:**
- ❌ Был: Только POST запросы, path в JSON body
- ✅ Стал: Все HTTP методы, path в заголовке X-Uzum-Path
- ✅ Проброс всех необходимых заголовков (Authorization, Content-Type)

---

## Итоговая архитектура

### До исправления:
```
Frontend → POST /api/uzum-proxy + JSON{path, method, headers, body}
           ↓
Vite Proxy → rewrite → GET https://api-seller.uzum.uz/api/seller-openapi
           ❌ НЕ РАБОТАЛО (путь терялся)
```

### После исправления:
```
Frontend → HTTP METHOD /api/uzum-proxy + Header[X-Uzum-Path: /v1/shops]
           ↓
DEV: Vite Proxy → читает X-Uzum-Path → GET https://api-seller.uzum.uz/api/seller-openapi/v1/shops
     ✅ РАБОТАЕТ

PROD: CF Function → читает X-Uzum-Path → GET https://api-seller.uzum.uz/api/seller-openapi/v1/shops
      ✅ РАБОТАЕТ
```

---

## Проверка

```bash
# 1. Тест скриптом
node test_proxy_fix.mjs <token> <shopId>

# 2. В приложении
npm run dev
# Откройте http://localhost:5173 → Uzum → Test token

# 3. В продакшене
npm run build
npx wrangler pages deploy dist
```
