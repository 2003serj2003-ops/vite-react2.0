#!/bin/bash

TOKEN="17Z3s6FTmT6A/GJuWemvSttvA+Cw9MqQQzBjLQUwi4nCt5LGwmr+6TuGVSAePqkHFYP6hg=="
SHOP_ID=96273

echo "═══════════════════════════════════════════════════════"
echo "🧪 ТЕСТ РАЗНЫХ СТАТУСОВ ДЛЯ /v2/fbs/orders/count"
echo "═══════════════════════════════════════════════════════"
echo ""

statuses=("NEW" "PENDING" "READY_FOR_SHIPMENT" "SHIPPED" "DELIVERED" "COMPLETED" "CANCELLED" "RETURNED")

for status in "${statuses[@]}"; do
  echo "📋 Проверка статуса: $status"
  echo "🔍 URL: https://api-seller.uzum.uz/api/seller-openapi/v2/fbs/orders/count?shopIds=$SHOP_ID&status=$status"
  
  response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X 'GET' \
    "https://api-seller.uzum.uz/api/seller-openapi/v2/fbs/orders/count?shopIds=$SHOP_ID&status=$status" \
    -H 'accept: */*' \
    -H "Authorization: $TOKEN")
  
  http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
  body=$(echo "$response" | sed '/HTTP_CODE:/d')
  
  echo "   Статус: $http_code"
  echo "   Ответ: $body"
  echo ""
  
  sleep 1
done

echo "═══════════════════════════════════════════════════════"
echo "✅ ТЕСТЫ ЗАВЕРШЕНЫ"
echo "═══════════════════════════════════════════════════════"
