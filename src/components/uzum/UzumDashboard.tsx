import { useState, useEffect } from 'react';
import { getShops, getProducts, getFbsOrdersCount, getFinanceOrders, getFinanceExpenses, getFbsSkuStocks } from '../../lib/uzum-api';
import * as UzumCache from '../../lib/uzum-cache';
import UzumWeeklyChart from './UzumWeeklyChart';
import SmartLoader from '../SmartLoader';
import Tooltip from '../Tooltip';
import { 
  FiPackage, 
  FiShoppingCart, 
  FiDollarSign, 
  FiBarChart2,
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiBox
} from 'react-icons/fi';

interface UzumDashboardProps {
  lang: 'ru' | 'uz';
  token: string;
  onNavigate: (page: 'products' | 'orders' | 'finance' | 'stocks') => void;
  onNavigateBack?: () => void;
  onDisconnect?: () => void;
  onChangeLang?: () => void;
  onShowTour?: () => void;
}

export default function UzumDashboard({ lang, token, onNavigate, onDisconnect, onShowTour }: UzumDashboardProps) {
  const [shopId, setShopId] = useState<number | null>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeOrders: 0,
    pendingOrders: 0,
    revenue: 0,
    toPay: 0,
    profit: 0,
    fboStock: 0,
    fbsStock: 0,
    dbsStock: 0,
  });
  const [financeBreakdown, setFinanceBreakdown] = useState({
    // Расходы
    marketing: 0,
    commission: 0,
    logistics: 0,
    fines: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWeeklyChart, setShowWeeklyChart] = useState(false);
  const [datePeriod, setDatePeriod] = useState<7 | 10 | 30>(7);
  const [expenseDatePeriod, setExpenseDatePeriod] = useState<1 | 7 | 14 | 30>(7);

  // Вычисляем диапазон дат на основе выбранного периода
  function getDateRange() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - datePeriod);
    start.setHours(0, 0, 0, 0); // начало дня
    end.setHours(23, 59, 59, 999); // конец дня
    return {
      startMs: start.getTime(),
      endMs: end.getTime()
    };
  }

  const dateRange = getDateRange();

  const T = {
    ru: {
      title: 'Главная страница',
      back: 'Назад',
      loading: 'Загрузка...',
      refreshing: 'Обновление...',
      refresh: 'Обновить',
      financialData: 'Финансовые данные',
      dateRange: 'На дату',
      revenue: 'Выручка',
      toPay: 'К выплате',
      netProfit: 'Чистая прибыль',
      warehouse: 'Товары на складе',
      fboQty: 'Кол-во FBO',
      fboCost: 'Себес. FBO',
      fbsQty: 'Кол-во FBS',
      fbsCost: 'Себес. FBS',
      dbsQty: 'Кол-во DBS',
      dbsCost: 'Себес. DBS',
      recentOrders: 'Последние заказы',
      pending: 'в ожидании',
      delivered: 'доставлено',
      canceled: 'отменено',
      expenses: 'Расходы',
      income: 'Доходы',
      marketing: 'Маркетинг',
      commission: 'Комиссия',
      logistics: 'Логистика',
      fines: 'Штраф FBS',
      products: 'Товары',
      orders: 'Заказы',
      finance: 'Финансы',
      stocks: 'Остатки',
      menu: 'Меню',
      viewAll: 'Смотреть все',
      weeklyChart: 'Недельный обзор заказов',
      today: 'Сегодня',
      last7days: 'Последние 7 дней',
      last10days: 'Последние 10 дней',
      last14days: 'Последние 14 дней',
      last30days: 'Последние 30 дней',
    },
    uz: {
      title: 'Bosh sahifa',
      back: 'Orqaga',
      loading: 'Yuklanmoqda...',
      refreshing: 'Yangilanmoqda...',
      refresh: 'Yangilash',
      financialData: 'Moliyaviy malumotlar',
      dateRange: 'Sanadan',
      revenue: 'Daromad',
      toPay: 'Tolanishi kerak',
      netProfit: 'Sof foyda',
      warehouse: 'Ombordagi mahsulotlar',
      fboQty: 'FBO soni',
      fboCost: 'FBO tannarxi',
      fbsQty: 'FBS soni',
      fbsCost: 'FBS tannarxi',
      dbsQty: 'DBS soni',
      dbsCost: 'DBS tannarxi',
      recentOrders: 'Oxirgi buyurtmalar',
      pending: 'kutilmoqda',
      delivered: 'yetkazildi',
      canceled: 'bekor qilindi',
      expenses: 'Xarajatlar',
      income: 'Daromad',
      marketing: 'Marketing',
      commission: 'Komissiya',
      logistics: 'Logistika',
      fines: 'FBS jarima',
      products: 'Mahsulotlar',
      orders: 'Buyurtmalar',
      finance: 'Moliya',
      stocks: 'Qoldiqlar',
      menu: 'Menyu',
      viewAll: 'Barchasini korish',
      weeklyChart: 'Haftalik buyurtmalar sharhi',
      today: 'Bugun',
      last7days: 'Oxirgi 7 kun',
      last14days: 'Oxirgi 14 kun',
      last10days: 'Oxirgi 10 kun',
      last30days: 'Oxirgi 30 kun',
    },
  };

  const t = T[lang];

  // Load basic dashboard data once
  useEffect(() => {
    // Инициализация кеша при первой загрузке
    if (!UzumCache.getCacheInfo().initialized) {
      console.log('🆕 First load - initializing cache');
      UzumCache.initCache(token);
    }
    
    loadBasicData();
  }, [token]);

  // Load finance data when period changes
  useEffect(() => {
    if (shopId) { // Only load if we have shop data
      loadFinanceData();
    }
  }, [datePeriod, shopId]);

  async function loadBasicData(force: boolean = false) {
    setLoading(true);
    try {
      UzumCache.logCacheState();
      
      // Проверяем кеш (если не принудительная перезагрузка)
      if (!force && UzumCache.hasCachedData('stats') && UzumCache.isCacheValid()) {
        console.log('✅ Loading from cache');
        const cachedStats = UzumCache.getCachedData<typeof stats>('stats');
        const cachedShopId = UzumCache.getCachedShopId();
        
        if (cachedStats) {
          setStats(cachedStats);
        }
        if (cachedShopId) {
          setShopId(cachedShopId);
        }
        
        setLoading(false);
        return;
      }
      
      console.log('🔄 Loading fresh data from API...');
      
      // Load shops
      const shopsResult = await getShops(token);
      console.log('🏪 Shops result:', shopsResult);
      if (shopsResult.success && shopsResult.shops) {
        UzumCache.setCachedData('shops', shopsResult.shops);
        setShops(shopsResult.shops); // Сохраняем shops в state
        
        // Load products and orders for first shop (or selected)
        if (shopsResult.shops.length > 0) {
          const currentShopId = shopId || shopsResult.shops[0].id;
          setShopId(currentShopId);
          UzumCache.updateShopId(currentShopId);
          
          // Load products
          const productsResult = await getProducts(token, currentShopId);
          console.log('📦 Products result:', productsResult);
          
          if (productsResult.success) {
            UzumCache.setCachedData('products', productsResult.products || []);
            
            setStats(prev => ({
              ...prev,
              totalProducts: productsResult.total || 0,
            }));
          }

          // Load warehouse stocks
          try {
            const stocksResult = await getFbsSkuStocks(token, { limit: 1000 });
            console.log('📊 Stocks API full response:', JSON.stringify(stocksResult, null, 2));
            
            if (stocksResult.success && stocksResult.stocks) {
              const stocks = stocksResult.stocks;
              UzumCache.setCachedData('stocks', stocks);
              
              let fboTotal = 0;
              let fbsTotal = 0;
              let dbsTotal = 0;
              
              console.log('📊 Total stock items:', Array.isArray(stocks) ? stocks.length : 'not array');
              console.log('📊 First 3 stock items sample:', stocks.slice(0, 3));
              
              if (Array.isArray(stocks)) {
                stocks.forEach((item: any, index: number) => {
                  // Детальное логирование первых 3 элементов
                  if (index < 3) {
                    console.log(`📊 Item ${index}:`, JSON.stringify(item, null, 2));
                  }
                  
                  // UZUM API формат: { skuId, amount, fbsAllowed, dbsAllowed, ... }
                  if (typeof item.amount === 'number') {
                    // Определяем тип склада по флагам
                    if (item.fbsAllowed && item.fbsLinked) {
                      fbsTotal += item.amount;
                    } else if (item.dbsAllowed && item.dbsLinked) {
                      dbsTotal += item.amount;
                    } else {
                      // По умолчанию FBS
                      fbsTotal += item.amount;
                    }
                  }
                  
                  // Вариант 1: прямые поля fbo, fbs, dbs (числа)
                  if (typeof item.fbo === 'number') fboTotal += item.fbo;
                  if (typeof item.fbs === 'number') fbsTotal += item.fbs;
                  if (typeof item.dbs === 'number') dbsTotal += item.dbs;
                  
                  // Вариант 2: поле stocks с подполями (объект с числами)
                  if (item.stocks && typeof item.stocks === 'object') {
                    if (typeof item.stocks.fbo === 'number') fboTotal += item.stocks.fbo;
                    if (typeof item.stocks.fbs === 'number') fbsTotal += item.stocks.fbs;
                    if (typeof item.stocks.dbs === 'number') dbsTotal += item.stocks.dbs;
                  }
                  
                  // Вариант 3: поле stock с подполями (объект с числами)
                  if (item.stock && typeof item.stock === 'object') {
                    if (typeof item.stock.fbo === 'number') fboTotal += item.stock.fbo;
                    if (typeof item.stock.fbs === 'number') fbsTotal += item.stock.fbs;
                    if (typeof item.stock.dbs === 'number') dbsTotal += item.stock.dbs;
                  }
                });
              }
              
              setStats(prev => {
                const newStats = {
                  ...prev,
                  fboStock: fboTotal,
                  fbsStock: fbsTotal,
                  dbsStock: dbsTotal,
                };
                // Сохраняем в кеш
                UzumCache.setCachedData('stats', newStats);
                return newStats;
              });
              
              console.log('📦 ✅ Calculated warehouse stocks:', { fboTotal, fbsTotal, dbsTotal, totalItems: Array.isArray(stocks) ? stocks.length : 0 });
            } else {
              console.log('⚠️ No stocks data or invalid format:', stocksResult);
            }
          } catch (error) {
            console.error('❌ Error loading stocks:', error);
          }

          // Load orders count - sequential to avoid rate limiting
          const statuses = ['CREATED', 'PACKING', 'PENDING_DELIVERY', 'DELIVERING', 'DELIVERED', 
                           'ACCEPTED_AT_DP', 'DELIVERED_TO_CUSTOMER_DELIVERY_POINT', 
                           'COMPLETED', 'CANCELED', 'PENDING_CANCELLATION', 'RETURNED'];
          
          // Process sequentially with rate limiting built into apiRequest
          let totalOrders = 0;
          for (const status of statuses) {
            const result = await getFbsOrdersCount(token, currentShopId, { status });
            totalOrders += result.count || 0;
          }
          
          console.log('📋 Total orders count:', totalOrders);
          setStats(prev => {
            const newStats = {
              ...prev,
              activeOrders: totalOrders,
            };
            // Сохраняем в кеш
            UzumCache.setCachedData('stats', newStats);
            return newStats;
          });

          // Load pending orders sequentially
          const createdResult = await getFbsOrdersCount(token, currentShopId, { status: 'CREATED' });
          const packingResult = await getFbsOrdersCount(token, currentShopId, { status: 'PACKING' });
          const pendingResult = await getFbsOrdersCount(token, currentShopId, { status: 'PENDING_DELIVERY' });
          
          const pendingTotal = (createdResult.count || 0) + (packingResult.count || 0) + (pendingResult.count || 0);
          
          setStats(prev => {
            const newStats = {
              ...prev,
              pendingOrders: pendingTotal,
            };
            // Сохраняем обновленные stats в кеш
            UzumCache.setCachedData('stats', newStats);
            return newStats;
          });

          // Load initial finance data
          await loadFinanceData();
        }
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadFinanceData() {
    try {
      const shopsResult = await getShops(token);
      if (!shopsResult.success || !shopsResult.shops || shopsResult.shops.length === 0) {
        return;
      }

      const shopId = shopsResult.shops[0].id;

      // Load finance data - orders and expenses
      console.log('📊 Loading finance data for period:', datePeriod, 'days');

      // Load finance orders (revenue) - load ALL orders
      const allFinanceOrders: any[] = [];
          let page = 0;
          let hasMore = true;

          while (hasMore) {
            const financeResult = await getFinanceOrders(token, shopId, {
              size: 100,
              page,
            });
            
            if (financeResult.success && financeResult.orders && financeResult.orders.length > 0) {
              allFinanceOrders.push(...financeResult.orders);
              if (financeResult.orders.length < 100) {
                hasMore = false;
              } else {
                page++;
                // No delay - API handles it fine
              }
            } else {
              hasMore = false;
            }
          }

          console.log('💰 Finance orders loaded:', allFinanceOrders.length);

          // Filter by date range manually
          const filteredOrders = allFinanceOrders.filter(order => {
            const orderDate = order.date || order.createdAt || 0;
            return orderDate >= dateRange.startMs && orderDate <= dateRange.endMs;
          });

          console.log(`💰 Filtered orders for period (${datePeriod} days): ${filteredOrders.length}`);

          // Calculate revenue (sum of sellPrice * amount for non-canceled orders)
          const revenue = filteredOrders.reduce((sum, order) => {
            // Skip canceled orders
            if (order.status === 'CANCELED' || order.cancelled) return sum;
            return sum + ((order.sellPrice || 0) * (order.amount || 1));
          }, 0);

          // Calculate profit (sellerProfit)
          const totalProfit = filteredOrders.reduce((sum, order) => {
            if (order.status === 'CANCELED' || order.cancelled) return sum;
            return sum + ((order.sellerProfit || 0) * (order.amount || 1));
          }, 0);

          // Load expenses
          const allExpenses: any[] = [];
          page = 0;
          hasMore = true;

          while (hasMore) {
            const expensesResult = await getFinanceExpenses(token, shopId, {
              size: 100,
              page,
            });

            if (expensesResult.success && expensesResult.expenses && expensesResult.expenses.length > 0) {
              allExpenses.push(...expensesResult.expenses);
              if (expensesResult.expenses.length < 100) {
                hasMore = false;
              } else {
                page++;
                // No delay needed
              }
            } else {
              hasMore = false;
            }
          }

          console.log('💸 Expenses loaded:', allExpenses.length);

          // Filter expenses by date range
          const filteredExpenses = allExpenses.filter(expense => {
            const expenseDate = expense.dateCreated || expense.createdAt || 0;
            return expenseDate >= dateRange.startMs && expenseDate <= dateRange.endMs;
          });

          console.log(`💸 Filtered expenses for period (${datePeriod} days): ${filteredExpenses.length}`);
          if (filteredExpenses.length > 0) {
            console.log('💸 Sample expense:', filteredExpenses[0]);
          }

          // Calculate expenses by category
          const expensesByCategory = {
            marketing: 0,
            commission: 0,
            logistics: 0,
            fines: 0,
          };

          console.log('💸 Processing expenses, total count:', filteredExpenses.length);
          if (filteredExpenses.length > 0) {
            console.log('💸 Sample expenses (first 3):', filteredExpenses.slice(0, 3).map(e => ({
              amount: e.amount,
              paymentPrice: e.paymentPrice,
              type: e.type,
              source: e.source,
              description: e.description,
              category: e.category
            })));
          }

          filteredExpenses.forEach(expense => {
            // Поддержка разных полей для суммы
            const amount = Math.abs(
              expense.paymentPrice || 
              expense.amount || 
              expense.price || 
              expense.sum || 
              0
            );
            
            const type = (expense.type || expense.category || '').toLowerCase();
            const source = (expense.source || '').toLowerCase();
            const description = (expense.description || expense.name || '').toLowerCase();
            
            // Объединяем все текстовые поля для поиска
            const allText = `${type} ${source} ${description}`.toLowerCase();
            
            // Классификация по категориям
            if (allText.includes('market') || allText.includes('маркет') || allText.includes('marketing') || allText.includes('реклам')) {
              expensesByCategory.marketing += amount;
            } else if (allText.includes('commi') || allText.includes('комисс') || allText.includes('fee') || allText.includes('сбор')) {
              expensesByCategory.commission += amount;
            } else if (allText.includes('logist') || allText.includes('логист') || allText.includes('delivery') || allText.includes('доставк') || allText.includes('shipping')) {
              expensesByCategory.logistics += amount;
            } else if (allText.includes('fine') || allText.includes('штраф') || allText.includes('penalty') || allText.includes('пеня')) {
              expensesByCategory.fines += amount;
            } else {
              // Если не удалось классифицировать - в комиссию по умолчанию
              expensesByCategory.commission += amount;
            }
          });

          console.log('💸 ✅ Expenses by category:', expensesByCategory);

          // Calculate total expenses
          const totalExpenses = filteredExpenses.reduce((sum, expense) => {
            return sum + ((expense.paymentPrice || 0) * (expense.amount || 1));
          }, 0);

          // Update stats with finance data
          setStats(prev => ({
            ...prev,
            revenue,
            toPay: revenue, // К выплате = выручка (упрощенно)
            profit: totalProfit,
          }));

          // Update finance breakdown - only expenses
          setFinanceBreakdown(expensesByCategory);

          console.log('📊 Finance summary:', { 
            period: `Last ${datePeriod} days`,
            dateRangeMs: { start: dateRange.startMs, end: dateRange.endMs },
            revenue, 
            totalExpenses, 
            profit: totalProfit,
            ordersInPeriod: filteredOrders.length,
            expensesInPeriod: filteredExpenses.length,
            breakdown: {
              expenses: expensesByCategory,
            },
            sampleOrderDate: filteredOrders[0]?.date || 'no orders',
            sampleExpenseDate: filteredExpenses[0]?.dateCreated || 'no expenses'
          });
    } catch (error) {
      console.error('Finance load error:', error);
    }
  }

  // Функция принудительного обновления данных
  async function handleRefresh() {
    setRefreshing(true);
    try {
      console.log('🔄 Manual refresh triggered');
      UzumCache.invalidateCache();
      await loadBasicData(true); // force = true
      if (shopId) {
        await loadFinanceData();
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return <SmartLoader type="general" />;
  }

  if (refreshing) {
    return <SmartLoader type="general" />;
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="list" style={{ padding: '0' }}>
      {/* Stylized Top App Bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'white',
        borderBottom: '2px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          maxWidth: '100%',
        }}>
          {/* Левая часть: Название */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flex: 1,
            minWidth: 0,
          }}>
            <h1 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#1E6FDB',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {lang === 'ru' ? 'Главная' : 'Asosiy'}
            </h1>
          </div>

          {/* Правая часть: Компактные иконки */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title={t.refresh}
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: refreshing ? '#e5e7eb' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                opacity: refreshing ? 0.6 : 1,
              }}
            >
              {refreshing ? '⏳' : '🔄'}
            </button>

            <button
              onClick={onShowTour}
              title={lang === 'ru' ? 'Помощь' : 'Yordam'}
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: '#FF9F1C',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              ❓
            </button>

            <button
              onClick={onDisconnect || (() => {})}
              title={lang === 'ru' ? 'Отключить' : 'Uzish'}
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              🚪
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="uzum-header" style={{ marginTop: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
          <h1 className="uzum-header-title" style={{ 
            fontSize: '20px',
            fontWeight: 700,
            color: '#111',
            margin: 0,
          }}>
            {t.title}
          </h1>
          
          {/* Shop Selector */}
          {shops.length > 1 && shopId && (
            <select
              value={shopId}
              onChange={(e) => {
                const newShopId = Number(e.target.value);
                setShopId(newShopId);
                UzumCache.updateShopId(newShopId);
                setLoading(true);
                loadBasicData(true); // Force reload with new shop
              }}
              style={{
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #1E6FDB 0%, #1E6FDB 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 2px 8px rgba(126,34,206,0.3)',
              }}
            >
              {shops.map(shop => (
                <option 
                  key={shop.id} 
                  value={shop.id}
                  style={{
                    background: '#fff',
                    color: '#111',
                  }}
                >
                  🏪 {shop.name || `ID: ${shop.id}`}
                </option>
              ))}
            </select>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => {
              setLoading(true);
              loadBasicData(true);
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
            }}
          >
            <FiRefreshCw size={14} />
            <span style={{ display: window.innerWidth > 640 ? 'inline' : 'none' }}>
              {lang === 'ru' ? 'Обновить' : 'Yangilash'}
            </span>
          </button>
          {onShowTour && (
            <button
              onClick={onShowTour}
              style={{
                padding: '6px 12px',
                backgroundColor: '#1E6FDB',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: '14px' }}>?</span>
              <span style={{ display: window.innerWidth > 640 ? 'inline' : 'none' }}>
                {lang === 'ru' ? 'Гид' : 'Qo\'llanma'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="uzum-container">
        <div className="uzum-grid" style={{
          gridTemplateColumns: window.innerWidth > 768 ? 'repeat(auto-fit, minmax(400px, 1fr))' : '1fr',
        }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Financial Data */}
          <div className="uzum-card" style={{
            maxWidth: '100%',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <h2 style={{
                fontSize: window.innerWidth > 640 ? '18px' : '16px',
                fontWeight: 700,
                color: '#111',
                margin: 0,
              }}>
                {t.financialData}
              </h2>
              <div className="uzum-filters" style={{ 
                padding: 0,
                gap: '6px',
              }}>
                <button
                  onClick={() => setDatePeriod(7)}
                  className={`uzum-filter-chip ${datePeriod === 7 ? 'active' : ''}`}
                  style={{
                    padding: window.innerWidth > 640 ? '6px 12px' : '5px 8px',
                    fontSize: window.innerWidth > 640 ? '12px' : '11px',
                    backgroundColor: datePeriod === 7 ? '#1E6FDB' : '#f3f4f6',
                    color: datePeriod === 7 ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: datePeriod === 7 ? 600 : 400,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {window.innerWidth > 640 ? t.last7days : '7д'}
                </button>
                <button
                  onClick={() => setDatePeriod(10)}
                  className={`uzum-filter-chip ${datePeriod === 10 ? 'active' : ''}`}
                  style={{
                    padding: window.innerWidth > 640 ? '6px 12px' : '5px 8px',
                    fontSize: window.innerWidth > 640 ? '12px' : '11px',
                    backgroundColor: datePeriod === 10 ? '#1E6FDB' : '#f3f4f6',
                    color: datePeriod === 10 ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: datePeriod === 10 ? 600 : 400,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {window.innerWidth > 640 ? t.last10days : '10д'}
                </button>
                <button
                  onClick={() => setDatePeriod(30)}
                  className={`uzum-filter-chip ${datePeriod === 30 ? 'active' : ''}`}
                  style={{
                    padding: window.innerWidth > 640 ? '6px 12px' : '5px 8px',
                    fontSize: window.innerWidth > 640 ? '12px' : '11px',
                    backgroundColor: datePeriod === 30 ? '#1E6FDB' : '#f3f4f6',
                    color: datePeriod === 30 ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: datePeriod === 30 ? 600 : 400,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {window.innerWidth > 640 ? t.last30days : '30д'}
                </button>
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth > 640 ? 'repeat(3, 1fr)' : '1fr',
              gap: window.innerWidth > 640 ? '24px' : '16px',
            }}>
              <div>
                <div style={{
                  fontSize: '13px',
                  color: '#666',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  {t.revenue}
                  <Tooltip 
                    text={lang === 'ru' ? 'Общая сумма продаж за выбранный период' : 'Tanlangan davrdagi jami sotish summasi'} 
                    position="top" 
                  />
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#111',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <FiTrendingUp color="#4CAF50" size={24} />
                  {formatNumber(stats.revenue)}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '13px',
                  color: '#666',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  {t.toPay}
                  <Tooltip 
                    text={lang === 'ru' ? 'Сумма к выплате после вычета комиссий' : 'Komissiyalarni chiqarib tashlashdan keyin tolanadigan summa'} 
                    position="top" 
                  />
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#4CAF50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <FiDollarSign color="#4CAF50" size={24} />
                  {formatNumber(stats.toPay)}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '13px',
                  color: '#666',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  {t.netProfit}
                  <Tooltip 
                    text={lang === 'ru' ? 'Чистая прибыль: выручка минус все расходы' : 'Sof foyda: daromad minus barcha xarajatlar'} 
                    position="top" 
                  />
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: stats.profit < 0 ? '#ef4444' : '#4CAF50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  {stats.profit < 0 ? <FiTrendingDown color="#ef4444" size={24} /> : <FiTrendingUp color="#4CAF50" size={24} />}
                  {formatNumber(stats.profit)}
                </div>
              </div>
            </div>
          </div>

          {/* Warehouse */}
          <div className="uzum-card">
            <h2 style={{
              fontSize: window.innerWidth > 640 ? '18px' : '16px',
              fontWeight: 700,
              color: '#111',
              marginBottom: '16px',
            }}>
              {t.warehouse}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth > 640 ? 'repeat(3, 1fr)' : '1fr',
              gap: window.innerWidth > 640 ? '20px' : '12px',
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                  {t.fboQty}
                </div>
                <div style={{ fontSize: window.innerWidth > 640 ? '24px' : '20px', fontWeight: 700, color: '#1E6FDB' }}>
                  {stats.fboStock}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                  {t.fbsQty}
                </div>
                <div style={{ fontSize: window.innerWidth > 640 ? '24px' : '20px', fontWeight: 700, color: '#4CAF50' }}>
                  {stats.fbsStock}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                  {t.dbsQty}
                </div>
                <div style={{ fontSize: window.innerWidth > 640 ? '24px' : '20px', fontWeight: 700, color: '#FF9F1C' }}>
                  {stats.dbsStock}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="uzum-card" style={{
            maxWidth: '100%',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              flexWrap: 'wrap',
              gap: '8px',
            }}>
              <h2 style={{
                fontSize: window.innerWidth > 640 ? '18px' : '16px',
                fontWeight: 700,
                color: '#111',
                margin: 0,
              }}>
                {t.recentOrders}
              </h2>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {stats.pendingOrders} {t.pending}, 0 {t.delivered}, 0 {t.canceled}
              </div>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="uzum-btn"
              style={{ 
                width: '100%',
                background: 'linear-gradient(135deg, #1E6FDB 0%, #3FA9F5 100%)',
                color: 'white',
                padding: window.innerWidth > 640 ? '12px 24px' : '10px 20px',
              }}
            >
              {t.viewAll} →
            </button>
          </div>
        </div>

        {/* Right Column - Expenses & Income */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Expenses */}
          <div className="uzum-card" style={{
            maxWidth: '100%',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <h2 style={{
                fontSize: window.innerWidth > 640 ? '18px' : '16px',
                fontWeight: 700,
                color: '#111',
                margin: 0,
              }}>
                {t.expenses}
              </h2>
              <div className="uzum-filters" style={{ 
                padding: 0,
                gap: '6px',
                display: 'flex',
                flexWrap: 'wrap',
                maxWidth: '100%',
              }}>
                <button
                  onClick={() => setExpenseDatePeriod(1)}
                  className={`uzum-filter-chip ${expenseDatePeriod === 1 ? 'active' : ''}`}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: expenseDatePeriod === 1 ? '#1E6FDB' : '#f3f4f6',
                    color: expenseDatePeriod === 1 ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: expenseDatePeriod === 1 ? 600 : 400,
                  }}
                >
                  {t.today}
                </button>
                <button
                  onClick={() => setExpenseDatePeriod(7)}
                  className={`uzum-filter-chip ${expenseDatePeriod === 7 ? 'active' : ''}`}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: expenseDatePeriod === 7 ? '#1E6FDB' : '#f3f4f6',
                    color: expenseDatePeriod === 7 ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: expenseDatePeriod === 7 ? 600 : 400,
                  }}
                >
                  7
                </button>
                <button
                  onClick={() => setExpenseDatePeriod(14)}
                  className={`uzum-filter-chip ${expenseDatePeriod === 14 ? 'active' : ''}`}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: expenseDatePeriod === 14 ? '#1E6FDB' : '#f3f4f6',
                    color: expenseDatePeriod === 14 ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: expenseDatePeriod === 14 ? 600 : 400,
                  }}
                >
                  14
                </button>
                <button
                  onClick={() => setExpenseDatePeriod(30)}
                  className={`uzum-filter-chip ${expenseDatePeriod === 30 ? 'active' : ''}`}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: expenseDatePeriod === 30 ? '#1E6FDB' : '#f3f4f6',
                    color: expenseDatePeriod === 30 ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: expenseDatePeriod === 30 ? 600 : 400,
                  }}
                >
                  30
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: '📱', label: t.marketing, value: financeBreakdown.marketing, color: '#3FA9F5' },
                { icon: '💵', label: t.commission, value: financeBreakdown.commission, color: '#1E6FDB' },
                { icon: '🚚', label: t.logistics, value: financeBreakdown.logistics, color: '#FF9F1C' },
                { icon: '⚠️', label: t.fines, value: financeBreakdown.fines, color: '#FF9F1C' },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '6px',
                  }}>
                    <span style={{ fontSize: window.innerWidth > 640 ? '20px' : '18px' }}>{item.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '2px' }}>
                        {item.label}
                      </div>
                      <div style={{ 
                        fontSize: window.innerWidth > 640 ? '18px' : '16px', 
                        fontWeight: 700, 
                        color: '#111',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {formatNumber(item.value)}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    height: '3px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: '100%',
                      backgroundColor: item.color,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="uzum-grid" style={{
        gridTemplateColumns: window.innerWidth > 768 ? 'repeat(5, 1fr)' : 'repeat(2, 1fr)',
        gap: '8px',
        padding: '0 16px 20px',
      }}>
        <button
          onClick={() => onNavigate('products')}
          className="uzum-card"
          style={{
            cursor: 'pointer',
            textAlign: 'center',
            padding: window.innerWidth > 640 ? '24px' : '16px',
            border: 'none',
            background: 'white',
          }}
        >
          <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
            <FiPackage size={window.innerWidth > 640 ? 32 : 28} color="#1E6FDB" />
          </div>
          <div style={{
            fontSize: window.innerWidth > 640 ? '24px' : '20px',
            fontWeight: 700,
            color: '#1E6FDB',
            marginBottom: '4px',
          }}>
            {stats.totalProducts}
          </div>
          <div style={{
            fontSize: window.innerWidth > 640 ? '14px' : '12px',
            color: '#666',
          }}>
            {t.products}
          </div>
        </button>

        <button
          onClick={() => onNavigate('orders')}
          className="uzum-card"
          style={{
            cursor: 'pointer',
            textAlign: 'center',
            padding: window.innerWidth > 640 ? '24px' : '16px',
            border: 'none',
            background: 'white',
          }}
        >
          <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
            <FiShoppingCart size={window.innerWidth > 640 ? 32 : 28} color="#4CAF50" />
          </div>
          <div style={{
            fontSize: window.innerWidth > 640 ? '24px' : '20px',
            fontWeight: 700,
            color: '#4CAF50',
            marginBottom: '4px',
          }}>
            {stats.activeOrders}
          </div>
          <div style={{
            fontSize: window.innerWidth > 640 ? '14px' : '12px',
            color: '#666',
          }}>
            {t.orders}
          </div>
        </button>

        <button
          onClick={() => onNavigate('finance')}
          className="uzum-card"
          style={{
            cursor: 'pointer',
            textAlign: 'center',
            padding: window.innerWidth > 640 ? '24px' : '16px',
            border: 'none',
            background: 'white',
          }}
        >
          <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
            <FiDollarSign size={window.innerWidth > 640 ? 32 : 28} color="#FF9F1C" />
          </div>
          <div style={{
            fontSize: window.innerWidth > 640 ? '24px' : '20px',
            fontWeight: 700,
            color: '#FF9F1C',
            marginBottom: '4px',
          }}>
            {formatNumber(stats.toPay)}
          </div>
          <div style={{
            fontSize: window.innerWidth > 640 ? '14px' : '12px',
            color: '#666',
          }}>
            {t.finance}
          </div>
        </button>

        <button
          onClick={() => onNavigate('stocks')}
          className="uzum-card"
          style={{
            cursor: 'pointer',
            textAlign: 'center',
            padding: window.innerWidth > 640 ? '24px' : '16px',
            border: 'none',
            background: 'white',
          }}
        >
          <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
            <FiBox size={window.innerWidth > 640 ? 32 : 28} color="#1E6FDB" />
          </div>
          <div style={{
            fontSize: window.innerWidth > 640 ? '24px' : '20px',
            fontWeight: 700,
            color: '#1E6FDB',
            marginBottom: '4px',
          }}>
            {stats.fbsStock}
          </div>
          <div style={{
            fontSize: window.innerWidth > 640 ? '14px' : '12px',
            color: '#666',
          }}>
            {t.stocks}
          </div>
        </button>

        <button
          onClick={() => {
            alert(
              lang === 'ru' 
                ? 'Товары\nЗаказы\nФинансы\nОстатки\nНакладные\nОтчёты'
                : 'Mahsulotlar\nBuyurtmalar\nMoliya\nQoldiqlar\nHujjatlar\nHisobotlar'
            );
          }}
          className="uzum-card"
          style={{
            cursor: 'pointer',
            textAlign: 'center',
            padding: window.innerWidth > 640 ? '24px' : '16px',
            border: 'none',
            background: 'white',
          }}
        >
          <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
            <FiBarChart2 size={window.innerWidth > 640 ? 32 : 28} color="#3FA9F5" />
          </div>
          <div style={{
            fontSize: window.innerWidth > 640 ? '16px' : '14px',
            fontWeight: 700,
            color: '#3FA9F5',
            marginBottom: '4px',
          }}>
            {t.menu}
          </div>
          <div style={{
            fontSize: window.innerWidth > 640 ? '14px' : '12px',
            color: '#666',
          }}>
            {lang === 'ru' ? 'Все разделы' : 'Barcha bo\'limlar'}
          </div>
        </button>
      </div>

      {/* Weekly Chart Modal */}
      {showWeeklyChart && shopId && (
        <UzumWeeklyChart 
          lang={lang} 
          token={token}
          shopId={shopId}
          onClose={() => setShowWeeklyChart(false)}
        />
      )}
    </div>
  );
}
