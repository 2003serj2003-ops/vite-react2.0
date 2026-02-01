/**
 * Общие утилиты для форматирования данных
 */

/**
 * Форматирование даты
 * Поддерживает timestamp (number) и строки ISO 8601
 */
export function formatDate(dateString: string | number | null | undefined): string {
  if (!dateString) return 'Нет данных';
  
  try {
    let date: Date;
    
    // Если это число (timestamp)
    if (typeof dateString === 'number') {
      date = new Date(dateString);
    } else {
      date = new Date(dateString);
    }
    
    // Проверка на валидность даты
    if (isNaN(date.getTime())) {
      return 'Неверная дата';
    }
    
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Ошибка форматирования даты:', error);
    return 'Ошибка даты';
  }
}

/**
 * Форматирование числа с разделителями тысяч
 */
export function formatNumber(num: number): string {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(num);
}

/**
 * Форматирование суммы с валютой
 */
export function formatSum(num: number, currency: string = 'сум'): string {
  return `${formatNumber(num)} ${currency}`;
}

/**
 * Форматирование процентов
 */
export function formatPercent(num: number, decimals: number = 1): string {
  if (typeof num !== 'number' || isNaN(num)) return '0%';
  return `${num.toFixed(decimals)}%`;
}

/**
 * Сокращение больших чисел (1000 -> 1K, 1000000 -> 1M)
 */
export function formatCompactNumber(num: number): string {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Форматирование статуса заказа для отображения
 */
export function formatOrderStatus(status: string, lang: 'ru' | 'uz' = 'ru'): string {
  const statusMap = {
    ru: {
      CREATED: 'Создан',
      PACKING: 'Упаковка',
      PENDING_DELIVERY: 'Ожидает доставки',
      DELIVERING: 'Доставляется',
      DELIVERED: 'Доставлен',
      ACCEPTED_AT_DP: 'Принят в пункте',
      DELIVERED_TO_CUSTOMER_DELIVERY_POINT: 'Доставлен в пункт',
      COMPLETED: 'Завершен',
      CANCELED: 'Отменен',
      PENDING_CANCELLATION: 'Ожидает отмены',
      RETURNED: 'Возврат',
    },
    uz: {
      CREATED: 'Yaratilgan',
      PACKING: 'Qadoqlanmoqda',
      PENDING_DELIVERY: 'Yetkazib berishni kutmoqda',
      DELIVERING: 'Yetkazilmoqda',
      DELIVERED: 'Yetkazildi',
      ACCEPTED_AT_DP: 'Punktda qabul qilindi',
      DELIVERED_TO_CUSTOMER_DELIVERY_POINT: 'Punktga yetkazildi',
      COMPLETED: 'Yakunlandi',
      CANCELED: 'Bekor qilindi',
      PENDING_CANCELLATION: 'Bekor qilishni kutmoqda',
      RETURNED: 'Qaytarildi',
    }
  };

  return statusMap[lang][status as keyof typeof statusMap.ru] || status;
}

/**
 * Получение цвета для статуса заказа
 */
export function getOrderStatusColor(status: string): string {
  const colorMap: { [key: string]: string } = {
    CREATED: '#1E6FDB', // blue
    PACKING: 'var(--accent-warning)', // amber
    PENDING_DELIVERY: '#3FA9F5', // purple
    DELIVERING: '#06b6d4', // cyan
    DELIVERED: 'var(--accent-success)', // green
    ACCEPTED_AT_DP: 'var(--accent-success)', // green
    DELIVERED_TO_CUSTOMER_DELIVERY_POINT: 'var(--accent-success)', // green
    COMPLETED: 'var(--accent-success)', // green
    CANCELED: 'var(--accent-danger)', // red
    PENDING_CANCELLATION: 'var(--accent-warning)', // orange
    RETURNED: 'var(--accent-danger)', // red
  };

  return colorMap[status] || '#6b7280'; // gray default
}

/**
 * Проверка, является ли заказ активным
 */
export function isOrderActive(status: string): boolean {
  const activeStatuses = [
    'CREATED',
    'PACKING',
    'PENDING_DELIVERY',
    'DELIVERING',
    'ACCEPTED_AT_DP',
  ];
  return activeStatuses.includes(status);
}

/**
 * Проверка, является ли заказ завершенным
 */
export function isOrderCompleted(status: string): boolean {
  const completedStatuses = [
    'DELIVERED',
    'DELIVERED_TO_CUSTOMER_DELIVERY_POINT',
    'COMPLETED',
  ];
  return completedStatuses.includes(status);
}

/**
 * Проверка, является ли заказ отмененным
 */
export function isOrderCancelled(status: string, cancelled?: boolean): boolean {
  return cancelled === true || status === 'CANCELED' || status === 'RETURNED';
}

/**
 * Задержка (для rate limiting и других целей)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Безопасное получение вложенного свойства объекта
 */
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return defaultValue;
    }
  }
  
  return result as T;
}

/**
 * Копирование текста в буфер обмена
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback для старых браузеров
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (error) {
    console.error('Ошибка копирования в буфер обмена:', error);
    return false;
  }
}

/**
 * Дебаунс функции
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle функции
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Группировка массива по ключу
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Сумма значений в массиве
 */
export function sum(array: number[]): number {
  return array.reduce((acc, val) => acc + (val || 0), 0);
}

/**
 * Среднее значение в массиве
 */
export function average(array: number[]): number {
  if (array.length === 0) return 0;
  return sum(array) / array.length;
}
