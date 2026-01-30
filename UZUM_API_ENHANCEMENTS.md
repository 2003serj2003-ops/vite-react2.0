# Улучшения для Uzum компонентов

## Найденные API эндпоинты из Swagger

### 1. Получение этикеток
**Эндпоинт:** `GET /v1/fbs/order/{orderId}/labels/print`
- **Параметры:**
  - `orderId` (path, required) - ID заказа
  - `size` (query, required) - Размер этикетки:
    - `LARGE` (58x40mm) - по умолчанию
    - `BIG` (43x25mm)
- **Возвращает:** Файл этикетки (PDF)

### 2. Получение остатков
**Эндпоинт:** `GET /v2/fbs/sku/stocks`
- Возвращает доступные для обновления остатки FBS и DBS SKU
- Ответ содержит информацию по каждому SKU

### 3. Обновление остатков
**Эндпоинт:** `POST /v2/fbs/sku/stocks`
- **Body:** массив объектов с SKU и количеством
- Обновляет FBS и DBS остатки

### 4. Причины возврата
**Эндпоинт:** `GET /v1/fbs/order/return-reasons`
- Возвращает список причин возврата для заказов

### 5. Информация о товарах
**Эндпоинт:** `GET /v1/product/shop/{shopId}`
- Содержит поля для остатков:
  - `quantityActive` - FBO остатки
  - `quantityFbs` - FBS остатки  
  - `quantityAdditional` - DBS остатки (дополнительные)

## План реализации

### UzumProducts.tsx
- [x] Получить список всех магазинов
- [ ] Добавить выпадающий список выбора магазина (если > 1)
- [ ] Показать остатки FBO/FBS/DBS для каждого товара
- [ ] Добавить модальное окно редактирования остатков FBS
- [ ] Реализовать функцию обновления остатков через API

### UzumOrders.tsx
- [ ] Сделать заказы accordion (раскрывающиеся)
- [ ] Показать детальную информацию о заказе при раскрытии
- [ ] Добавить кнопку "Получить этикетку" с выбором размера
- [ ] Реализовать скачивание/отправку этикетки в Telegram
- [ ] Добавить кнопку "Отменить заказ" рядом с номером
- [ ] Для возвращенных заказов получить и показать причину возврата

### uzum-api.ts
- [x] `getFbsOrderLabel(token, orderId, size)` - уже есть
- [x] `getFbsSkuStocks(token)` - уже есть  
- [x] `updateFbsSkuStocks(token, stocks)` - уже есть
- [x] `getFbsReturnReasons(token)` - уже есть
- [ ] Добавить функцию отправки файла в Telegram бот

## Структура данных товара

```typescript
{
  productId: number,
  skuList: [{
    skuId: number,
    skuTitle: string,
    quantityActive: number,    // FBO остатки
    quantityFbs: number,        // FBS остатки
    quantityAdditional: number, // DBS остатки
    price: number,
    // ... другие поля
  }],
  // ... другие поля
}
```

## Структура данных заказа

```typescript
{
  orderId: number,
  postingNumber: string,
  status: string,
  customerOrderId: string,
  deliveryDate: string,
  items: [...],
  // ... другие поля
}
```
