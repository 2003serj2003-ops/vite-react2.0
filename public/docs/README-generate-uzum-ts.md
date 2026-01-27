# Генерация endpoints.ts и schemas.ts для Uzum Seller OpenAPI

## 1) Команда
```bash
OPENAPI_URL="https://api-seller.uzum.uz/api/seller-openapi/swagger/api-docs" node scripts/generate-uzum-ts.mjs
```

## 2) Результат
Файлы появятся тут:
- `src/integrations/uzum/generated/endpoints.ts`
- `src/integrations/uzum/generated/schemas.ts`

## 3) Что внутри
- endpoints.ts: массив `UZUM_ENDPOINTS` (все пути/методы/параметры/requestBody/responses + operationId/описания)
- schemas.ts: `UZUM_SCHEMAS` = `components.schemas` (вся схема моделей как const)

> Эти файлы большие — это нормально. Они нужны, чтобы дальше автоматически строить SDK/клиент и валидировать ответы.
