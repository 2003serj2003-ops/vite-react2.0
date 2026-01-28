# 🏗️ UZUM INTEGRATION - АРХИТЕКТУРА И НАСТРОЙКА

## 📋 Оглавление
1. [Общая архитектура](#общая-архитектура)
2. [API Endpoints](#api-endpoints)
3. [Структура данных](#структура-данных)
4. [Компоненты](#компоненты)
5. [Настройка под проект](#настройка-под-проект)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Общая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                         User Interface                       │
├─────────────────────────────────────────────────────────────┤
│  App.tsx                                                     │
│  ├─ Состояние интеграции (uzumConnected, uzumDecryptedToken)│
│  ├─ Проверка токена (handleTestToken)                       │
│  ├─ Сохранение токена (handleSaveToken)                     │
│  └─ Навигация между страницами                              │
├─────────────────────────────────────────────────────────────┤
│  Компоненты Uzum (src/components/uzum/)                     │
│  ├─ UzumDashboard.tsx - Главная панель                      │
│  ├─ UzumProducts.tsx  - Товары                              │
│  ├─ UzumOrders.tsx    - Заказы                              │
│  └─ UzumFinance.tsx   - Финансы                             │
├─────────────────────────────────────────────────────────────┤
│  API Layer (src/lib/uzum-api.ts)                            │
│  ├─ getShops()                                               │
│  ├─ getProducts()                                            │
│  ├─ getFbsOrders()                                           │
│  ├─ getFbsOrdersCount()                                      │
│  ├─ getFinanceOrders()                                       │
│  └─ getFinanceExpenses()                                     │
├─────────────────────────────────────────────────────────────┤
│  Network Layer                                               │
│  ├─ DEV: Vite Proxy (/api/uzum-proxy)                       │
│  └─ PROD: Cloudflare Functions (/api/uzum-proxy)            │
├─────────────────────────────────────────────────────────────┤
│           Uzum Seller API (api-seller.uzum.uz)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

### 1. Получение магазинов
```typescript
GET /v1/shops
Headers: Authorization: {token}
Response: [{ id: 96273, name: "PLAYO" }]
```

**Используется в:**
- UzumDashboard (для получения shopId)
- UzumProducts (для получения shopId)
- UzumOrders (для получения shopId)
- UzumFinance (для получения shopId)

---

### 2. Товары

#### Получение товаров магазина
```typescript
GET /v1/product/shop/{shopId}?size=100&page=0
Headers: Authorization: {token}

Response: {
  productList: [
    {
      id: number,           // Product ID
      sku: string,          // Артикул
      title: string,        // Название
      price: number,        // Цена
      stock: number,        // Остаток
      photos: string[],     // Массив URL фотографий
      barcode: string,      // Штрихкод
      brand: string,        // Бренд
      category: string,     // Категория
      description: string   // Описание
    }
  ],
  totalProductsAmount: number
}
```

**Используется в:** UzumProducts, UzumDashboard

---

### 3. FBS Заказы (v2)

#### Получение списка заказов
```typescript
GET /v2/fbs/orders?shopIds={shopId}&size=20&page=0&status={status}
Headers: Authorization: {token}

❗ ВАЖНО: Используется ТОЛЬКО shopIds (БЕЗ shopId)

Response: [
  {
    orderId: string,
    status: string,       // NEW, PENDING, COMPLETED, CANCELLED
    createdAt: string,    // ISO datetime
    amount: number,       // Сумма заказа
    items: [...],         // Товары в заказе
    customer: {...}       // Данные покупателя
  }
]
```

#### Получение количества заказов
```typescript
GET /v2/fbs/orders/count?shopIds={shopId}&status={status}
Headers: Authorization: {token}

❗ ВАЖНО: Используется ТОЛЬКО shopIds (БЕЗ shopId)

Response: number (количество заказов)
```

**Статусы заказов:**
- `NEW` - новые заказы
- `PENDING` - в обработке
- `READY_FOR_SHIPMENT` - готовы к отправке
- `SHIPPED` - отправлены
- `DELIVERED` - доставлены
- `COMPLETED` - завершены
- `CANCELLED` - отменены
- `RETURNED` - возвраты

**Используется в:** UzumOrders, UzumDashboard

---

### 4. Finance (v1)

#### Финансовые заказы
```typescript
GET /v1/finance/orders?shopId={shopId}&shopIds={shopId}&page=0&size=20&dateFrom={ms}&dateTo={ms}
Headers: Authorization: {token}

❗ ВАЖНО: Используются ОБА параметра: shopId И shopIds

Response: {
  orderItems: [
    {
      orderId: string,
      date: string,
      amount: number,
      commission: number
    }
  ],
  totalElements: number
}
```

#### Расходы продавца
```typescript
GET /v1/finance/expenses?shopId={shopId}&shopIds={shopId}&page=0&size=20&dateFrom={ms}&dateTo={ms}
Headers: Authorization: {token}

❗ ВАЖНО: Используются ОБА параметра: shopId И shopIds

Response: {
  expenses: [
    {
      type: string,
      description: string,
      amount: number,
      date: string
    }
  ],
  totalElements: number
}
```

**Используется в:** UzumFinance

---

## 📦 Структура данных

### Магазин (Shop)
```typescript
interface Shop {
  id: number;           // 96273
  name: string;         // "PLAYO"
  description?: string;
}
```

### Товар (Product)
```typescript
interface Product {
  id: number;              // Product ID
  productId?: number;      // Альтернативный ID
  sku: string;             // Артикул
  title: string;           // Название
  name?: string;           // Альтернативное название
  price: number;           // Цена в сумах
  stock: number;           // Остаток на складе
  
  // Фотографии (разные варианты API)
  photos?: string[];       // Массив URL
  images?: string[];       // Альтернатива
  photoLinks?: string[];   // Альтернатива
  mainPhoto?: string;      // Главное фото
  photo?: string;          // Одиночное фото
  imageUrl?: string;       // URL фото
  
  // Дополнительно
  barcode?: string;        // Штрихкод
  brand?: string;          // Бренд
  category?: string;       // Категория
  description?: string;    // Описание
}
```

### Заказ (Order)
```typescript
interface Order {
  orderId: string;
  status: string;          // NEW, PENDING, COMPLETED...
  createdAt: string;       // ISO datetime
  amount: number;          // Сумма
  items: OrderItem[];      // Товары
  customer?: {
    name: string;
    phone: string;
    address: string;
  };
}
```

---

## 🎨 Компоненты

### 1. App.tsx - Главная логика

#### Состояние интеграции
```typescript
const [uzumConnected, setUzumConnected] = useState(false);
const [uzumDecryptedToken, setUzumDecryptedToken] = useState("");
const [uzumShops, setUzumShops] = useState<any[]>([]);
const [uzumSellerInfo, setUzumSellerInfo] = useState<any>(null);
```

#### Проверка токена
```typescript
const handleTestToken = async () => {
  // 1. Проверяет валидность токена через getShops()
  // 2. Сохраняет информацию о магазинах
  // 3. Показывает уведомление с названием магазина и ID
}
```

#### Сохранение токена
```typescript
const handleSaveToken = async () => {
  // 1. Шифрует токен с помощью PIN (AES-GCM-256)
  // 2. Сохраняет в Supabase (integrations таблица)
  // 3. Сохраняет расшифрованный токен для использования
  // 4. Очищает поля ввода
}
```

---

### 2. UzumDashboard.tsx - Панель управления

**Отображает:**
- Список магазинов с ID
- Статистику: товары, заказы, ожидающие заказы
- Кнопки навигации к разделам

**Загрузка данных:**
```typescript
async function loadDashboard() {
  // 1. Получить магазины
  const shopsResult = await getShops(token);
  const shopId = shopsResult.shops[0].id;
  
  // 2. Получить товары
  const productsResult = await getProducts(token, shopId);
  
  // 3. Получить все заказы
  const ordersResult = await getFbsOrdersCount(token, shopId);
  
  // 4. Получить новые заказы
  const pendingResult = await getFbsOrdersCount(token, shopId, { status: 'NEW' });
}
```

---

### 3. UzumProducts.tsx - Товары

**Функционал:**
- ✅ Отображение Product ID
- ✅ Галерея фотографий с навигацией
- ✅ Свайпы для переключения фото
- ✅ Поиск по названию, SKU, штрихкоду
- ✅ Детальная информация о товаре

**Обработка фотографий:**
```typescript
function getProductImages(product: any): string[] {
  // Проверяет все возможные варианты структуры:
  // photos[], images[], photoLinks[], mainPhoto, photo, imageUrl
}
```

---

### 4. UzumOrders.tsx - Заказы

**Функционал:**
- Список заказов с фильтрацией по статусу
- Подтверждение заказов
- Отмена заказов
- Детальная информация о заказе

**Загрузка данных:**
```typescript
async function loadOrders() {
  // 1. Получить shopId
  const shopsResult = await getShops(token);
  const shopId = shopsResult.shops[0].id;
  
  // 2. Загрузить заказы
  const result = await getFbsOrders(token, shopId, { 
    size: 100, 
    page: 0 
  });
}
```

---

### 5. UzumFinance.tsx - Финансы

**Функционал:**
- Финансовые заказы (выручка)
- Расходы продавца
- Расчет прибыли
- Фильтрация по датам

**Загрузка данных:**
```typescript
async function loadShopAndData() {
  // 1. Получить shopId
  const shopsResult = await getShops(token);
  const currentShopId = shopsResult.shops[0].id;
  
  // 2. Загрузить финансы с датами
  const dateFromMs = new Date('2026-01-01').getTime();
  const dateToMs = new Date().getTime();
  
  if (activeTab === 'orders') {
    const result = await getFinanceOrders(token, currentShopId, {
      dateFrom: dateFromMs,
      dateTo: dateToMs
    });
  } else {
    const result = await getFinanceExpenses(token, currentShopId, {
      dateFrom: dateFromMs,
      dateTo: dateToMs
    });
  }
}
```

---

## ⚙️ Настройка под проект

### 1. Получите реальный API токен

1. Войдите в Uzum Seller Cabinet
2. Перейдите в **Настройки → API**
3. Создайте API токен с правами:
   - Чтение магазинов
   - Чтение товаров
   - Чтение заказов
   - Чтение финансов

### 2. Проверьте структуру данных API

```bash
# Проверьте магазины
curl -X 'GET' 'https://api-seller.uzum.uz/api/seller-openapi/v1/shops' \
  -H 'Authorization: YOUR_TOKEN'

# Проверьте товары
curl -X 'GET' 'https://api-seller.uzum.uz/api/seller-openapi/v1/product/shop/YOUR_SHOP_ID?size=10&page=0' \
  -H 'Authorization: YOUR_TOKEN'

# Проверьте заказы
curl -X 'GET' 'https://api-seller.uzum.uz/api/seller-openapi/v2/fbs/orders?shopIds=YOUR_SHOP_ID&size=10' \
  -H 'Authorization: YOUR_TOKEN'
```

### 3. Адаптируйте парсинг данных

В `src/lib/uzum-api.ts` обновите обработку ответов согласно реальной структуре:

```typescript
export async function getProducts(token: string, shopId: number | string) {
  const result = await apiRequest(...);
  
  // Проверьте структуру ответа и адаптируйте:
  let products = [];
  
  if (result.data.productList) {
    products = result.data.productList;
  } else if (result.data.content) {
    products = result.data.content;
  } else if (Array.isArray(result.data)) {
    products = result.data;
  }
  
  // Проверьте поля товаров
  console.log('First product:', products[0]);
  
  return { success: true, products };
}
```

### 4. Обновите поля товаров

В `UzumProducts.tsx` обновите функцию `getProductImages()`:

```typescript
function getProductImages(product: any): string[] {
  const images: string[] = [];
  
  // Добавьте проверку для реальной структуры
  if (product.YOUR_PHOTO_FIELD) {
    images.push(product.YOUR_PHOTO_FIELD);
  }
  
  console.log('Product images:', images);
  return images;
}
```

### 5. Настройте статусы заказов

Проверьте реальные статусы в API и обновите в `UzumOrders.tsx`:

```typescript
const statusOptions = [
  { value: 'all', label: t.all },
  { value: 'YOUR_STATUS_1', label: 'Статус 1' },
  { value: 'YOUR_STATUS_2', label: 'Статус 2' },
  // ...
];
```

### 6. Обновите форматирование

```typescript
// Валюта
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(price) + ' сум';
  // Или другая валюта
}

// Даты
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
```

---

## 🐛 Troubleshooting

### Проблема: "Token not found" (404)

**Причина:** Токен истек или неверный

**Решение:**
1. Перегенерируйте токен в Uzum Seller Cabinet
2. Проверьте формат токена (должен быть без префикса "Bearer")
3. Проверьте права доступа токена

---

### Проблема: "Failed to fetch" / CORS

**Причина:** Браузер блокирует прямые запросы к API

**Решение:** Прокси уже настроен ✅
- DEV: Vite proxy в `vite.config.ts`
- PROD: Cloudflare Function в `functions/api/uzum-proxy.js`

**Проверка прокси:**
```typescript
// В src/lib/uzum-api.ts
const USE_PROXY = true; // ✅ Должно быть true
```

---

### Проблема: Показывает 0 товаров/заказов

**Причины:**
1. Неправильные параметры запроса
2. Пустой магазин
3. Неправильный парсинг ответа

**Отладка:**
```typescript
// Добавьте логи в компоненты
console.log('🏪 Shops:', shopsResult);
console.log('📦 Products response:', productsResult);
console.log('📋 Orders response:', ordersResult);

// Проверьте структуру данных
console.log('First product:', productsResult.products[0]);
console.log('First order:', ordersResult.orders[0]);
```

---

### Проблема: Фотографии не отображаются

**Причины:**
1. Поле с фотографиями называется по-другому в API
2. URL фотографий неверные
3. CORS блокировка изображений

**Решение:**
```typescript
// В UzumProducts.tsx добавьте отладку
function getProductImages(product: any): string[] {
  console.log('Product object:', product);
  console.log('Photo fields:', {
    photos: product.photos,
    images: product.images,
    photoLinks: product.photoLinks,
    mainPhoto: product.mainPhoto,
  });
  
  // Адаптируйте под реальную структуру
}
```

---

### Проблема: Неправильные параметры API

**FBS endpoints требуют:**
```
✅ ?shopIds=96273
❌ ?shopId=96273&shopIds=96273
```

**Finance endpoints требуют:**
```
✅ ?shopId=96273&shopIds=96273
❌ ?shopIds=96273
```

---

## 🎯 Checklist настройки

- [ ] Получен реальный API токен от Uzum
- [ ] Проверена структура данных через curl
- [ ] Обновлен парсинг ответов в `uzum-api.ts`
- [ ] Обновлена обработка фотографий в `UzumProducts.tsx`
- [ ] Проверены статусы заказов
- [ ] Настроено форматирование цен и дат
- [ ] Добавлено логирование для отладки
- [ ] Протестировано в DEV окружении
- [ ] Задеплоено на Cloudflare Pages
- [ ] Проверена работа прокси в продакшене

---

## 📚 Полезные ссылки

- Swagger UI: `https://api-seller.uzum.uz/api/seller-openapi/swagger/swagger-ui/`
- Документация API: `UZUM_API_REFERENCE.md`
- Гайд по интеграции: `UZUM_INTEGRATION_GUIDE.md`
- Финальный отчет: `UZUM_FINAL_REPORT.md`

---

## 🚀 Быстрый старт

1. **Добавьте токен:** В приложении перейдите в "🛒 Uzum" → Введите токен → "🔍 Проверить"
2. **Сохраните:** Создайте PIN → "💾 Сохранить"
3. **Проверьте:** Перезагрузите страницу → Должно показать "✓ Подключено"
4. **Используйте:** Навигация по разделам: Главная, Товары, Заказы, Финансы

---

*Документ обновлен: 2026-01-28*
