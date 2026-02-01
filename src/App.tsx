import { type ReactNode, useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "./supabase";
import "./App.css";
// import Chat from "./Chat"; // ВРЕМЕННО ОТКЛЮЧЕНО - раскомментировать когда доработаешь
import { encryptToken, validatePin, isCryptoAvailable } from "./lib/crypto";
import { getShops } from "./lib/uzum-api";
import * as UzumCache from "./lib/uzum-cache";
import UzumDashboard from "./components/uzum/UzumDashboard";
import UzumProducts from "./components/uzum/UzumProducts";
import UzumOrders from "./components/uzum/UzumOrders";
import UzumFinance from "./components/uzum/UzumFinance";
import UzumInvoices from "./components/uzum/UzumInvoices";
import UzumReports from "./components/uzum/UzumReports";
import UzumStocks from "./components/uzum/UzumStocks";
import UzumOnboarding from "./components/UzumOnboarding";
import Profile from "./components/Profile";

type Lang = "ru" | "uz";

type SectionRow = {
  id: string;
  key: string;
  title_ru: string;
  title_uz: string;
  icon: string;
  sort: number;
};

type CardRow = {
  id: string;
  section_id: string;
  title_ru: string;
  title_uz: string;
  body_ru: string;
  body_uz: string;
  sort: number;
  file_url?: string;
  map_url?: string;
};

type NewsRow = {
  id: string;
  title_ru: string;
  title_uz: string;
  body_ru: string;
  body_uz: string;
  published_at: string;
  pinned: boolean;
  image_url?: string;
};

type FaqRow = {
  id: string;
  question_ru: string;
  question_uz: string;
  answer_ru: string;
  answer_uz: string;
  sort: number;
};

const ADMIN_CODE = "SANYA4565"; // ввод без учета регистра: Sanya4565 / sanya4565 / SANYA4565

const FACE_EMOJIS = ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "😑", "😐", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤮", "🤢", "🤮", "🤮", "🤮", "🤮", "🤮", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁", "☹️", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾"];

const getRandomEmoji = () => FACE_EMOJIS[Math.floor(Math.random() * FACE_EMOJIS.length)];

const T = {
  ru: {
    welcome: "Добро\nпожаловать",
    enterCode: "Введите код доступа",
    acceptRules: "Принимаю правила пользования",
    continue: "Продолжить",
    search: "Поиск",
    hello: "Здравствуйте",
    sections: "РАЗДЕЛЫ",
    news: "НОВОСТИ",
    back: "Назад",
    home: "Домой",
    faq: "FAQ",
    open: "Открыть",
    copyAll: "Скопировать всё",
    copied: "Скопировано",
    invalidCode: "Неверный код доступа",
    admin: "Админ",
    manageSections: "Разделы",
    manageCards: "Карточки",
    manageNews: "Новости",
    manageFaq: "FAQ",
    manageCodes: "Коды доступа",
    save: "Сохранить",
    add: "Добавить",
    delete: "Удалить",
    titleRu: "Заголовок (RU)",
    titleUz: "Заголовок (UZ)",
    bodyRu: "Текст (RU)",
    bodyUz: "Текст (UZ)",
    questionRu: "Вопрос (RU)",
    questionUz: "Вопрос (UZ)",
    answerRu: "Ответ (RU)",
    answerUz: "Ответ (UZ)",
    icon: "Иконка",
    sort: "Порядок",
    pinned: "Закреп",
    date: "Дата",
    code: "Код",
    active: "Активен",
    expiresAt: "Истекает (необяз.)",
    note: "Заметка",
    signOut: "Выйти",
    cards: "КАРТОЧКИ",
    allSections: "Все разделы",
    allNews: "Все новости",
    chooseSection: "Выбери раздел",
    ok: "Ок",
    error: "Ошибка",
  },
  uz: {
    welcome: "Xush\nkelibsiz",
    enterCode: "Kirish kodini kiriting",
    acceptRules: "Foydalanish qoidalarini qabul qilaman",
    continue: "Davom etish",
    search: "Qidirish",
    hello: "Salom",
    sections: "BO‘LIMLAR",
    news: "YANGILIKLAR",
    back: "Orqaga",
    home: "Bosh sahifa",
    faq: "FAQ",
    open: "Ochish",
    copyAll: "Hammasini nusxalash",
    copied: "Nusxalandi",
    invalidCode: "Kod noto‘g‘ri",
    admin: "Admin",
    manageSections: "Bo‘limlar",
    manageCards: "Kartochkalar",
    manageNews: "Yangiliklar",
    manageFaq: "FAQ",
    manageCodes: "Kirish kodlari",
    save: "Saqlash",
    add: "Qo‘shish",
    delete: "O‘chirish",
    titleRu: "Sarlavha (RU)",
    titleUz: "Sarlavha (UZ)",
    bodyRu: "Matn (RU)",
    bodyUz: "Matn (UZ)",
    questionRu: "Savol (RU)",
    questionUz: "Savol (UZ)",
    answerRu: "Javob (RU)",
    answerUz: "Javob (UZ)",
    icon: "Belgi",
    sort: "Tartib",
    pinned: "Mahkamlash",
    date: "Sana",
    code: "Kod",
    active: "Faol",
    expiresAt: "Tugash (ixtiyoriy)",
    note: "Izoh",
    signOut: "Chiqish",
    cards: "KARTOCHKALAR",
    allSections: "Barcha bo‘limlar",
    allNews: "Barcha yangiliklar",
    chooseSection: "Bo‘limni tanlang",
    ok: "Ok",
    error: "Xato",
  },
} as const;

type Route =
  | { name: "welcome" }
  | { name: "home" }
  | { name: "faq" }
  | { name: "profile" }
  | { name: "section"; sectionId: string }
  | { name: "card"; cardId: string }
  | { name: "news" }
  | { name: "news_item"; newsId: string }
  | { name: "news_card"; newsId: string }
  | { name: "admin" }
  | { name: "sections_all" }
  | { name: "commissions" }
  | { name: "uzum" }
  | { name: "chat" };

function TopBar(props: {
  t: (typeof T)[Lang];
  lang: Lang;
  setLang: (l: Lang) => void;
  showSearch: boolean;
  search: string;
  setSearch: (v: string) => void;
  onBack: () => void;
  onHome: () => void;
  rightSlot?: ReactNode;
  searchDropdown?: ReactNode;
}) {
  const { t, lang, setLang, showSearch, search, setSearch, onBack, onHome, rightSlot, searchDropdown } = props;

  return (
    <div className="topbar" style={{ padding: "8px 16px", position: 'relative' }}>
      {rightSlot ? (
        rightSlot
      ) : (
        <button className="smallIconBtn" onClick={onBack} aria-label={t.back}>
          ←
        </button>
      )}

      {showSearch ? (
        <div style={{ flex: 1, position: 'relative' }}>
          <div className="searchWrap">
            <input
              className="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
            />
          </div>
          {searchDropdown}
        </div>
      ) : (
        <div className="searchWrap" style={{ justifyContent: "center" }}>
          <div className="topbarTitle">{t.home}</div>
        </div>
      )}

      <button 
        className="langBtn" 
        onClick={() => setLang(lang === "ru" ? "uz" : "ru")}
        aria-label="Change language"
      >
        {lang.toUpperCase()}
      </button>

      {!rightSlot && (
        <button className="smallIconBtn" onClick={onHome} aria-label={t.home}>
          ⌂
        </button>
      )}
    </div>
  );
}

function BottomBar(props: {
  userName: string;
  userPhoto: string;
  onSignOut: () => void;
}) {
  const { userName, onSignOut } = props;
  const userEmoji = useMemo(() => getRandomEmoji(), []); // Фиксируем смайлик при загрузке

  return (
    <div className="bottombar" style={{ padding: "8px 16px" }}>
      <div className="userPhotoPlaceholder" style={{ fontSize: "32px" }}>
        {userEmoji}
      </div>
      <div className="userInfo">
        <div className="userName">{userName || "Guest"}</div>
      </div>
      <button className="smallIconBtn signOutBtn" onClick={onSignOut} aria-label="Sign out">
        ✕
      </button>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="cardCream" style={{ marginBottom: "10px" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          textAlign: "left",
          background: "none",
          border: "none",
          padding: "15px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold",
          color: "#333"
        }}
      >
        {question}
        <span style={{ float: "right", fontSize: "18px" }}>{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && (
        <div style={{ padding: "0 15px 15px 15px", color: "#555" }}>
          {answer}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState<Lang>((localStorage.getItem("lang") as Lang) || "ru");
  const t: (typeof T)[Lang] = T[lang];

  const [route, setRoute] = useState<Route>(() => {
    // Режим разработки - автоматический вход ТОЛЬКО для локального тестирования
    const isDevelopment = import.meta.env.DEV && window.location.hostname === 'localhost';
    
    if (isDevelopment) {
      console.log("[DEV MODE] Auto-login enabled for localhost");
      localStorage.setItem("access_ok", "1");
      localStorage.setItem("user_role", "viewer");
      return { name: "home" };
    }
    
    // В production проверяем код доступа
    const ok = localStorage.getItem("access_ok") === "1";
    
    if (!ok) {
      console.log("[PRODUCTION] No access code, showing welcome screen");
      return { name: "welcome" };
    }
    
    return { name: "home" };
  });

  const [search, setSearch] = useState("");

  const [code, setCode] = useState("");
  const [rules, setRules] = useState(false);
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const [error, setError] = useState("");

  const [toast, setToast] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const [sections, setSections] = useState<SectionRow[]>([]);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [faq, setFaq] = useState<FaqRow[]>([]);

  const [adminOk, setAdminOk] = useState<boolean>(() => localStorage.getItem("admin_ok") === "1");
  const [userName, setUserName] = useState<string>(() => localStorage.getItem("user_name") || "");
  const [userRole, setUserRole] = useState<string>(() => localStorage.getItem("user_role") || "viewer");

  // Состояние для страницы комиссий
  const [commissionSearch, setCommissionSearch] = useState("");
  const [commissionResults, setCommissionResults] = useState<any[]>([]);
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  
  // Калькулятор прибыли
  const [showCalculator, setShowCalculator] = useState(false);
  const [showCalcInstruction, setShowCalcInstruction] = useState(false);
  const [commissionHistory, setCommissionHistory] = useState<any[]>([]);
  const [calcSelectedCommission, setCalcSelectedCommission] = useState<any>(null);
  const [calcGabarit, setCalcGabarit] = useState<"МГТ" | "СГТ" | "КГТ">("МГТ");
  const [calcSaleAmount, setCalcSaleAmount] = useState("");
  const [calcCommType, setCalcCommType] = useState<"fbo" | "fbs" | "dbs">("fbo");

  // Uzum Integration State
  const [uzumToken, setUzumToken] = useState("");
  const [uzumPin, setUzumPin] = useState("");
  const [uzumConnected, setUzumConnected] = useState(false);
  const [uzumLoading, setUzumLoading] = useState(false);
  const [uzumError, setUzumError] = useState("");
  const [uzumShops, setUzumShops] = useState<any[]>([]);
  const [uzumSellerInfo, setUzumSellerInfo] = useState<any>(null);
  const [uzumIntegrationId, setUzumIntegrationId] = useState<string | null>(null);
  const [showUzumToken, setShowUzumToken] = useState(false);
  const [showUzumPin, setShowUzumPin] = useState(false);
  const [uzumCurrentPage, setUzumCurrentPage] = useState<'dashboard' | 'products' | 'orders' | 'finance' | 'invoices' | 'reports' | 'stocks'>('dashboard');
  const [uzumDecryptedToken, setUzumDecryptedToken] = useState(""); // Для использования в API запросах
  const [showUzumOnboarding, setShowUzumOnboarding] = useState(false);
  console.log('Uzum integration ID:', uzumIntegrationId); // используем переменную

  // Загрузка истории комиссий при входе пользователя
  useEffect(() => {
    if (userName) {
      try {
        const savedHistory = localStorage.getItem(`commission_history_${userName}`);
        if (savedHistory) {
          setCommissionHistory(JSON.parse(savedHistory));
        } else {
          setCommissionHistory([]);
        }
      } catch {
        setCommissionHistory([]);
      }
    } else {
      setCommissionHistory([]);
    }
  }, [userName]);

  // Сохранение истории комиссий в localStorage при изменении
  useEffect(() => {
    if (userName && commissionHistory.length > 0) {
      localStorage.setItem(`commission_history_${userName}`, JSON.stringify(commissionHistory));
    }
  }, [commissionHistory, userName]);

  // Проверка прав доступа
  const canEdit = () => ["editor", "admin", "owner"].includes(userRole);
  const canManage = () => ["admin", "owner"].includes(userRole);

  // Загрузка профиля пользователя из базы
  const loadUserProfile = async (telegramId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_name')
        .eq('telegram_id', telegramId)
        .maybeSingle();

      if (error) {
        console.log('[Profile] Error loading:', error);
        return;
      }

      if (data && data.user_name) {
        setUserName(data.user_name);
        localStorage.setItem('user_name', data.user_name);
        console.log('[Profile] Loaded:', data.user_name);
      }
    } catch (err) {
      console.error('[Profile] Load error:', err);
    }
  };

  // Поиск комиссий по категории
  const searchCommissions = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setCommissionResults([]);
      return;
    }

    try {
      const searchTerm = query.trim().toLowerCase();
      
      // Получаем все записи для фильтрации
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .limit(1000);

      if (error) {
        console.error('Commission search error:', error);
        return;
      }

      // Фильтруем по последним ДВУМ заполненным уровням категории
      const filtered = (data || []).filter((item: any) => {
        // Находим последние два заполненных уровня (с 6 до 1)
        // Ищем в текущем языке (ru или uz)
        const lastTwoCategories: string[] = [];
        for (let i = 6; i >= 1; i--) {
          const cat = item[`category${i}_${lang}`];
          if (cat && cat.trim()) {
            lastTwoCategories.push(cat.toLowerCase());
            if (lastTwoCategories.length === 2) break;
          }
        }
        
        // Ищем в последних двух заполненных уровнях текущего языка
        return lastTwoCategories.some(cat => cat.includes(searchTerm));
      }).slice(0, 20);

      setCommissionResults(filtered);
    } catch (err) {
      console.error('Commission search error:', err);
    }
  };

  // keep lang
  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  // Save user to telegram_subscribers table
  const saveUserToDb = async (userId: number, firstName?: string, lastName?: string) => {
    try {
      await supabase.from("telegram_subscribers").upsert(
        {
          id: userId,
          first_name: firstName || null,
          last_name: lastName || null,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      console.log("[DB] ✓ User saved:", userId);
    } catch (err) {
      console.log("[DB] ⚠ Error saving user:", err);
    }
  };

  // ============================================
  // UZUM INTEGRATION FUNCTIONS
  // ============================================

  // 🔧 ФЛАГ: Требовать Telegram ID для интеграций
  // Установите false для работы без привязки к Telegram ID
  const REQUIRE_TELEGRAM_ID = false;

  // Get Telegram user ID
  const getTelegramUserId = (): string | null => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      const userId = tg?.initDataUnsafe?.user?.id;
      return userId ? userId.toString() : null;
    } catch {
      return null;
    }
  };

  // Load existing Uzum integration from DB
  const loadUzumIntegration = async () => {
    const userId = getTelegramUserId();
    if (!userId && REQUIRE_TELEGRAM_ID) {
      console.log('[Uzum] No Telegram user ID');
      return;
    }

    try {
      // Используем userId если есть, иначе используем фиксированный ID
      const actualUserId = userId || 'default_user';
      
      // Попытка поиска по telegram_user_id если доступно
      const tgUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
      
      let data = null;
      let error = null;

      // Сначала пытаемся найти по telegram_user_id
      if (tgUserId) {
        const result = await supabase
          .from('integrations')
          .select('*')
          .eq('telegram_user_id', tgUserId)
          .eq('provider', 'uzum')
          .maybeSingle();
        
        data = result.data;
        error = result.error;
        
        if (data) {
          console.log('[Uzum] ✓ Integration found by Telegram ID:', tgUserId);
        }
      }

      // Если не нашли по telegram_user_id, ищем по user_id
      if (!data) {
        const result = await supabase
          .from('integrations')
          .select('*')
          .eq('user_id', actualUserId)
          .eq('provider', 'uzum')
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      }

      if (error && error.code !== 'PGRST116') {
        console.error('[Uzum] Load error:', error);
        return;
      }

      if (data) {
        setUzumIntegrationId(data.id);
        
        // Расшифровываем токен из базы данных
        // Пробуем получить PIN из session storage
        const sessionPIN = sessionStorage.getItem('uzum_pin_temp');
        
        if (sessionPIN && data.token_cipher && data.token_iv && data.token_salt) {
          try {
            const { decryptToken } = await import('./lib/crypto');
            const decrypted = await decryptToken(
              data.token_cipher,
              data.token_iv,
              data.token_salt,
              sessionPIN
            );
            
            if (decrypted) {
              setUzumDecryptedToken(decrypted);
              setUzumConnected(true);
              console.log('[Уzum] ✓ Token decrypted from session');
            } else {
              // PIN неверный, требуется повторное подключение
              console.log('[Uzum] Session PIN invalid, need reconnect');
            }
          } catch (err) {
            console.error('[Uzum] Decryption error:', err);
          }
        } else {
          // PIN нет в session storage, потребуется повторное подключение
          console.log('[Uzum] No session PIN, need reconnect');
        }
        
        setUzumShops(data.metadata?.shops || []);
        setUzumSellerInfo(data.metadata?.sellerInfo || null);
        console.log('[Uzum] ✓ Integration loaded');
      }
    } catch (err) {
      console.error('[Uzum] Load exception:', err);
    }
  };

  // Test token validity
  const handleTestToken = async () => {
    if (!uzumToken.trim()) {
      setUzumError('Введите токен');
      return;
    }

    if (!isCryptoAvailable()) {
      setUzumError('WebCrypto API недоступен в вашем браузере');
      return;
    }

    setUzumLoading(true);
    setUzumError('');

    try {
      // Проверяем токен через получение магазинов
      const shopsResult = await getShops(uzumToken);
      
      if (!shopsResult.success) {
        setUzumError(shopsResult.error || 'Токен недействителен');
        setUzumLoading(false);
        return;
      }

      if (shopsResult.shops && shopsResult.shops.length > 0) {
        setUzumShops(shopsResult.shops);
        setUzumSellerInfo({ 
          shops: shopsResult.shops,
          shopId: shopsResult.shops[0].id,
          shopName: shopsResult.shops[0].name
        });
        showToast(`✓ Токен валиден! Магазин: ${shopsResult.shops[0].name} (ID: ${shopsResult.shops[0].id})`);
      } else {
        showToast('✓ Токен валиден!');
      }

      setUzumLoading(false);
    } catch (error: any) {
      setUzumError(error.message || 'Ошибка проверки токена');
      setUzumLoading(false);
    }
  };

  // Save encrypted token to database
  const handleSaveToken = async () => {
    if (!uzumToken.trim()) {
      setUzumError('Введите токен');
      return;
    }

    if (!uzumPin.trim()) {
      setUzumError('Введите PIN');
      return;
    }

    const pinValidation = validatePin(uzumPin);
    if (!pinValidation.valid) {
      setUzumError(pinValidation.error || 'Неверный PIN');
      return;
    }

    if (!isCryptoAvailable()) {
      setUzumError('WebCrypto API недоступен');
      return;
    }

    const userId = getTelegramUserId();
    if (!userId && REQUIRE_TELEGRAM_ID) {
      setUzumError('Telegram user ID не найден');
      return;
    }

    setUzumLoading(true);
    setUzumError('');

    try {
      // Используем userId если есть, иначе используем фиксированный ID
      const actualUserId = userId || 'default_user';
      
      // Encrypt token
      const encrypted = await encryptToken(uzumToken, uzumPin);

      // Prepare metadata
      const metadata = {
        shops: uzumShops,
        sellerInfo: uzumSellerInfo,
        lastVerified: new Date().toISOString()
      };

      // Get Telegram user ID if available
      const tgUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || null;

      // Save to database
      const { data, error } = await supabase
        .from('integrations')
        .upsert({
          user_id: actualUserId,
          provider: 'uzum',
          token_cipher: encrypted.cipher,
          token_iv: encrypted.iv,
          token_salt: encrypted.salt,
          kdf_iterations: 200000,
          telegram_user_id: tgUserId,
          metadata
        }, {
          onConflict: 'user_id,provider'
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setUzumIntegrationId(data.id);
      setUzumConnected(true);
      setUzumDecryptedToken(uzumToken); // Сохраняем для использования в API
      
      // Сохраняем PIN в session storage для автоматической расшифровки при перезагрузке
      sessionStorage.setItem('uzum_pin_temp', uzumPin);
      console.log('[Uzum] ✓ PIN saved to session storage');
      
      // Clear sensitive data from input state
      setUzumToken('');
      setUzumPin('');

      const shopInfo = uzumShops.length > 0 ? `Магазин: ${uzumShops[0].name} (ID: ${uzumShops[0].id})` : '';
      showToast(`✓ Токен сохранён! ${shopInfo}`);
      
      // Отправляем событие для обновления статуса в Profile
      window.dispatchEvent(new CustomEvent('uzum-integration-updated'));
      console.log('[Uzum] ✓ Integration updated event dispatched');
      
      setUzumLoading(false);
    } catch (error: any) {
      setUzumError(error.message || 'Ошибка сохранения');
      setUzumLoading(false);
    }
  };

  // Disconnect integration
  const handleDisconnect = async () => {
    if (!window.confirm('Удалить интеграцию с Uzum?')) {
      return;
    }

    const userId = getTelegramUserId();
    if (!userId && REQUIRE_TELEGRAM_ID) {
      setUzumError('Telegram user ID не найден');
      return;
    }

    setUzumLoading(true);

    try {
      // Используем userId если есть, иначе используем фиксированный ID
      const actualUserId = userId || 'default_user';
      
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('user_id', actualUserId)
        .eq('provider', 'uzum');

      if (error) {
        throw new Error(error.message);
      }

      // Clear state
      setUzumConnected(false);
      setUzumIntegrationId(null);
      setUzumShops([]);
      setUzumSellerInfo(null);
      setUzumToken('');
      setUzumPin('');
      setUzumError('');
      setUzumDecryptedToken('');
      
      // Очистка кеша при выходе из интеграции
      console.log('🗑️ Clearing UZUM cache on disconnect');
      UzumCache.clearCache();

      showToast('✓ Интеграция отключена');
      setUzumLoading(false);
    } catch (error: any) {
      setUzumError(error.message || 'Ошибка удаления');
      setUzumLoading(false);
    }
  };

  // Load integration on mount
  useEffect(() => {
    if (route.name === 'uzum') {
      loadUzumIntegration();
    }
  }, [route.name]);

  // Get Telegram user info
  useEffect(() => {
    // Режим разработки для локального тестирования
    const isDevelopment = import.meta.env.DEV && window.location.hostname === 'localhost';
    
    if (isDevelopment) {
      console.log("[DEV MODE] Using mock Telegram data");
      const mockUser = {
        id: 123456789,
        first_name: "Test",
        last_name: "User",
      };
      
      // Создаем фейковый Telegram WebApp объект
      if (!(window as any).Telegram) {
        (window as any).Telegram = {
          WebApp: {
            initDataUnsafe: {
              user: mockUser
            },
            onEvent: () => {},
            offEvent: () => {},
            ready: () => {},
            expand: () => {},
          }
        };
      }
      
      const fullName = "Test User";
      setUserName(fullName);
      localStorage.setItem("user_name", fullName);
      
      // Пропускаем дальнейшую инициализацию для dev режима
      return;
    }
    
    const extractUserData = () => {
      const tg = (window as any).Telegram?.WebApp;
      if (!tg) {
        console.log("[TG] WebApp not available");
        return;
      }
      
      try {
        // Логирование полного initDataUnsafe
        console.log("[TG] initDataUnsafe:", tg.initDataUnsafe);
        
        const initData = tg.initDataUnsafe;
        const user = initData?.user;
        
        console.log("[TG] user object:", user);
        
        if (user) {
          const firstName = user.first_name || "";
          const lastName = user.last_name || "";
          const fullName = `${firstName} ${lastName}`.trim();
          
          console.log("[TG] Setting user:", { firstName, lastName, fullName });
          
          // Загружаем профиль из базы по Telegram ID
          if (user.id) {
            loadUserProfile(user.id.toString());
            saveUserToDb(user.id, firstName, lastName);
          }
          
          // Если профиля нет в базе, используем имя из Telegram
          if (fullName && !userName) {
            setUserName(fullName);
            localStorage.setItem("user_name", fullName);
          }
        } else {
          console.log("[TG] ⚠ No user data");
        }
      } catch (err) {
        console.error("[TG] Error:", err);
      }
    };

    // Try multiple times with delays
    extractUserData();
    setTimeout(() => extractUserData(), 100);
    setTimeout(() => extractUserData(), 300);
    setTimeout(() => extractUserData(), 800);
    
    // Also listen to viewportChanged
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      const handler = () => {
        console.log("[TG] viewportChanged event");
        extractUserData();
      };
      tg.onEvent("viewportChanged", handler);
      return () => {
        tg.offEvent("viewportChanged", handler);
      };
    }
  }, []);

  // toast helper
  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout((window as any).__toastTimer);
    (window as any).__toastTimer = window.setTimeout(() => setToast(""), 1200);
  };

  // Load public content
  const loadPublic = async () => {
    console.log("[DATA] Loading public content...");
    const s = await supabase.from("sections").select("*").order("sort", { ascending: true });
    const c = await supabase.from("cards").select("*").order("sort", { ascending: true });
    const n = await supabase
      .from("news")
      .select("*")
      .order("pinned", { ascending: false })
      .order("published_at", { ascending: false });
    const f = await supabase.from("faq").select("*").order("sort", { ascending: true });

    console.log("[DATA] Sections:", s.error ? `✗ ${s.error.message}` : `✓ ${s.data?.length || 0}`);
    console.log("[DATA] Cards:", c.error ? `✗ ${c.error.message}` : `✓ ${c.data?.length || 0}`);
    console.log("[DATA] News:", n.error ? `✗ ${n.error.message}` : `✓ ${n.data?.length || 0}`);
    console.log("[DATA] FAQ:", f.error ? `✗ ${f.error.message}` : `✓ ${f.data?.length || 0}`);

    if (!s.error) setSections((s.data ?? []) as SectionRow[]);
    if (!c.error) setCards((c.data ?? []) as CardRow[]);
    if (!n.error) setNews((n.data ?? []) as NewsRow[]);
    if (!f.error) setFaq((f.data ?? []) as FaqRow[]);
  };

  useEffect(() => {
    loadPublic();
  }, []);

  // protect admin route
  useEffect(() => {
    if (route.name === "admin" && !adminOk) {
      setRoute({ name: "home" });
    }
  }, [route.name, adminOk]);

  const filteredSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter((s) => {
      const sectionTitle = (lang === "ru" ? s.title_ru : s.title_uz).toLowerCase();
      const hasMatchingCard = cards.some(
        (c) => c.section_id === s.id && (lang === "ru" ? c.title_ru : c.title_uz).toLowerCase().includes(q)
      );
      return sectionTitle.includes(q) || hasMatchingCard;
    });
  }, [sections, cards, search, lang]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;

    const sec = sections.filter((s) => {
      const title = (lang === "ru" ? s.title_ru : s.title_uz).toLowerCase();
      if (title.includes(q)) return true;
      // cards in section
      return cards.some((c) => c.section_id === s.id && ((lang === "ru" ? c.title_ru : c.title_uz) + " " + (lang === "ru" ? c.body_ru : c.body_uz)).toLowerCase().includes(q));
    });

    const cds = cards.filter((c) => {
      const text = ((lang === "ru" ? c.title_ru : c.title_uz) + " " + (lang === "ru" ? c.body_ru : c.body_uz)).toLowerCase();
      return text.includes(q);
    });

    const nws = news.filter((n) => {
      const text = ((lang === "ru" ? n.title_ru : n.title_uz) + " " + (lang === "ru" ? n.body_ru : n.body_uz)).toLowerCase();
      return text.includes(q);
    });

    return { sections: sec, cards: cds, news: nws };
  }, [search, sections, cards, news, lang]);

  const renderSearchResults = () => {
    if (!searchResults) return null;
    if (searchResults.sections.length === 0 && searchResults.cards.length === 0 && searchResults.news.length === 0) return null;
    
    return (
      <div className="searchDropdown">
        {searchResults.sections.length > 0 && (
          <div className="searchSection">
            <div className="searchSectionTitle">{t.sections}</div>
            {searchResults.sections.map((s) => (
              <button 
                key={s.id} 
                className="searchItem" 
                onClick={() => {
                  setRoute({ name: "section", sectionId: s.id });
                  setSearch("");
                }}
              >
                <div className="searchItemIcon">{s.icon}</div>
                <div className="searchItemContent">
                  <div className="searchItemTitle">{getSectionTitle(s)}</div>
                  <div className="searchItemSub">{cards.filter(c=>c.section_id===s.id).slice(0,2).map(c=>getCardTitle(c)).join(' • ') || '—'}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {searchResults.cards.length > 0 && (
          <div className="searchSection">
            <div className="searchSectionTitle">{t.cards}</div>
            {searchResults.cards.map((c) => (
              <div key={c.id} className="searchItem searchItemCard">
                <div className="searchItemContent">
                  <div className="searchItemTitle">{getCardTitle(c)}</div>
                  <div className="searchItemSub">{getCardBody(c).split('\n').slice(0,2).join(' ').substring(0, 100)}...</div>
                </div>
                <div className="searchItemActions">
                  <button className="searchActionBtn searchActionBtnPrimary" onClick={() => {
                    setRoute({ name: 'card', cardId: c.id });
                    setSearch("");
                  }}>
                    {t.open}
                  </button>
                  <button className="searchActionBtn searchActionBtnGhost" onClick={() => copyText(getCardBody(c))}>
                    {t.copyAll}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {searchResults.news.length > 0 && (
          <div className="searchSection">
            <div className="searchSectionTitle">{t.news}</div>
            {searchResults.news.map((n) => (
              <button 
                key={n.id} 
                className="searchItem"
                onClick={() => {
                  setRoute({ name: 'news_card', newsId: n.id });
                  setSearch("");
                }}
              >
                <div className="searchItemIcon">📰</div>
                <div className="searchItemContent">
                  <div className="searchItemTitle">{lang === 'ru' ? n.title_ru : n.title_uz}</div>
                  <div className="searchItemSub">{(lang === 'ru' ? n.body_ru : n.body_uz).substring(0, 80)}...</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const getSectionTitle = (s: SectionRow) => (lang === "ru" ? s.title_ru : s.title_uz);
  const getCardTitle = (c: CardRow) => (lang === "ru" ? c.title_ru : c.title_uz);
  const getCardBody = (c: CardRow) => (lang === "ru" ? c.body_ru : c.body_uz);

  const canContinue = code.trim().length > 0 && rules;

  // Простое SHA-256 хеширование
  const hashCode = async (code: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const submitCode = async () => {
    if (!canContinue) return;

    const entered = code.trim().toUpperCase();
    console.log("[CODE] Checking code:", entered);
    
    // Режим разработки - автоматический вход
    const isDevelopment = import.meta.env.DEV && window.location.hostname === 'localhost';
    if (isDevelopment && !entered) {
      console.log("[DEV MODE] Auto-login as viewer");
      setError("");
      localStorage.setItem("access_ok", "1");
      localStorage.setItem("user_role", "viewer");
      setUserRole("viewer");
      setRoute({ name: "home" });
      return;
    }

    // ADMIN: open admin immediately
    if (entered === ADMIN_CODE) {
      console.log("[CODE] Admin code matched");
      setError("");
      localStorage.setItem("access_ok", "1");
      localStorage.setItem("admin_ok", "1");
      localStorage.setItem("user_role", "owner");
      setUserRole("owner");
      setAdminOk(true);
      setRoute({ name: "admin" });
      return;
    }

    // Проверка кода доступа через Supabase
    try {
      const codeHash = await hashCode(entered);
      
      const { data, error } = await supabase
        .from('access_codes')
        .select('id,role,is_active,expires_at,max_uses,uses_count')
        .eq('code_hash', codeHash)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.log("[CODE] Invalid code");
        setError(t.invalidCode);
        return;
      }

      // Проверка срока действия
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError("Код истёк");
        return;
      }

      // Проверка лимита использований
      if (data.max_uses !== null && data.uses_count >= data.max_uses) {
        setError("Лимит использований исчерпан");
        return;
      }

      // Увеличиваем счётчик
      await supabase
        .from('access_codes')
        .update({ uses_count: data.uses_count + 1 })
        .eq('id', data.id);

      const userRole = data.role || "viewer";
      console.log("[CODE] Code valid, role:", userRole);
      
      setError("");
      localStorage.setItem("access_ok", "1");
      localStorage.setItem("user_role", userRole);
      setUserRole(userRole);
      
      if (userRole === "admin" || userRole === "owner") {
        localStorage.setItem("admin_ok", "1");
        setAdminOk(true);
        setRoute({ name: "admin" });
      } else if (userRole === "editor") {
        localStorage.setItem("admin_ok", "1");
        setAdminOk(true);
        setRoute({ name: "admin" });
      } else {
        localStorage.removeItem("admin_ok");
        setAdminOk(false);
        setRoute({ name: "home" });
      }
    } catch (err) {
      console.error("[CODE] Exception:", err);
      setError(t.invalidCode);
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(t.copied);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast(t.copied);
    }
  };

  const goHome = () => setRoute({ name: "home" });

  const goBack = () => {
    if (route.name === "card") {
      const secId = cards.find((x) => x.id === route.cardId)?.section_id || "";
      return setRoute({ name: "section", sectionId: secId });
    }
    if (route.name === "section" || route.name === "news" || route.name === "news_item" || route.name === "news_card" || route.name === "faq" || route.name === "commissions" || route.name === "admin" || route.name === "sections_all" || route.name === "uzum") {
      return setRoute({ name: "home" });
    }
  };

  const signOut = () => {
    localStorage.setItem("access_ok", "0");
    localStorage.setItem("admin_ok", "0");
    setAdminOk(false);
    // Сохраняем историю комиссий перед выходом
    if (userName && commissionHistory.length > 0) {
      localStorage.setItem(`commission_history_${userName}`, JSON.stringify(commissionHistory));
    }
    setRoute({ name: "welcome" });
  };

  // ---------- Admin UI helpers ----------
  const [adminTab, setAdminTab] = useState<"" | "sections" | "cards" | "news" | "faq" | "codes">("sections");

  const [secForm, setSecForm] = useState({ key: "", title_ru: "", title_uz: "", icon: "📄", sort: 100 });
  const [cardForm, setCardForm] = useState({
    section_id: "",
    title_ru: "",
    title_uz: "",
    body_ru: "",
    body_uz: "",
    sort: 100,
    file_url: "",
    map_url: "",
  });
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState({
    title_ru: "",
    title_uz: "",
    body_ru: "",
    body_uz: "",
    published_at: new Date().toISOString().slice(0, 10),
    pinned: false,
    image_url: "",
  });
  const [faqForm, setFaqForm] = useState({
    question_ru: "",
    question_uz: "",
    answer_ru: "",
    answer_uz: "",
    sort: 0,
  });
  const [codeForm, setCodeForm] = useState({ code: "", role: "viewer", max_uses: null as number | null, expires_at: "", note: "" });
  const [accessCodes, setAccessCodes] = useState<any[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const adminSignOut = async () => {
    localStorage.removeItem("admin_ok");
    setAdminOk(false);
    showToast(t.ok);
    setRoute({ name: "home" });
  };

  const adminSaveSection = async () => {
    const resp = await supabase.from("sections").insert(secForm as any);
    if (resp.error) {
      showToast(t.error);
      return;
    }
    showToast(t.ok);
    setSecForm({ key: "", title_ru: "", title_uz: "", icon: "📄", sort: 100 });
    await loadPublic();
  };

  const adminDeleteSection = async (id: string) => {
    const resp = await supabase.from("sections").delete().eq("id", id);
    if (resp.error) {
      showToast(t.error);
      return;
    }
    showToast(t.ok);
    await loadPublic();
  };

  const adminSaveCard = async () => {
    if (editingCardId) {
      const resp = await supabase.from("cards").update({ ...cardForm, updated_at: new Date().toISOString() } as any).eq("id", editingCardId);
      if (resp.error) {
        showToast(t.error);
        return;
      }
      showToast(t.ok);
      setEditingCardId(null);
    } else {
      const resp = await supabase.from("cards").insert({ ...cardForm, updated_at: new Date().toISOString() } as any);
      if (resp.error) {
        showToast(t.error);
        return;
      }
      showToast(t.ok);
    }
    setCardForm({ section_id: "", title_ru: "", title_uz: "", body_ru: "", body_uz: "", sort: 100, file_url: "", map_url: "" });
    await loadPublic();
  };

  const adminDeleteCard = async (id: string) => {
    const resp = await supabase.from("cards").delete().eq("id", id);
    if (resp.error) {
      showToast(t.error);
      return;
    }
    showToast(t.ok);
    await loadPublic();
  };

  const sendTelegramNotification = async (title: string, body: string, imageUrl?: string) => {
    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    
    console.log("[TELEGRAM] Проверка переменных:");
    console.log("[TELEGRAM] botToken:", botToken ? "✓ установлен" : "✗ НЕ установлен");
    
    if (!botToken) {
      console.error("[TELEGRAM] ✗ Bot token не установлен!");
      return;
    }

    try {
      // Получаем всех пользователей из БД
      console.log("[TELEGRAM] Получаем список пользователей...");
      const { data: users, error } = await supabase.from("telegram_subscribers").select("id");
      
      if (error) {
        console.error("[TELEGRAM] ✗ Ошибка получения пользователей:", error);
        return;
      }
      
      if (!users || users.length === 0) {
        console.log("[TELEGRAM] ⚠️ Нет подписанных пользователей");
        return;
      }
      
      console.log("[TELEGRAM] ✓ Найдено пользователей:", users.length);
      
      const message = `📰 *Новая новость*\n\n*${title}*\n\n${body}`;
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      
      let successCount = 0;
      let failCount = 0;
      
      // Отправляем каждому пользователю
      for (const user of users) {
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: user.id,
              text: message,
              parse_mode: "Markdown",
            }),
          });

          const data = await response.json();
          
          if (response.ok && data.ok) {
            successCount++;
          } else {
            failCount++;
            console.log("[TELEGRAM] ⚠️ Не отправлено пользователю", user.id, ":", data.description);
          }
        } catch (err) {
          failCount++;
          console.log("[TELEGRAM] ⚠️ Ошибка отправки пользователю", user.id);
        }
      }
      
      console.log(`[TELEGRAM] ✓ Отправлено ${successCount}/${users.length} пользователям`);
      
      if (imageUrl) {
        console.log("[TELEGRAM] Отправка фото...");
        const photoUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;
        let photoSuccessCount = 0;
        
        for (const user of users) {
          try {
            const photoResponse = await fetch(photoUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: user.id,
                photo: imageUrl,
                caption: title,
              }),
            });
            
            const photoData = await photoResponse.json();
            if (photoResponse.ok && photoData.ok) {
              photoSuccessCount++;
            }
          } catch (err) {
            // ignore
          }
        }
        
        console.log(`[TELEGRAM] ✓ Фото отправлено ${photoSuccessCount}/${users.length} пользователям`);
      }
      
      console.log("[TELEGRAM] ✓✓✓ Уведомление отправлено всем пользователям успешно!");
    } catch (err) {
      console.error("[TELEGRAM] ✗ Ошибка отправки:", err);
    }
  };

  const adminSaveNews = async () => {
    const resp = await supabase.from("news").insert(newsForm as any);
    if (resp.error) {
      showToast(t.error);
      return;
    }
    showToast(t.ok);
    
    // Отправляем уведомление в Telegram
    await sendTelegramNotification(
      newsForm.title_ru || newsForm.title_uz,
      newsForm.body_ru || newsForm.body_uz,
      newsForm.image_url
    );
    
    setNewsForm({
      title_ru: "",
      title_uz: "",
      body_ru: "",
      body_uz: "",
      published_at: new Date().toISOString().slice(0, 10),
      pinned: false,
      image_url: "",
    });
    await loadPublic();
  };

  const adminDeleteNews = async (id: string) => {
    const resp = await supabase.from("news").delete().eq("id", id);
    if (resp.error) {
      showToast(t.error);
      return;
    }
    showToast(t.ok);
    await loadPublic();
  };

  const adminSaveFaq = async () => {
    if (!faqForm.question_ru.trim() || !faqForm.question_uz.trim() || !faqForm.answer_ru.trim() || !faqForm.answer_uz.trim()) {
      showToast("Заполните все поля");
      return;
    }
    const resp = await supabase.from("faq").insert(faqForm as any);
    if (resp.error) {
      showToast(t.error);
      return;
    }
    showToast(t.ok);
    setFaqForm({
      question_ru: "",
      question_uz: "",
      answer_ru: "",
      answer_uz: "",
      sort: 0,
    });
    await loadPublic();
  };

  const adminDeleteFaq = async (id: string) => {
    const resp = await supabase.from("faq").delete().eq("id", id);
    if (resp.error) {
      showToast(t.error);
      return;
    }
    showToast(t.ok);
    await loadPublic();
  };

  const loadAccessCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('access_codes')
        .select('id,code_hash,role,is_active,expires_at,max_uses,uses_count,note,display_code,created_at')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Failed to load access codes:", error);
        return;
      }
      
      setAccessCodes(data ?? []);
    } catch (err) {
      console.error("Error loading access codes:", err);
    }
  };

  useEffect(() => {
    if (adminTab === "codes") loadAccessCodes();
  }, [adminTab]);

  const deleteAccessCode = async (codeId: string) => {
    try {
      const { error } = await supabase
        .from('access_codes')
        .update({ is_active: false })
        .eq('id', codeId);
      
      if (error) {
        showToast(t.error);
        return;
      }
      
      showToast(t.ok);
      await loadAccessCodes();
    } catch (err) {
      console.error("Error deleting access code:", err);
      showToast(t.error);
    }
  };

  const adminSaveCode = async () => {
    try {
      // Генерация уникального кода с повторными попытками
      let plainCode = codeForm.code.trim();
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        if (!plainCode || attempts > 0) {
          plainCode = Math.floor(100000 + Math.random() * 900000).toString();
        }

        // Проверка формата
        if (!/^\d{6}$/.test(plainCode)) {
          showToast("Код должен быть 6 цифр");
          return;
        }

        // Хешируем код
        const codeHash = await hashCode(plainCode);

        // Проверяем, существует ли уже такой хеш
        const { data: existing } = await supabase
          .from('access_codes')
          .select('id')
          .eq('code_hash', codeHash)
          .maybeSingle();

        if (!existing) {
          // Уникальный код найден, создаем запись
          const displayCode = '****' + plainCode.slice(-2);

          const payload = {
            code_hash: codeHash,
            role: codeForm.role || 'viewer',
            max_uses: codeForm.max_uses || null,
            expires_at: codeForm.expires_at ? new Date(codeForm.expires_at).toISOString() : null,
            note: codeForm.note || null,
            display_code: displayCode,
          };

          const { error } = await supabase
            .from('access_codes')
            .insert(payload);

          if (error) {
            showToast(t.error + ": " + error.message);
            return;
          }

          setGeneratedCode(plainCode);
          showToast("Код создан: " + plainCode);
          await loadAccessCodes();
          setCodeForm({ code: "", role: "viewer", max_uses: null, expires_at: "", note: "" });
          return;
        }

        // Код уже существует, пробуем еще раз
        attempts++;
        plainCode = ""; // Сбросить для следующей попытки
      }

      showToast("Не удалось сгенерировать уникальный код");
    } catch (err) {
      console.error("Error creating access code:", err);
      showToast(t.error);
    }
  };

  const fmtDM = (iso: string) => {
    // ISO yyyy-mm-dd -> dd.mm
    const parts = iso.split("-");
    if (parts.length !== 3) return iso;
    return `${parts[2]}.${parts[1]}`;
  };

  // ---------- UI ----------
  const sectionListRef = useRef<HTMLDivElement | null>(null);
  const scrollThrottleRef = useRef<number | null>(null);

  const handleSectionScroll = () => {
    const el = sectionListRef.current;
    if (!el) return;

    const children = Array.from(el.children) as HTMLElement[];
    const centerX = el.scrollLeft + el.clientWidth / 2;

    children.forEach((ch) => {
      const rect = ch.getBoundingClientRect();
      const chCenter = ch.offsetLeft + rect.width / 2;
      const dist = Math.abs(chCenter - centerX);
      ch.classList.remove("is-center", "is-near", "is-far");
      if (dist < rect.width * 0.45) {
        ch.classList.add("is-center");
      } else if (dist < rect.width * 1.2) {
        ch.classList.add("is-near");
      } else {
        ch.classList.add("is-far");
      }
    });
  };

  const handleSectionScrollThrottled = () => {
    if (scrollThrottleRef.current) return;
    scrollThrottleRef.current = window.setTimeout(() => {
      handleSectionScroll();
      scrollThrottleRef.current = null;
    }, 50);
  };

  useEffect(() => {
    // initialize and update on resize
    handleSectionScroll();
    const onResize = () => handleSectionScroll();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [sections, filteredSections]);

  // auto-snap to nearest item after scroll stops
  const snapTimerRef = useRef<number | null>(null);

  const snapToClosest = () => {
    const el = sectionListRef.current;
    if (!el) return;
    const children = Array.from(el.children) as HTMLElement[];
    if (children.length === 0) return;

    const centerX = el.scrollLeft + el.clientWidth / 2;
    let closest: HTMLElement | null = null;
    let minDist = Infinity;
    children.forEach((ch) => {
      const rect = ch.getBoundingClientRect();
      const chCenter = ch.offsetLeft + rect.width / 2;
      const dist = Math.abs(chCenter - centerX);
      if (dist < minDist) {
        minDist = dist;
        closest = ch;
      }
    });

    if (!closest) return;

    const c = closest as HTMLElement;
    const target = c.offsetLeft - (el.clientWidth - c.clientWidth) / 2;
    const start = el.scrollLeft;
    const delta = target - start;
    const dur = 360;
    let startTs: number | null = null;

    const step = (ts: number) => {
      if (!startTs) startTs = ts;
      const t = Math.min(1, (ts - startTs) / dur);
      const ease = 1 - Math.pow(1 - t, 3);
      el.scrollLeft = start + delta * ease;
      if (t < 1) requestAnimationFrame(step);
      else handleSectionScroll();
    };

    requestAnimationFrame(step);
  };

  // attach tilt + magnetic interactions
  useEffect(() => {
    const el = sectionListRef.current;
    if (!el) return;

    const children = Array.from(el.children) as HTMLElement[];

    const onMouseMoveCard = (ch: HTMLElement) => (e: MouseEvent) => {
      const rect = ch.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      // base scale from classes
      let scale = 1;
      let ty = 0;
      if (ch.classList.contains("is-center")) {
        scale = 1.08; ty = -10;
      } else if (ch.classList.contains("is-near")) {
        scale = 0.98; ty = -6;
      } else {
        scale = 0.94; ty = 0;
      }
      const rx = -dy * 6;
      const ry = dx * 6;
      ch.style.transform = `translateY(${ty}px) scale(${scale}) rotateX(${rx}deg) rotateY(${ry}deg)`;
      ch.style.transition = "transform 80ms linear";
    };

    const onMouseLeaveCard = (ch: HTMLElement) => () => {
      ch.style.transition = "transform .28s cubic-bezier(.22,.1,.36,.9)";
      // restore class-based transform by clearing inline transform (then handleSectionScroll will reapply via classes)
      ch.style.transform = "";
    };

    children.forEach((ch) => {
      const mm = onMouseMoveCard(ch);
      const ml = onMouseLeaveCard(ch);
      ch.addEventListener("mousemove", mm);
      ch.addEventListener("mouseleave", ml);
      // store handlers on element for cleanup
      (ch as any).__mm = mm;
      (ch as any).__ml = ml;
    });

    // magnetic CTA
    const btn = document.querySelector(".allSectionsBtn") as HTMLElement | null;
    let onBtnMove: ((e: MouseEvent) => void) | null = null;
    let onBtnLeave: ((e: MouseEvent) => void) | null = null;
    if (btn) {
      onBtnMove = (e: MouseEvent) => {
        const r = btn.getBoundingClientRect();
        const mx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const my = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        btn.style.transform = `translate(${mx * 8}px, ${my * 6}px) scale(1.02)`;
      };
      onBtnLeave = () => { btn.style.transform = ""; };
      btn.addEventListener("mousemove", onBtnMove);
      btn.addEventListener("mouseleave", onBtnLeave);
    }

    return () => {
      children.forEach((ch) => {
        ch.removeEventListener("mousemove", (ch as any).__mm);
        ch.removeEventListener("mouseleave", (ch as any).__ml);
        delete (ch as any).__mm;
        delete (ch as any).__ml;
      });
      if (btn && onBtnMove && onBtnLeave) {
        btn.removeEventListener("mousemove", onBtnMove);
        btn.removeEventListener("mouseleave", onBtnLeave);
      }
    };
  }, [sections, filteredSections]);

  // debounce snap on scroll
  useEffect(() => {
    const el = sectionListRef.current;
    if (!el) return;
    const onScroll = () => {
      if (snapTimerRef.current) window.clearTimeout(snapTimerRef.current);
      snapTimerRef.current = window.setTimeout(() => {
        snapToClosest();
      }, 140) as unknown as number;
    };
    el.addEventListener("scroll", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (snapTimerRef.current) window.clearTimeout(snapTimerRef.current);
    };
  }, [sections, filteredSections]);
  return (
    <div className="app">
      <div className="phone">
        <div className="floating-grapes">
          <div className="grape grape-1">🍇</div>
          <div className="grape grape-2">🍇</div>
          <div className="grape grape-3">🍇</div>
          <div className="grape grape-4">🍇</div>
          <div className="grape grape-5">🍇</div>
          <div className="grape grape-6">🍇</div>
          <div className="grape grape-7">🍇</div>
          <div className="grape grape-8">🍇</div>
        </div>

        {route.name === "welcome" && (
          <div className="page" style={{ 
            display: "flex", 
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            minHeight: "100vh"
          }}>
            <div style={{ 
              width: "100%", 
              maxWidth: "440px",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}>
              {/* Логотип */}
              <div style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "4px"
              }}>
                <div className="logoBox" style={{
                  width: "90px",
                  height: "90px",
                  background: "linear-gradient(145deg, #ffffff, #f8f7ff)",
                  borderRadius: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 24px rgba(111,0,255,.2), 0 2px 6px rgba(0,0,0,.05)",
                  border: "2px solid rgba(255,255,255,.9)",
                  padding: "12px"
                }}>
                  <img 
                    className="logoImg" 
                    src="/uzum-logo.png" 
                    alt="Uzum" 
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain"
                    }}
                  />
                </div>
              </div>

              {/* Заголовок */}
              <div style={{
                textAlign: "center",
                marginBottom: "4px"
              }}>
                <h1 style={{
                  fontSize: "28px",
                  fontWeight: 900,
                  margin: 0,
                  background: "linear-gradient(135deg, #6F00FF, #9d4edd)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  lineHeight: 1.2,
                  letterSpacing: "-0.5px"
                }}>
                  {t.welcome}
                </h1>
              </div>

              {/* Основная карточка */}
              <div style={{
                background: "linear-gradient(145deg, #ffffff, #fdfcff)",
                borderRadius: "20px",
                padding: "20px 18px",
                boxShadow: "0 8px 32px rgba(111,0,255,.1), 0 3px 8px rgba(0,0,0,.05)",
                border: "2px solid rgba(111,0,255,.1)"
              }}>
                {/* Поле ввода кода */}
                <div style={{ marginBottom: "14px" }}>
                  <label style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "rgba(20,18,26,.7)",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    {t.enterCode}
                  </label>
                  <input
                    className="input"
                    placeholder="4565"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (error) setError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitCode();
                    }}
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      letterSpacing: "1px",
                      textAlign: "center",
                      height: "50px"
                    }}
                  />
                </div>

                {/* Правила - аккордеон */}
                <div style={{ marginBottom: "14px" }}>
                  <button 
                    onClick={() => setRulesExpanded(!rulesExpanded)}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      border: "2px solid rgba(111,0,255,.2)",
                      borderRadius: "12px",
                      background: rulesExpanded ? "rgba(111,0,255,.05)" : "transparent",
                      color: "rgba(20,18,26,.85)",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all .25s ease"
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      📋 Правила пользования
                    </span>
                    <span style={{ 
                      fontSize: "11px",
                      transition: "transform .3s ease", 
                      transform: rulesExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      display: "inline-block"
                    }}>
                      ▼
                    </span>
                  </button>
                  
                  {rulesExpanded && (
                    <div style={{
                      marginTop: "10px",
                      padding: "12px",
                      background: "rgba(111,0,255,.04)",
                      borderRadius: "10px",
                      border: "1px solid rgba(111,0,255,.1)"
                    }}>
                      <ul style={{ 
                        margin: 0, 
                        paddingLeft: "18px", 
                        fontSize: "12px", 
                        color: "rgba(20,18,26,.75)", 
                        lineHeight: 1.6 
                      }}>
                        <li>Используйте помощника в рабочих целях</li>
                        <li>Не распространяйте коды доступа</li>
                        <li>Чего-то не хватает? Поделитесь!</li>
                        <li>Пользуйтесь и наслаждайтесь! 🎉</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Чекбокс */}
                <label 
                  htmlFor="rules-checkbox" 
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "11px",
                    background: "rgba(111,0,255,.03)",
                    borderRadius: "10px",
                    cursor: "pointer",
                    border: "2px solid " + (rules ? "rgba(111,0,255,.25)" : "rgba(111,0,255,.1)"),
                    transition: "all .2s ease",
                    marginBottom: "14px"
                  }}
                >
                  <input
                    id="rules-checkbox"
                    type="checkbox"
                    checked={rules}
                    onChange={(e) => {
                      setRules(e.target.checked);
                      if (error) setError("");
                    }}
                    style={{ cursor: "pointer", flexShrink: 0 }}
                  />
                  <span style={{ 
                    fontWeight: 700, 
                    fontSize: "13px",
                    color: "rgba(20,18,26,.85)",
                    flex: 1
                  }}>
                    {t.acceptRules}
                  </span>
                </label>

                {/* Ошибка */}
                {error && (
                  <div style={{
                    padding: "10px 14px",
                    background: "rgba(176,0,32,.08)",
                    border: "2px solid rgba(176,0,32,.2)",
                    borderRadius: "10px",
                    color: "#b00020",
                    fontWeight: 700,
                    fontSize: "13px",
                    marginBottom: "12px",
                    textAlign: "center"
                  }}>
                    {error}
                  </div>
                )}

                {/* Кнопка продолжить */}
                <button
                  className="btnPrimary"
                  onClick={submitCode}
                  disabled={!canContinue}
                  style={{
                    width: "100%",
                    height: "50px",
                    fontSize: "15px",
                    fontWeight: 800,
                    opacity: canContinue ? 1 : 0.5,
                    cursor: canContinue ? "pointer" : "not-allowed",
                    transition: "all .2s ease",
                    marginBottom: "14px"
                  }}
                >
                  {t.continue}
                </button>

                {/* Информация о получении кода */}
                <div style={{
                  padding: "12px",
                  background: "linear-gradient(135deg, rgba(111,0,255,.06), rgba(111,0,255,.08))",
                  borderRadius: "12px",
                  textAlign: "center",
                  border: "1px solid rgba(111,0,255,.15)"
                }}>
                  <div style={{ 
                    fontSize: "11px", 
                    color: "rgba(20,18,26,.65)",
                    marginBottom: "4px"
                  }}>
                    Для получения кода доступа обращаться к
                  </div>
                  <a 
                    href="https://t.me/CloudGrove"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "#6F00FF",
                      textDecoration: "none",
                      cursor: "pointer",
                      display: "inline-block",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = "underline";
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = "none";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    @CloudGrove
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {route.name === "home" && (
          <div className="page" style={{ overflow: "hidden" }}>
            {/* Боковое меню */}
            {menuOpen && (
              <>
                <div 
                  className="menuOverlay" 
                  onClick={() => setMenuOpen(false)}
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,.4)",
                    zIndex: 999,
                    animation: "fadeIn 0.3s ease"
                  }}
                />
                <div 
                  className="sideMenu"
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: "280px",
                    maxWidth: "80%",
                    background: "linear-gradient(145deg, #FFF8E8, #FFECD2)",
                    boxShadow: "4px 0 24px rgba(0,0,0,.15)",
                    zIndex: 1000,
                    display: "flex",
                    flexDirection: "column",
                    animation: "slideInLeft 0.3s ease",
                    maxHeight: "100vh",
                    overflow: "hidden"
                  }}
                >
                  <div style={{ 
                    padding: "24px 20px", 
                    borderBottom: "2px solid rgba(111,0,255,.15)",
                    background: "linear-gradient(145deg, #FFF8E8, #FFECD2)"
                  }}>
                    <div style={{ fontSize: "20px", fontWeight: 900, color: "#6F00FF", marginBottom: "4px" }}>
                      Меню
                    </div>
                    <div style={{ fontSize: "13px", color: "rgba(0,0,0,.6)" }}>
                      {userName || "Гость"}
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
                    {filteredSections.map((s) => (
                      <button
                        key={s.id}
                        className="menuBtn"
                        onClick={() => {
                          setRoute({ name: "section", sectionId: s.id });
                          setMenuOpen(false);
                        }}
                      >
                        <span style={{ fontSize: "24px" }}>{s.icon}</span>
                        <span>
                          {getSectionTitle(s)}
                        </span>
                      </button>
                    ))}
                    
                    <button
                      className="menuBtn accent"
                      onClick={() => {
                        setRoute({ name: "faq" });
                        setMenuOpen(false);
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>❓</span>
                      <span>{t.faq}</span>
                    </button>

                    <button
                      className="menuBtn accent"
                      onClick={() => {
                        setRoute({ name: "commissions" });
                        setMenuOpen(false);
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>💰</span>
                      <span>{lang === "ru" ? "Комиссии" : "Komissiyalar"}</span>
                    </button>

                    <button
                      className="menuBtn accent"
                      onClick={() => {
                        window.open("https://t.me/CloudGrove", "_blank");
                        setMenuOpen(false);
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>💬</span>
                      <span>{lang === "ru" ? "Помощь" : "Yordam"}</span>
                    </button>
                  </div>
                  
                  <div style={{ 
                    padding: "16px", 
                    borderTop: "2px solid rgba(111,0,255,.15)",
                    background: "linear-gradient(145deg, #FFF8E8, #FFECD2)"
                  }}>
                    <button
                      className="menuBtn danger"
                      onClick={() => {
                        signOut();
                        setMenuOpen(false);
                      }}
                    >
                      {t.signOut}
                    </button>
                  </div>
                </div>
              </>
            )}

            <TopBar
              t={t}
              lang={lang}
              setLang={setLang}
              showSearch={true}
              search={search}
              setSearch={setSearch}
              onBack={() => setMenuOpen(true)}
              onHome={() => {}}
              rightSlot={
                <button 
                  className="smallIconBtn" 
                  onClick={() => setMenuOpen(true)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: "3px",
                    padding: "8px"
                  }}
                >
                  <span style={{ display: "block", width: "20px", height: "2px", background: "#6F00FF", borderRadius: "1px" }}></span>
                  <span style={{ display: "block", width: "20px", height: "2px", background: "#6F00FF", borderRadius: "1px" }}></span>
                  <span style={{ display: "block", width: "20px", height: "2px", background: "#6F00FF", borderRadius: "1px" }}></span>
                </button>
              }
              searchDropdown={renderSearchResults()}
            />

            {/* Приветственный блок */}
            <div style={{ 
              padding: "20px 16px",
              background: "linear-gradient(135deg, #7000FF 0%, #9D4EFF 100%)",
              borderBottom: "2px solid rgba(157,78,255,.4)",
              position: "relative",
              overflow: "hidden"
            }}>
              {/* Декоративные элементы */}
              <div style={{
                position: "absolute",
                top: "-20px",
                right: "-20px",
                width: "100px",
                height: "100px",
                background: "rgba(255,255,255,.1)",
                borderRadius: "50%",
                filter: "blur(30px)"
              }} />
              <div style={{
                position: "absolute",
                bottom: "-30px",
                left: "-30px",
                width: "120px",
                height: "120px",
                background: "rgba(255,255,255,.08)",
                borderRadius: "50%",
                filter: "blur(40px)"
              }} />
              
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ 
                  fontSize: "13px", 
                  fontWeight: 600, 
                  color: "rgba(255,255,255,.7)", 
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "1px"
                }}>
                  {new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : "uz-UZ", { weekday: "long", day: "numeric", month: "long" })}
                </div>
                <div style={{ 
                  fontSize: "24px", 
                  fontWeight: 900, 
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span>{t.hello},</span>
                  <span style={{
                    background: "rgba(255,255,255,.2)",
                    padding: "4px 12px",
                    borderRadius: "8px",
                    fontSize: "20px"
                  }}>
                    {userName || "Гость"} 👋
                  </span>
                </div>
              </div>
            </div>

            {/* Карусель разделов */}
            <div style={{ padding: "12px 0" }}>
              <div style={{ 
                fontSize: "12px", 
                fontWeight: 800, 
                color: "rgba(0,0,0,.7)", 
                padding: "0 16px 6px",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                {t.sections}
              </div>
              <div className="sectionList" ref={sectionListRef} onWheel={(e: any) => {
                const el = sectionListRef.current as HTMLDivElement | null;
                if (!el) return;
                if (e.cancelable) {
                  e.preventDefault();
                }
                el.scrollLeft += e.deltaY;
                handleSectionScrollThrottled();
              }} onScroll={handleSectionScrollThrottled}>
                {filteredSections.map((s) => (
                  <button
                    key={s.id}
                    className="sectionRow"
                    onClick={() => setRoute({ name: "section", sectionId: s.id })}
                  >
                    <div className="sectionIconBox">
                      <div className="sectionIcon">{s.icon}</div>
                    </div>
                    <div className="sectionText">
                      <div className="sectionTitle">{getSectionTitle(s)}</div>
                      <div className="sectionSub">
                        {cards
                          .filter((c) => c.section_id === s.id)
                          .slice(0, 1)
                          .map((c) => getCardTitle(c))
                          .join(" • ") || "—"}
                      </div>
                    </div>
                  </button>
                ))}

                <button className="sectionRow" onClick={() => setRoute({ name: "news" })}>
                  <div className="sectionIconBox">
                    <div className="sectionIcon">📰</div>
                  </div>
                  <div className="sectionText">
                    <div className="sectionTitle">{t.news}</div>
                    <div className="sectionSub">{news[0] ? (lang === "ru" ? news[0].title_ru : news[0].title_uz) : "—"}</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Блок новостей - увеличенный */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div style={{ 
                fontSize: "18px", 
                fontWeight: 900, 
                color: "#111", 
                padding: "8px 16px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <span>📰 {t.news}</span>
                <button 
                  onClick={() => setRoute({ name: "news" })}
                  style={{
                    padding: "6px 12px",
                    border: "2px solid rgba(111,0,255,.2)",
                    borderRadius: "8px",
                    background: "#FFF8E8",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#6F00FF",
                    cursor: "pointer"
                  }}
                >
                  Все →
                </button>
              </div>
              <div className="list" style={{ paddingTop: 0, paddingBottom: "80px" }}>
                {news.slice(0, 6).map((n) => (
                  <div key={n.id} className="cardCream newsPreview" onClick={() => setRoute({ name: "news_card", newsId: n.id })}>
                    <div className="row" style={{ justifyContent: "space-between", marginBottom: "8px" }}>
                      <div className="newsTitle">
                        {n.pinned ? "📌 " : ""}
                        {lang === "ru" ? n.title_ru : n.title_uz}
                      </div>
                      <div className="newsMeta">{fmtDM(n.published_at)}</div>
                    </div>
                    <div className="newsBodyPreview">{lang === "ru" ? n.body_ru : n.body_uz}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="bottomBar" style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "64px",
              background: "linear-gradient(180deg, #FFF8E8, #FFECD2)",
              borderTop: "2px solid rgba(111,0,255,.15)",
              boxShadow: "0 -4px 16px rgba(0,0,0,.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              padding: "0 16px",
              zIndex: 100
            }}>
              <button
                onClick={() => setRoute({ name: "faq" })}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  flex: 1
                }}
              >
                <span style={{ fontSize: "24px" }}>❓</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#6F00FF" }}>FAQ</span>
              </button>
              
              <button
                onClick={() => setRoute({ name: "sections_all" })}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  flex: 1
                }}
              >
                <span style={{ fontSize: "24px" }}>📂</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#6F00FF" }}>Разделы</span>
              </button>
              
              <button
                onClick={() => setRoute({ name: "uzum" })}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  flex: 1
                }}
              >
                <span style={{ fontSize: "20px" }}>🛒</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#6F00FF" }}>Uzum</span>
              </button>
              
              <button
                onClick={() => setRoute({ name: "profile" })}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  flex: 1
                }}
              >
                <span style={{ fontSize: "24px" }}>👤</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,.6)" }}>{userName?.split(" ")[0] || "Профиль"}</span>
              </button>
            </div>
          </div>
        )}

        {route.name === "profile" && (
          <div className="page" style={{ 
            display: 'flex', 
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
          }}>
            <TopBar
              t={t}
              lang={lang}
              setLang={setLang}
              showSearch={false}
              search={search}
              setSearch={setSearch}
              onBack={goHome}
              onHome={goHome}
            />

            {/* Контейнер для профиля с прокруткой */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              paddingBottom: '80px', // отступ для bottomBar
              WebkitOverflowScrolling: 'touch'
            }}>
              {/* Компонент паспорта */}
              <Profile 
                lang={lang}
                onNavigateBack={() => setRoute({ name: "uzum" })}
                onNavigateToUzum={() => setRoute({ name: "uzum" })}
              />
            </div>

            <BottomBar userName={userName} userPhoto="" onSignOut={signOut} />
          </div>
        )}

        {route.name === "uzum" && (
          <div className="page">
            {/* Connected: Show Navigation and Pages */}
            {uzumConnected && (
              <>
                {/* Navigation Tabs */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '16px',
                  backgroundColor: 'white',
                  borderBottom: '2px solid #f3f4f6',
                  overflowX: 'auto',
                }}>
                  <button
                    onClick={() => setUzumCurrentPage('dashboard')}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: uzumCurrentPage === 'dashboard' ? '#7c3aed' : '#f3f4f6',
                      color: uzumCurrentPage === 'dashboard' ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                  >
                    🏠 {lang === 'ru' ? 'Главная' : 'Asosiy'}
                  </button>
                  <button
                    onClick={() => setUzumCurrentPage('products')}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: uzumCurrentPage === 'products' ? '#7c3aed' : '#f3f4f6',
                      color: uzumCurrentPage === 'products' ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                  >
                    📦 {lang === 'ru' ? 'Товары' : 'Mahsulotlar'}
                  </button>
                  <button
                    onClick={() => setUzumCurrentPage('orders')}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: uzumCurrentPage === 'orders' ? '#22c55e' : '#f3f4f6',
                      color: uzumCurrentPage === 'orders' ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                  >
                    📋 {lang === 'ru' ? 'Заказы' : 'Buyurtmalar'}
                  </button>
                  <button
                    onClick={() => setUzumCurrentPage('finance')}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: uzumCurrentPage === 'finance' ? '#f59e0b' : '#f3f4f6',
                      color: uzumCurrentPage === 'finance' ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                  >
                    💰 {lang === 'ru' ? 'Финансы' : 'Moliya'}
                  </button>
                  <button
                    onClick={() => setUzumCurrentPage('invoices')}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: uzumCurrentPage === 'invoices' ? '#8b5cf6' : '#f3f4f6',
                      color: uzumCurrentPage === 'invoices' ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                  >
                    📄 {lang === 'ru' ? 'Накладные' : 'Hisob-fakturalar'}
                  </button>
                  <button
                    onClick={() => setUzumCurrentPage('reports')}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: uzumCurrentPage === 'reports' ? '#ef4444' : '#f3f4f6',
                      color: uzumCurrentPage === 'reports' ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                  >
                    📈 {lang === 'ru' ? 'Отчеты' : 'Hisobotlar'}
                  </button>
                </div>

                {/* Page Content */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                  {uzumCurrentPage === 'dashboard' && (
                    <UzumDashboard 
                      lang={lang} 
                      token={uzumDecryptedToken} 
                      onNavigate={(page) => setUzumCurrentPage(page)}
                      onNavigateBack={() => setRoute({ name: 'home' })}
                      onDisconnect={handleDisconnect}
                      onChangeLang={() => setLang(lang === 'ru' ? 'uz' : 'ru')}
                    />
                  )}
                  {uzumCurrentPage === 'products' && (
                    <UzumProducts 
                      lang={lang} 
                      token={uzumDecryptedToken}
                      onNavigateBack={() => setUzumCurrentPage('dashboard')}
                      onNavigateHome={() => setRoute({ name: 'home' })}
                    />
                  )}
                  {uzumCurrentPage === 'orders' && (
                    <UzumOrders 
                      lang={lang} 
                      token={uzumDecryptedToken}
                    />
                  )}
                  {uzumCurrentPage === 'finance' && (
                    <UzumFinance 
                      lang={lang} 
                      token={uzumDecryptedToken}
                    />
                  )}
                  {uzumCurrentPage === 'invoices' && (
                    <UzumInvoices 
                      lang={lang} 
                      token={uzumDecryptedToken}
                    />
                  )}
                  {uzumCurrentPage === 'reports' && (
                    <UzumReports 
                      lang={lang} 
                      token={uzumDecryptedToken}
                      onNavigateBack={() => setUzumCurrentPage('dashboard')}
                    />
                  )}
                  {uzumCurrentPage === 'stocks' && (
                    <UzumStocks 
                      lang={lang} 
                      token={uzumDecryptedToken}
                      shopId={uzumSellerInfo?.shopId}
                      onNavigate={(page) => setUzumCurrentPage(page as any)}
                    />
                  )}
                </div>
              </>
            )}
            
            {/* Not Connected: Show Setup Form */}
            {!uzumConnected && (
              <>
                <div className="headerBlock" style={{
                  background: "linear-gradient(135deg, #7E22CE, #6F00FF)",
                  color: "white",
                  padding: "24px 20px",
                  position: "relative",
                  overflow: "hidden"
                }}>
                  {/* Декоративные элементы */}
                  <div style={{
                    position: "absolute",
                    width: "150px",
                    height: "150px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                    filter: "blur(40px)",
                    top: "-50px",
                    right: "-30px"
                  }} />
                  <div style={{
                    position: "absolute",
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                    filter: "blur(30px)",
                    bottom: "-20px",
                    left: "-20px"
                  }} />
                  
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{
                      fontSize: "28px",
                      fontWeight: 900,
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px"
                    }}>
                      <span style={{ fontSize: "32px" }}>🛒</span>
                      Uzum Integration
                    </div>
                    <div style={{
                      fontSize: "14px",
                      opacity: 0.95,
                      fontWeight: 700,
                      lineHeight: "1.4",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <span style={{ fontSize: "16px" }}>○</span>
                      {lang === 'ru' ? 'Не подключено' : 'Ulanmagan'}
                    </div>
                  </div>
                </div>

                <div className="list">
                  {/* Error Display */}
                  {uzumError && (
                    <div className="cardCream" style={{
                      background: "#fee2e2",
                      border: "2px solid #ef4444",
                      marginBottom: "12px"
                    }}>
                      <div style={{
                        fontSize: "14px",
                        color: "#991b1b",
                        fontWeight: 600
                      }}>
                        ⚠️ {uzumError}
                      </div>
                    </div>
                  )}

                  {/* Setup Form */}
                  <div className="cardCream">
                    <div style={{
                      fontSize: "18px",
                      fontWeight: 900,
                      marginBottom: "8px",
                      color: "#6F00FF",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      justifyContent: "space-between",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>🔑</span>
                        Настройка интеграции
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => setShowUzumOnboarding(true)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          ❓ Инструкция
                        </button>
                        <button
                          onClick={() => window.open("https://t.me/CloudGrove", "_blank")}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          💬 Помощь
                        </button>
                      </div>
                    </div>
                    <div style={{
                      fontSize: "13px",
                      color: "#666",
                      marginBottom: "16px",
                    }}>
                      Нужна помощь с подключением? Напишите @CloudGrove
                    </div>
                    
                    {/* Token Input */}
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 700,
                        marginBottom: "8px",
                        color: "rgba(0,0,0,0.7)"
                      }}>
                        Uzum API Token
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showUzumToken ? "text" : "password"}
                          placeholder="uzum_api_token_..."
                          value={uzumToken}
                          onChange={(e) => {
                            setUzumToken(e.target.value);
                            setUzumError('');
                          }}
                          disabled={uzumLoading}
                          className="input"
                          style={{
                            paddingRight: "90px"
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowUzumToken(!showUzumToken)}
                          style={{
                            position: "absolute",
                            right: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            color: "rgba(0,0,0,0.5)",
                            fontSize: "18px"
                          }}
                        >
                          {showUzumToken ? "👁️" : "👁️‍🗨️"}
                        </button>
                        {uzumToken && (
                          <div style={{
                            position: "absolute",
                            right: "45px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#10b981",
                            fontSize: "12px",
                            fontWeight: 600
                          }}>
                            ✓ {uzumToken.length} симв.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* PIN Input */}
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 700,
                        marginBottom: "8px",
                        color: "rgba(0,0,0,0.7)"
                      }}>
                        PIN для шифрования (6-10 символов)
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showUzumPin ? "text" : "password"}
                          placeholder="Создайте PIN для защиты токена"
                          value={uzumPin}
                          onChange={(e) => {
                            setUzumPin(e.target.value);
                            setUzumError('');
                          }}
                          disabled={uzumLoading}
                          className="input"
                          style={{
                            paddingRight: "90px"
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowUzumPin(!showUzumPin)}
                          style={{
                            position: "absolute",
                            right: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            color: "rgba(0,0,0,0.5)",
                            fontSize: "18px"
                          }}
                        >
                          {showUzumPin ? "👁️" : "👁️‍🗨️"}
                        </button>
                        {uzumPin && (
                          <div style={{
                            position: "absolute",
                            right: "45px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: uzumPin.length >= 6 && uzumPin.length <= 10 ? "#10b981" : "#f59e0b",
                            fontSize: "12px",
                            fontWeight: 600
                          }}>
                            {uzumPin.length >= 6 && uzumPin.length <= 10 ? "✓" : "⚠️"} {uzumPin.length} симв.
                          </div>
                        )}
                      </div>
                      <div style={{
                        fontSize: "12px",
                        color: "rgba(0,0,0,0.5)",
                        marginTop: "6px"
                      }}>
                        PIN используется для client-side шифрования токена
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="split" style={{ marginTop: "10px" }}>
                      <button
                        className="btnPrimary"
                        onClick={handleTestToken}
                        disabled={uzumLoading || !uzumToken.trim()}
                        style={{ flex: 1 }}
                      >
                        {uzumLoading ? '⏳ Проверка...' : '🔍 Проверить'}
                      </button>
                      <button
                        className="btnPrimary"
                        onClick={handleSaveToken}
                        disabled={uzumLoading || !uzumToken.trim() || !uzumPin.trim()}
                        style={{ flex: 1 }}
                      >
                        {uzumLoading ? '⏳ Сохранение...' : '💾 Сохранить'}
                      </button>
                    </div>
                  </div>

                  {/* Shop Info Card - показывается после успешной проверки токена */}
                  {uzumShops.length > 0 && (
                    <div className="cardCream" style={{
                      background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
                      border: "2px solid #10b981"
                    }}>
                      <div style={{
                        fontSize: "16px",
                        fontWeight: 900,
                        marginBottom: "12px",
                        color: "#047857",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        <span>✅</span>
                        Токен проверен успешно!
                      </div>
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px"
                      }}>
                        {uzumShops.map((shop: any, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              padding: "12px",
                              background: "white",
                              borderRadius: "8px",
                              border: "1px solid rgba(16, 185, 129, 0.3)"
                            }}
                          >
                            <div style={{
                              fontSize: "16px",
                              fontWeight: 700,
                              marginBottom: "6px",
                              color: "#111",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px"
                            }}>
                              <span style={{ fontSize: "24px" }}>🏪</span>
                              {shop.name}
                            </div>
                            <div style={{
                              fontSize: "14px",
                              color: "#666",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px"
                            }}>
                              <span style={{ fontSize: "16px" }}>🆔</span>
                              <strong>Shop ID:</strong> {shop.id}
                            </div>
                            {shop.description && (
                              <div style={{
                                fontSize: "13px",
                                color: "#888",
                                marginTop: "6px"
                              }}>
                                {shop.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div style={{
                        fontSize: "13px",
                        color: "#047857",
                        marginTop: "12px",
                        fontWeight: 600,
                        textAlign: "center"
                      }}>
                        💾 Теперь нажмите "Сохранить" чтобы завершить настройку
                      </div>
                    </div>
                  )}

                  {/* Info Card */}
                  <div className="cardCream" style={{
                    background: "linear-gradient(135deg, #FFF8E8, #FFECD2)",
                    border: "2px solid rgba(111,0,255,0.15)"
                  }}>
                    <div style={{
                      fontSize: "16px",
                      fontWeight: 900,
                      marginBottom: "12px",
                      color: "#6F00FF",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <span>ℹ️</span>
                      Как получить API токен?
                    </div>
                    <ol style={{
                      fontSize: "14px",
                      lineHeight: "1.6",
                      color: "rgba(0,0,0,0.8)",
                      paddingLeft: "20px",
                      margin: 0
                    }}>
                      <li style={{ marginBottom: "8px" }}>
                        Войдите в <strong>Uzum Seller Cabinet</strong>
                      </li>
                      <li style={{ marginBottom: "8px" }}>
                        Перейдите в раздел <strong>Настройки → API</strong>
                      </li>
                      <li style={{ marginBottom: "8px" }}>
                        Создайте новый API токен с правами на чтение заказов
                      </li>
                      <li>
                        Скопируйте токен и вставьте его в поле выше
                      </li>
                    </ol>
                  </div>

                  {/* Security Notice */}
                  <div className="cardCream" style={{
                    background: "rgba(59, 130, 246, 0.1)",
                    border: "2px solid rgba(59, 130, 246, 0.3)"
                  }}>
                    <div style={{
                      fontSize: "14px",
                      fontWeight: 900,
                      marginBottom: "8px",
                      color: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <span>🔒</span>
                      Безопасность
                    </div>
                    <div style={{
                      fontSize: "13px",
                      lineHeight: "1.5",
                      color: "rgba(0,0,0,0.7)"
                    }}>
                      • Токен шифруется на вашем устройстве (AES-GCM-256)<br/>
                      • PIN никогда не покидает ваш браузер<br/>
                      • В базе хранится только зашифрованный токен<br/>
                      • Даже мы не можем прочитать ваш токен
                    </div>
                  </div>

                  {/* Features */}
                  <div className="cardCream">
                <div style={{
                  fontSize: "16px",
                  fontWeight: 900,
                  marginBottom: "12px",
                  color: "#6F00FF",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span>🚀</span>
                  Возможности интеграции
                </div>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px",
                    background: "rgba(111,0,255,0.05)",
                    borderRadius: "8px"
                  }}>
                    <span style={{ fontSize: "20px" }}>📦</span>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>
                        Синхронизация заказов
                      </div>
                      <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.6)" }}>
                        Автоматическая загрузка новых заказов из Uzum
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px",
                    background: "rgba(111,0,255,0.05)",
                    borderRadius: "8px"
                  }}>
                    <span style={{ fontSize: "20px" }}>📊</span>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>
                        Аналитика продаж
                      </div>
                      <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.6)" }}>
                        Подробная статистика по продажам и комиссиям
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px",
                    background: "rgba(111,0,255,0.05)",
                    borderRadius: "8px"
                  }}>
                    <span style={{ fontSize: "20px" }}>🔔</span>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>
                        Уведомления
                      </div>
                      <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.6)" }}>
                        Мгновенные уведомления о новых заказах в Telegram
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                </div>

                <BottomBar userName={userName} userPhoto="" onSignOut={signOut} />
              </>
            )}
          </div>
        )}

        {route.name === "faq" && (
          <div className="page">
            <TopBar
              t={t}
              lang={lang}
              setLang={setLang}
              showSearch={false}
              search={search}
              setSearch={setSearch}
              onBack={goBack}
              onHome={goHome}
            />

            <div className="headerBlock">
              <div className="h2">{t.faq}</div>
              <div className="sub">Часто задаваемые вопросы</div>
            </div>

            <div className="list">
              {faq.map((item) => (
                <FaqItem key={item.id} question={lang === "ru" ? item.question_ru : item.question_uz} answer={lang === "ru" ? item.answer_ru : item.answer_uz} />
              ))}
            </div>

            <BottomBar userName={userName} userPhoto="" onSignOut={signOut} />
          </div>
        )}

        {route.name === "commissions" && (
          <div className="page">
            <TopBar
              t={t}
              lang={lang}
              setLang={setLang}
              showSearch={false}
              search={search}
              setSearch={setSearch}
              onBack={goBack}
              onHome={goHome}
            />

            <div className="headerBlock">
              <div className="h2">{lang === "ru" ? "Комиссии" : "Komissiyalar"}</div>
              <div className="sub">{lang === "ru" ? "Поиск комиссий по категории товара" : "Tovar turkumi bo'yicha komissiya qidirish"}</div>
            </div>

            <div className="list" style={{ paddingTop: "20px" }}>
              {/* Кнопка калькулятора */}
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: showCalculator ? "#6F00FF" : "linear-gradient(135deg, #6F00FF, #9D4EFF)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(111,0,255,.3)",
                  transition: "all .2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                🧮 {lang === "ru" ? (showCalculator ? "Скрыть калькулятор" : "Калькулятор прибыли") : (showCalculator ? "Kalkulyatorni yashirish" : "Foyda kalkulyatori")}
              </button>

              {/* Калькулятор прибыли */}
              {showCalculator && (
                <div className="cardCream" style={{
                  background: "linear-gradient(145deg, rgba(111,0,255,.08), rgba(111,0,255,.03))",
                  border: "3px solid #6F00FF",
                  position: "relative"
                }}>
                  {/* Заголовок с иконкой информации */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div style={{ fontSize: "16px", fontWeight: 900, color: "#6F00FF" }}>
                      💰 {lang === "ru" ? "Калькулятор прибыли" : "Foyda kalkulyatori"}
                    </div>
                    <button
                      onClick={() => setShowCalcInstruction(!showCalcInstruction)}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: showCalcInstruction ? "#6F00FF" : "rgba(111,0,255,.15)",
                        color: showCalcInstruction ? "#fff" : "#6F00FF",
                        border: "2px solid #6F00FF",
                        fontSize: "14px",
                        fontWeight: 900,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all .2s"
                      }}
                      onMouseEnter={(e) => {
                        if (!showCalcInstruction) {
                          e.currentTarget.style.background = "rgba(111,0,255,.25)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!showCalcInstruction) {
                          e.currentTarget.style.background = "rgba(111,0,255,.15)";
                        }
                      }}
                    >
                      i
                    </button>
                  </div>

                  {/* Всплывающая инструкция */}
                  {showCalcInstruction && (
                    <div style={{
                      padding: "14px",
                      background: "linear-gradient(135deg, rgba(111,0,255,.95), rgba(157,78,255,.95))",
                      borderRadius: "10px",
                      marginBottom: "16px",
                      color: "#fff",
                      fontSize: "12px",
                      lineHeight: "1.6",
                      boxShadow: "0 4px 12px rgba(111,0,255,.3)"
                    }}>
                      <div style={{ fontWeight: 900, marginBottom: "8px", fontSize: "13px" }}>
                        ℹ️ {lang === "ru" ? "Как пользоваться калькулятором:" : "Kalkulyatordan qanday foydalanish:"}
                      </div>
                      {lang === "ru" ? (
                        <>
                          <div style={{ marginBottom: "4px" }}>1️⃣ Найдите нужную категорию через поиск выше</div>
                          <div style={{ marginBottom: "4px" }}>2️⃣ Выберите её из истории поиска</div>
                          <div style={{ marginBottom: "4px" }}>3️⃣ Выберите тип комиссии (FBO/FBS/DBS)</div>
                          <div style={{ marginBottom: "4px" }}>4️⃣ Укажите габарит товара:</div>
                          <div style={{ marginLeft: "12px", marginBottom: "4px", opacity: 0.9 }}>
                            • МГТ (малогабаритный) — логистика 3000 сум
                          </div>
                          <div style={{ marginLeft: "12px", marginBottom: "4px", opacity: 0.9 }}>
                            • СГТ (среднегабаритный) — логистика 5000 сум
                          </div>
                          <div style={{ marginLeft: "12px", marginBottom: "8px", opacity: 0.9 }}>
                            • КГТ (крупногабаритный) — логистика 9000 сум
                          </div>
                          <div style={{ marginBottom: "4px" }}>5️⃣ Введите сумму продажи</div>
                          <div>6️⃣ Получите чистую прибыль к выводу! 💰</div>
                        </>
                      ) : (
                        <>
                          <div style={{ marginBottom: "4px" }}>1️⃣ Yuqorida qidiruv orqali kerakli turkumni toping</div>
                          <div style={{ marginBottom: "4px" }}>2️⃣ Uni qidiruv tarixidan tanlang</div>
                          <div style={{ marginBottom: "4px" }}>3️⃣ Komissiya turini tanlang (FBO/FBS/DBS)</div>
                          <div style={{ marginBottom: "4px" }}>4️⃣ Tovar oʻlchamini koʻrsating:</div>
                          <div style={{ marginLeft: "12px", marginBottom: "4px", opacity: 0.9 }}>
                            • МГТ (kichik) — logistika 3000 som
                          </div>
                          <div style={{ marginLeft: "12px", marginBottom: "4px", opacity: 0.9 }}>
                            • СГТ (oʻrta) — logistika 5000 som
                          </div>
                          <div style={{ marginLeft: "12px", marginBottom: "8px", opacity: 0.9 }}>
                            • КГТ (katta) — logistika 9000 som
                          </div>
                          <div style={{ marginBottom: "4px" }}>5️⃣ Sotish summasini kiriting</div>
                          <div>6️⃣ Toza foydani oling! 💰</div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Выбор комиссии из истории */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 700, color: "rgba(0,0,0,.7)", marginBottom: "6px", display: "block" }}>
                      {lang === "ru" ? "Выберите категорию из истории поиска" : "Qidiruv tarixidan turkumni tanlang"}
                    </label>
                    {commissionHistory.length === 0 ? (
                      <div style={{ fontSize: "13px", color: "#999", fontStyle: "italic" }}>
                        {lang === "ru" ? "Сначала найдите комиссию через поиск выше" : "Avval yuqorida qidiruv orqali komissiyani toping"}
                      </div>
                    ) : (
                      <select
                        value={calcSelectedCommission?.id || ""}
                        onChange={(e) => {
                          const item = commissionHistory.find(h => h.id === e.target.value);
                          setCalcSelectedCommission(item || null);
                        }}
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "10px",
                          border: "2px solid rgba(111,0,255,.2)",
                          background: "#fff",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#111"
                        }}
                      >
                        <option value="">{lang === "ru" ? "Выберите категорию..." : "Turkumni tanlang..."}</option>
                        {commissionHistory.map((item) => {
                          const categoryPath: string[] = [];
                          for (let i = 1; i <= 6; i++) {
                            const cat = item[`category${i}_${lang}`];
                            if (cat) categoryPath.push(cat);
                          }
                          return (
                            <option key={item.id} value={item.id}>
                              {categoryPath.join(" → ")}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>

                  {calcSelectedCommission && (
                    <>
                      {/* Тип комиссии */}
                      <div style={{ marginBottom: "16px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 700, color: "rgba(0,0,0,.7)", marginBottom: "8px", display: "block" }}>
                          {lang === "ru" ? "Тип комиссии" : "Komissiya turi"}
                        </label>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {(["fbo", "fbs", "dbs"] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() => setCalcCommType(type)}
                              style={{
                                flex: 1,
                                padding: "10px",
                                background: calcCommType === type ? "#6F00FF" : "#fff",
                                color: calcCommType === type ? "#fff" : "#111",
                                border: `2px solid ${calcCommType === type ? "#6F00FF" : "rgba(111,0,255,.2)"}`,
                                borderRadius: "10px",
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: "pointer",
                                transition: "all .2s"
                              }}
                            >
                              {type.toUpperCase()} ({calcSelectedCommission[`comm_${type}`]}%)
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Габариты товара */}
                      <div style={{ marginBottom: "16px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 700, color: "rgba(0,0,0,.7)", marginBottom: "8px", display: "block" }}>
                          {lang === "ru" ? "Габариты товара" : "Tovar oʻlchamlari"}
                        </label>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {(["МГТ", "СГТ", "КГТ"] as const).map((gab) => (
                            <button
                              key={gab}
                              onClick={() => setCalcGabarit(gab)}
                              style={{
                                flex: 1,
                                padding: "10px",
                                background: calcGabarit === gab ? "#6F00FF" : "#fff",
                                color: calcGabarit === gab ? "#fff" : "#111",
                                border: `2px solid ${calcGabarit === gab ? "#6F00FF" : "rgba(111,0,255,.2)"}`,
                                borderRadius: "10px",
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: "pointer",
                                transition: "all .2s"
                              }}
                            >
                              {gab}
                              <div style={{ fontSize: "10px", fontWeight: 500, marginTop: "2px" }}>
                                {gab === "МГТ" ? "3000" : gab === "СГТ" ? "5000" : "9000"}
                              </div>
                            </button>
                          ))}
                        </div>
                        <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                          {lang === "ru" ? "Логистический сбор указан под каждым типом" : "Logistika yigʻimi har bir tur ostida koʻrsatilgan"}
                        </div>
                      </div>

                      {/* Сумма продажи */}
                      <div style={{ marginBottom: "16px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 700, color: "rgba(0,0,0,.7)", marginBottom: "6px", display: "block" }}>
                          {lang === "ru" ? "Сумма продажи (сум)" : "Sotish summasi (som)"}
                        </label>
                        <input
                          type="number"
                          value={calcSaleAmount}
                          onChange={(e) => setCalcSaleAmount(e.target.value)}
                          placeholder={lang === "ru" ? "Введите сумму..." : "Summani kiriting..."}
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "10px",
                            border: "2px solid rgba(111,0,255,.2)",
                            background: "#fff",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#111"
                          }}
                        />
                      </div>

                      {/* Результат */}
                      {calcSaleAmount && parseFloat(calcSaleAmount) > 0 && (
                        <div style={{
                          padding: "16px",
                          background: "linear-gradient(135deg, #6F00FF, #9D4EFF)",
                          borderRadius: "12px",
                          color: "#fff"
                        }}>
                          {(() => {
                            const saleAmount = parseFloat(calcSaleAmount);
                            const commPercent = calcSelectedCommission[`comm_${calcCommType}`];
                            const commAmount = saleAmount * (commPercent / 100);
                            const logisticFee = calcGabarit === "МГТ" ? 3000 : calcGabarit === "СГТ" ? 5000 : 9000;
                            const totalDeduction = commAmount + logisticFee;
                            const netProfit = saleAmount - totalDeduction;

                            return (
                              <>
                                <div style={{ fontSize: "13px", marginBottom: "8px", opacity: 0.9 }}>
                                  {lang === "ru" ? "💰 Расчёт" : "💰 Hisoblash"}
                                </div>
                                <div style={{ fontSize: "12px", marginBottom: "4px", opacity: 0.8 }}>
                                  {lang === "ru" ? "Комиссия" : "Komissiya"}: {commAmount.toFixed(0)} {lang === "ru" ? "сум" : "som"} ({commPercent}%)
                                </div>
                                <div style={{ fontSize: "12px", marginBottom: "8px", opacity: 0.8 }}>
                                  {lang === "ru" ? "Логистика" : "Logistika"}: {logisticFee} {lang === "ru" ? "сум" : "som"}
                                </div>
                                <div style={{ fontSize: "12px", marginBottom: "8px", opacity: 0.8, paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,.3)" }}>
                                  {lang === "ru" ? "Всего вычетов" : "Jami chegirmalar"}: {totalDeduction.toFixed(0)} {lang === "ru" ? "сум" : "som"}
                                </div>
                                <div style={{ fontSize: "18px", fontWeight: 900, marginTop: "8px" }}>
                                  {lang === "ru" ? "✅ К выводу: " : "✅ Yechib olish uchun: "}
                                  {netProfit.toFixed(0)} {lang === "ru" ? "сум" : "som"}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Поле поиска */}
              <div className="cardCream">
                <label style={{ 
                  fontSize: "14px", 
                  fontWeight: 700, 
                  color: "rgba(0,0,0,.7)", 
                  marginBottom: "8px",
                  display: "block"
                }}>
                  {lang === "ru" ? "Введите название категории товара" : "Tovar turkumini kiriting"}
                </label>
                <input
                  type="text"
                  value={commissionSearch}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCommissionSearch(value);
                    searchCommissions(value);
                  }}
                  placeholder={lang === "ru" ? "Например: Холодильники, Книги, Плиты..." : "Masalan: Muzlatgichlar, Kitoblar, Pechkalar..."}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "2px solid rgba(111,0,255,.2)",
                    background: "#fff",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#111",
                    outline: "none",
                    transition: "border-color .2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#6F00FF"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(111,0,255,.2)"}
                />

                {/* Выпадающий список результатов */}
                {commissionResults.length > 0 && (
                  <div style={{
                    marginTop: "12px",
                    maxHeight: "300px",
                    overflowY: "auto",
                    border: "2px solid rgba(111,0,255,.15)",
                    borderRadius: "12px",
                    background: "#fff"
                  }}>
                    {commissionResults.map((item) => {
                      // Собираем полный путь категории (с конца к началу)
                      const categoryPath: string[] = [];
                      for (let i = 6; i >= 1; i--) {
                        const cat = item[`category${i}_${lang}`];
                        if (cat) categoryPath.unshift(cat);
                      }

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedCommission(item);
                            setCommissionResults([]);
                            setCommissionSearch(categoryPath.join(" → "));
                            
                            // Добавляем в историю (не более 10 последних)
                            setCommissionHistory(prev => {
                              const filtered = prev.filter(h => h.id !== item.id);
                              return [item, ...filtered].slice(0, 10);
                            });
                          }}
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderBottom: "1px solid rgba(111,0,255,.1)",
                            background: "transparent",
                            textAlign: "left",
                            cursor: "pointer",
                            border: "none",
                            transition: "background .2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(111,0,255,.05)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#111", marginBottom: "4px" }}>
                            {categoryPath.join(" → ")}
                          </div>
                          <div style={{ fontSize: "11px", color: "#666" }}>
                            FBO: {item.comm_fbo}% | FBS: {item.comm_fbs}% | DBS: {item.comm_dbs}%
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Результат выбора */}
              {selectedCommission && (
                <div className="cardCream" style={{
                  background: "linear-gradient(145deg, rgba(111,0,255,.05), rgba(111,0,255,.02))",
                  border: "3px solid #6F00FF"
                }}>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: "#6F00FF", marginBottom: "12px" }}>
                    {lang === "ru" ? "Найденная комиссия" : "Topilgan komissiya"}
                  </div>
                  
                  {/* Путь категории */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "12px", color: "rgba(0,0,0,.6)", marginBottom: "6px" }}>
                      {lang === "ru" ? "Категория" : "Turkum"}
                    </div>
                    {(() => {
                      const categoryPath = [];
                      for (let i = 6; i >= 1; i--) {
                        const cat = selectedCommission[`category${i}_${lang}`];
                        if (cat) categoryPath.unshift(cat);
                      }
                      return (
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#111" }}>
                          {categoryPath.join(" → ")}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Комиссии */}
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "12px"
                  }}>
                    <div style={{
                      padding: "16px",
                      background: "rgba(111,0,255,.1)",
                      borderRadius: "12px",
                      textAlign: "center"
                    }}>
                      <div style={{ fontSize: "11px", color: "rgba(0,0,0,.6)", marginBottom: "6px" }}>FBO</div>
                      <div style={{ fontSize: "24px", fontWeight: 900, color: "#6F00FF" }}>
                        {selectedCommission.comm_fbo}%
                      </div>
                    </div>
                    <div style={{
                      padding: "16px",
                      background: "rgba(111,0,255,.1)",
                      borderRadius: "12px",
                      textAlign: "center"
                    }}>
                      <div style={{ fontSize: "11px", color: "rgba(0,0,0,.6)", marginBottom: "6px" }}>FBS</div>
                      <div style={{ fontSize: "24px", fontWeight: 900, color: "#6F00FF" }}>
                        {selectedCommission.comm_fbs}%
                      </div>
                    </div>
                    <div style={{
                      padding: "16px",
                      background: "rgba(111,0,255,.1)",
                      borderRadius: "12px",
                      textAlign: "center"
                    }}>
                      <div style={{ fontSize: "11px", color: "rgba(0,0,0,.6)", marginBottom: "6px" }}>DBS</div>
                      <div style={{ fontSize: "24px", fontWeight: 900, color: "#6F00FF" }}>
                        {selectedCommission.comm_dbs}%
                      </div>
                    </div>
                  </div>

                  {/* Кнопка очистки */}
                  <button
                    onClick={() => {
                      setSelectedCommission(null);
                      setCommissionSearch("");
                    }}
                    style={{
                      width: "100%",
                      marginTop: "16px",
                      padding: "12px",
                      borderRadius: "12px",
                      border: "2px solid rgba(111,0,255,.2)",
                      background: "#fff",
                      color: "#6F00FF",
                      fontWeight: 700,
                      fontSize: "14px",
                      cursor: "pointer"
                    }}
                  >
                    {lang === "ru" ? "Новый поиск" : "Yangi qidiruv"}
                  </button>
                </div>
              )}

              {/* Подсказка */}
              {!selectedCommission && commissionSearch === "" && (
                <div style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "rgba(0,0,0,.5)",
                  fontSize: "14px"
                }}>
                  {lang === "ru" 
                    ? "Введите название категории товара для поиска комиссии"
                    : "Komissiyani qidirish uchun tovar turkumini kiriting"
                  }
                </div>
              )}
            </div>
          </div>
        )}

        {route.name === "section" && (
          <div className="page">
            <TopBar
              t={t}
              lang={lang}
              setLang={setLang}
              showSearch={false}
              search={search}
              setSearch={setSearch}
              onBack={goBack}
              onHome={goHome}
            />

            <div className="headerBlock">
              <div className="h2">
                {getSectionTitle(sections.find((s) => s.id === route.sectionId) as SectionRow)}
              </div>
              <div className="sub">{t.cards}</div>
            </div>

            <div className="list">
              {cards
                .filter((c) => c.section_id === route.sectionId)
                .sort((a, b) => a.sort - b.sort)
                .map((c) => {
                  const body = getCardBody(c);
                  const preview = body.split("\n").slice(0, 3).join("\n");
                  const hasMore = body.split("\n").length > 3;

                  return (
                    <div 
                      key={c.id} 
                      className="cardCream cardClickable"
                      onClick={() => setRoute({ name: "card", cardId: c.id })}
                    >
                      <div className="cardTitle">{getCardTitle(c)}</div>

                      <div className="cardPreview">
                        {preview}
                        {hasMore ? "\n..." : ""}
                      </div>
                    </div>
                  );
                })}
            </div>

            <BottomBar userName={userName} userPhoto="" onSignOut={signOut} />
          </div>
        )}

        {route.name === "sections_all" && (
          <div className="page">
            <TopBar
              t={t}
              lang={lang}
              setLang={setLang}
              showSearch={true}
              search={search}
              setSearch={setSearch}
              onBack={goBack}
              onHome={goHome}
            />

            <div className="headerBlock">
              <div className="h2">{t.sections}</div>
              <div className="sub">{t.allSections}</div>
            </div>

            <div className="list">
              {sections.map((s) => (
                <button
                  key={s.id}
                  className="cardCream"
                  style={{ textAlign: "center", display: "flex", gap: 12, alignItems: "center", flexDirection: "column" }}
                  onClick={() => setRoute({ name: "section", sectionId: s.id })}
                >
                  <div className="sectionIconBox" style={{ flex: "0 0 auto" }}>
                    <div className="sectionIcon">{s.icon}</div>
                  </div>

                  <div style={{ flex: 1, width: "100%" }}>
                    <div style={{ fontWeight: 950, color: "#111", textAlign: "center" }}>{getSectionTitle(s)}</div>
                    <div style={{ marginTop: 6, color: "rgba(0,0,0,.55)", fontSize: 13, textAlign: "center" }}>
                      {cards.filter((c) => c.section_id === s.id).slice(0, 2).map((c) => getCardTitle(c)).join(" • ") || "—"}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <BottomBar userName={userName} userPhoto="" onSignOut={signOut} />
          </div>
        )}

        {route.name === "card" && (
          <div className="page">
            <TopBar
              t={t}
              lang={lang}
              setLang={setLang}
              showSearch={false}
              search={search}
              setSearch={setSearch}
              onBack={goBack}
              onHome={goHome}
            />

            {(() => {
              const c = cards.find((x) => x.id === route.cardId);
              if (!c) return null;
              const body = getCardBody(c);

              return (
                <>
                  <div className="headerBlock">
                    <div className="h2">{getCardTitle(c)}</div>
                    <div className="sub">{t.cards}</div>
                  </div>

                  <div className="list">
                    <div className="cardCream">
                      <pre
                        style={{
                          margin: 0,
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.5,
                          fontFamily: "inherit",
                          fontSize: 14,
                          color: "rgba(0,0,0,.78)",
                        }}
                      >
                        {body}
                      </pre>

                      <div style={{ marginTop: 14, display: "flex", gap: 10, flexDirection: "column" }}>
                        <button className="btnPrimary" style={{ width: "100%" }} onClick={() => copyText(body)}>
                          {t.copyAll}
                        </button>
                        {c.file_url && (
                          <a
                            href={c.file_url}
                            download
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: "48px",
                              border: "3px solid rgba(111,0,255,.3)",
                              borderRadius: "14px",
                              backgroundColor: "rgba(111,0,255,.08)",
                              color: "var(--accent)",
                              fontWeight: "950",
                              fontSize: "14px",
                              textDecoration: "none",
                              cursor: "pointer",
                              transition: "all .12s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "rgba(111,0,255,.15)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "rgba(111,0,255,.08)";
                            }}
                          >
                            📥 Скачать файл
                          </a>
                        )}
                      </div>

                      {c.map_url && (
                        <div style={{ marginTop: 16 }}>
                          <div style={{ fontWeight: 950, marginBottom: 10, fontSize: 14 }}>
                            📍 Карта пунктов приема
                          </div>
                          <iframe
                            src={c.map_url}
                            width="100%"
                            height="400"
                            style={{
                              border: "2px solid rgba(111,0,255,.2)",
                              borderRadius: "12px",
                              display: "block",
                            }}
                            allowFullScreen
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}

            <BottomBar userName={userName} userPhoto="" onSignOut={signOut} />
          </div>
        )}

        {route.name === "news" && (
          <div className="page">
            <TopBar
              t={t}
              lang={lang}
              setLang={setLang}
              showSearch={false}
              search={search}
              setSearch={setSearch}
              onBack={goBack}
              onHome={goHome}
            />

            <div className="headerBlock">
              <div className="h2">{t.news}</div>
              <div className="sub">{t.allNews}</div>
            </div>

            <button
              className="allSectionsBtn"
              onClick={() => setRoute({ name: "sections_all" })}
              style={{
                margin: "16px",
                marginBottom: 0,
                width: "calc(100% - 32px)",
                padding: "14px",
                borderRadius: "var(--r-lg)",
                border: "3px solid var(--accent)",
                background: "linear-gradient(135deg, rgba(111,0,255,.1), rgba(111,0,255,.05))",
                color: "var(--accent)",
                fontWeight: 950,
                fontSize: 16,
                cursor: "pointer",
                transition: "all .2s ease",
                boxShadow: "0 4px 12px rgba(111,0,255,.15)",
              }}
            >
              📂 {t.allSections}
            </button>

            <div className="list">
              {news.map((n) => (
                <div key={n.id} className="cardCream newsPreview" onClick={() => setRoute({ name: "news_card", newsId: n.id })}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <div className="newsTitle">
                      {n.pinned ? "📌 " : ""}
                      {lang === "ru" ? n.title_ru : n.title_uz}
                    </div>
                    <div className="newsMeta">{fmtDM(n.published_at)}</div>
                  </div>

                  {n.image_url && (
                    <img
                      src={n.image_url}
                      alt="news"
                      style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: 12,
                        marginTop: 10,
                        marginBottom: 10,
                        objectFit: "cover",
                        maxHeight: 200,
                      }}
                    />
                  )}

                  <div className="newsBodyPreview">{lang === "ru" ? n.body_ru : n.body_uz}</div>
                </div>
              ))}
            </div>

            <BottomBar userName={userName} userPhoto="" onSignOut={signOut} />
          </div>
        )}

        {route.name === "news_card" && (
          <div className="page">
            <TopBar
              t={t}
              lang={lang}
              setLang={setLang}
              showSearch={false}
              search={search}
              setSearch={setSearch}
              onBack={goBack}
              onHome={goHome}
            />

            {(() => {
              const n = news.find((x) => x.id === (route as { newsId: string }).newsId);
              if (!n) return <div className="center">News not found</div>;
              return (
                <div className="list">
                  <div className="cardCream">
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <div className="newsTitle">
                        {n.pinned ? "📌 " : ""}
                        {lang === "ru" ? n.title_ru : n.title_uz}
                      </div>
                      <div className="newsMeta">{fmtDM(n.published_at)}</div>
                    </div>

                    {n.image_url && (
                      <img
                        src={n.image_url}
                        alt="news"
                        style={{
                          width: "100%",
                          height: "auto",
                          borderRadius: 12,
                          marginTop: 10,
                          marginBottom: 10,
                          objectFit: "cover",
                          maxHeight: 400,
                        }}
                      />
                    )}

                    <div className="newsBody">{lang === "ru" ? n.body_ru : n.body_uz}</div>
                  </div>
                </div>
              );
            })()}

            <BottomBar userName={userName} userPhoto="" onSignOut={signOut} />
          </div>
        )}

        {route.name === "admin" && (
          <div className="page">
            <TopBar
              t={t}
              lang={lang}
              setLang={setLang}
              showSearch={false}
              search={search}
              setSearch={setSearch}
              onBack={() => setAdminTab("")}
              onHome={goHome}
              rightSlot={
                <button className="btnGhost" onClick={adminSignOut}>
                  {t.signOut}
                </button>
              }
            />

            <div className="headerBlock">
              <div className="h2">{t.admin}</div>
              <div className="sub" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {t.manageSections}
                <span style={{ 
                  padding: "4px 10px", 
                  borderRadius: 6, 
                  fontSize: 11, 
                  fontWeight: 900,
                  background: userRole === "owner" ? "#e74c3c" : userRole === "admin" ? "#e67e22" : userRole === "editor" ? "#9b59b6" : "#3498db",
                  color: "#fff"
                }}>
                  {userRole === "owner" ? "👑 OWNER" : userRole === "admin" ? "⚙️ ADMIN" : userRole === "editor" ? "✏️ EDITOR" : "👁️ VIEWER"}
                </span>
              </div>
            </div>

            <div className="list">
              <div className="cardCream">
                <div style={{ padding: "12px", background: "rgba(111,0,255,.05)", borderRadius: "8px", marginBottom: "16px", fontSize: "13px", color: "#666" }}>
                  {userRole === "owner" && "👑 Владелец - полный доступ ко всему"}
                  {userRole === "admin" && "⚙️ Админ - управление новостями, FAQ, кодами"}
                  {userRole === "editor" && "✏️ Редактор - редактирование разделов и карточек"}
                  {userRole === "viewer" && "👁️ Просмотр - только чтение"}
                </div>
                <div className="adminCarousel">
                  {canEdit() && (
                    <>
                      <button className="btnGhost" onClick={() => setAdminTab("sections")}>
                        📂 {t.manageSections}
                      </button>
                      <button className="btnGhost" onClick={() => setAdminTab("cards")}>
                        🗂️ {t.manageCards}
                      </button>
                    </>
                  )}
                  {canManage() && (
                    <>
                      <button className="btnGhost" onClick={() => setAdminTab("news")}>
                        📰 {t.manageNews}
                      </button>
                      <button className="btnGhost" onClick={() => setAdminTab("faq")}>
                        ❓ {t.manageFaq}
                      </button>
                      <button className="btnGhost" onClick={() => setAdminTab("codes")}>
                        🔑 {t.manageCodes}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {canEdit() && adminTab === "sections" && (
                <div className="cardCream">
                  <div style={{ fontWeight: 950, marginBottom: 12 }}>{t.manageSections}</div>

                  <div className="split">
                    <input
                      className="input"
                      placeholder="key (например docs)"
                      value={secForm.key}
                      onChange={(e) => setSecForm({ ...secForm, key: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder={t.icon}
                      value={secForm.icon}
                      onChange={(e) => setSecForm({ ...secForm, icon: e.target.value })}
                    />
                  </div>

                  <div className="split" style={{ marginTop: 10 }}>
                    <input
                      className="input"
                      placeholder={t.titleRu}
                      value={secForm.title_ru}
                      onChange={(e) => setSecForm({ ...secForm, title_ru: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder={t.titleUz}
                      value={secForm.title_uz}
                      onChange={(e) => setSecForm({ ...secForm, title_uz: e.target.value })}
                    />
                  </div>

                  <div className="split" style={{ marginTop: 10 }}>
                    <input
                      className="input"
                      placeholder={t.sort}
                      value={String(secForm.sort)}
                      onChange={(e) => setSecForm({ ...secForm, sort: Number(e.target.value || 100) })}
                    />
                    <button className="btnPrimary" onClick={adminSaveSection}>
                      {t.add}
                    </button>
                  </div>

                  <div style={{ marginTop: 16, fontWeight: 950 }}>Список</div>
                  <div className="adminListContainer">
                    {sections.map((s) => (
                      <div key={s.id} style={{ 
                        padding: "12px 16px", 
                        background: "rgba(111,0,255,.05)", 
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                      }}>
                        <span style={{ fontSize: "24px" }}>{s.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: "#111", marginBottom: "2px", wordBreak: "break-word" }}>{s.title_ru}</div>
                          <div style={{ fontSize: "12px", color: "#666", wordBreak: "break-word" }}>{s.title_uz}</div>
                        </div>
                        <button 
                          className="btnGhost" 
                          onClick={() => adminDeleteSection(s.id)}
                          style={{ flexShrink: 0, padding: "6px 12px", fontSize: "12px" }}
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {canEdit() && adminTab === "cards" && (
                <div className="cardCream">
                  <div style={{ fontWeight: 950, marginBottom: 12 }}>{t.manageCards}</div>

                  <select
                    className="input"
                    value={cardForm.section_id}
                    onChange={(e) => setCardForm({ ...cardForm, section_id: e.target.value })}
                  >
                    <option value="">{t.chooseSection}</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title_ru}
                      </option>
                    ))}
                  </select>

                  <div className="split" style={{ marginTop: 10 }}>
                    <input
                      className="input"
                      placeholder={t.titleRu}
                      value={cardForm.title_ru}
                      onChange={(e) => setCardForm({ ...cardForm, title_ru: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder={t.titleUz}
                      value={cardForm.title_uz}
                      onChange={(e) => setCardForm({ ...cardForm, title_uz: e.target.value })}
                    />
                  </div>

                  <div className="split" style={{ marginTop: 10 }}>
                    <textarea
                      className="input"
                      style={{ height: 140, paddingTop: 12 }}
                      placeholder={t.bodyRu}
                      value={cardForm.body_ru}
                      onChange={(e) => setCardForm({ ...cardForm, body_ru: e.target.value })}
                    />
                    <textarea
                      className="input"
                      style={{ height: 140, paddingTop: 12 }}
                      placeholder={t.bodyUz}
                      value={cardForm.body_uz}
                      onChange={(e) => setCardForm({ ...cardForm, body_uz: e.target.value })}
                    />
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <input
                      className="input"
                      placeholder="URL файла (опционально)"
                      value={cardForm.file_url}
                      onChange={(e) => setCardForm({ ...cardForm, file_url: e.target.value })}
                    />
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <input
                      className="input"
                      placeholder="URL Яндекс карты (iframe src, опционально)"
                      value={cardForm.map_url}
                      onChange={(e) => setCardForm({ ...cardForm, map_url: e.target.value })}
                    />
                  </div>

                  <div className="split" style={{ marginTop: 10 }}>
                    <input
                      className="input"
                      placeholder={t.sort}
                      value={String(cardForm.sort)}
                      onChange={(e) => setCardForm({ ...cardForm, sort: Number(e.target.value || 100) })}
                    />
                    <button className="btnPrimary" onClick={adminSaveCard}>
                      {editingCardId ? t.save : t.add}
                    </button>
                    {editingCardId && (
                      <button
                        className="btnGhost"
                        onClick={() => {
                          setEditingCardId(null);
                          setCardForm({ section_id: "", title_ru: "", title_uz: "", body_ru: "", body_uz: "", sort: 100, file_url: "", map_url: "" });
                        }}
                      >
                        Отмена
                      </button>
                    )}
                  </div>

                  <div style={{ marginTop: 16, fontWeight: 950 }}>Список</div>
                  <div className="adminListContainer">
                    {cards.map((c) => {
                      const section = sections.find(s => s.id === c.section_id);
                      return (
                        <div key={c.id} style={{ 
                          padding: "12px 16px", 
                          background: "rgba(111,0,255,.05)", 
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px"
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: "#111", marginBottom: "4px", wordBreak: "break-word" }}>{c.title_ru}</div>
                            <div style={{ fontSize: "12px", color: "#666", marginBottom: "2px", wordBreak: "break-word" }}>{c.title_uz}</div>
                            {section && (
                              <div style={{ fontSize: "11px", color: "#999", marginTop: "6px" }}>
                                {section.icon} {section.title_ru}
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                            <button 
                              className="btnGhost" 
                              onClick={() => {
                                setEditingCardId(c.id);
                                setCardForm({
                                  section_id: c.section_id,
                                  title_ru: c.title_ru,
                                  title_uz: c.title_uz,
                                  body_ru: c.body_ru,
                                  body_uz: c.body_uz,
                                  sort: c.sort,
                                  file_url: c.file_url || "",
                                  map_url: c.map_url || "",
                                });
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                            >
                              Ред.
                            </button>
                            <button 
                              className="btnGhost" 
                              onClick={() => adminDeleteCard(c.id)}
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                            >
                              Удал.
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {canManage() && adminTab === "news" && (
                <div className="cardCream">
                  <div style={{ fontWeight: 950, marginBottom: 12 }}>{t.manageNews}</div>

                  <div className="split">
                    <input
                      className="input"
                      placeholder={t.titleRu}
                      value={newsForm.title_ru}
                      onChange={(e) => setNewsForm({ ...newsForm, title_ru: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder={t.titleUz}
                      value={newsForm.title_uz}
                      onChange={(e) => setNewsForm({ ...newsForm, title_uz: e.target.value })}
                    />
                  </div>

                  <div className="split" style={{ marginTop: 10 }}>
                    <textarea
                      className="input"
                      style={{ height: 140, paddingTop: 12 }}
                      placeholder={t.bodyRu}
                      value={newsForm.body_ru}
                      onChange={(e) => setNewsForm({ ...newsForm, body_ru: e.target.value })}
                    />
                    <textarea
                      className="input"
                      style={{ height: 140, paddingTop: 12 }}
                      placeholder={t.bodyUz}
                      value={newsForm.body_uz}
                      onChange={(e) => setNewsForm({ ...newsForm, body_uz: e.target.value })}
                    />
                  </div>

                  <div className="split" style={{ marginTop: 10, alignItems: "center" }}>
                    <input
                      className="input"
                      placeholder={t.date}
                      value={newsForm.published_at}
                      onChange={(e) => setNewsForm({ ...newsForm, published_at: e.target.value })}
                    />
                    <label className="row" style={{ color: "rgba(20,18,26,.85)" }}>
                      <input
                        type="checkbox"
                        checked={newsForm.pinned}
                        onChange={(e) => setNewsForm({ ...newsForm, pinned: e.target.checked })}
                      />
                      <span style={{ fontWeight: 950 }}>{t.pinned}</span>
                    </label>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <input
                      className="input"
                      placeholder="URL картинки (обязательно)"
                      value={newsForm.image_url}
                      onChange={(e) => setNewsForm({ ...newsForm, image_url: e.target.value })}
                    />
                  </div>

                  <button className="btnPrimary" style={{ marginTop: 12, width: "100%" }} onClick={adminSaveNews}>
                    {t.add}
                  </button>

                  <div style={{ marginTop: 16, fontWeight: 950 }}>Список</div>
                  <div className="adminListContainer">
                    {news.map((n) => (
                      <div key={n.id} style={{ 
                        padding: "12px 16px", 
                        background: "rgba(111,0,255,.05)", 
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: "#111", marginBottom: "4px", wordBreak: "break-word" }}>
                            {n.pinned ? "📌 " : ""}
                            {n.title_ru}
                          </div>
                          <div style={{ fontSize: "12px", color: "#666", marginBottom: "2px", wordBreak: "break-word" }}>{n.title_uz}</div>
                          <div style={{ fontSize: "11px", color: "#999", marginTop: "6px" }}>
                            {new Date(n.published_at).toLocaleDateString("ru-RU")}
                          </div>
                        </div>
                        <button 
                          className="btnGhost" 
                          onClick={() => adminDeleteNews(n.id)}
                          style={{ flexShrink: 0, padding: "6px 12px", fontSize: "12px" }}
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {canManage() && adminTab === "codes" && (
                <div className="cardCream">
                  <div style={{ fontWeight: 950, marginBottom: 12, fontSize: "18px" }}>🔐 {t.manageCodes}</div>
                  
                  <div style={{ padding: "12px", background: "rgba(111,0,255,.05)", borderRadius: "8px", marginBottom: "16px", fontSize: "13px", color: "#666" }}>
                    🔒 Код должен быть 6 цифр. Оставьте поле пустым для автогенерации. Хеширование SHA-256.
                  </div>

                  {/* Выбор роли с карточками */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontWeight: 950, marginBottom: "8px", fontSize: "14px" }}>Выберите роль:</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px" }}>
                      {[
                        { value: "viewer", icon: "👁️", title: "Viewer", desc: "Только просмотр", color: "#3498db" },
                        { value: "editor", icon: "✏️", title: "Editor", desc: "Редактирование", color: "#9b59b6" },
                        { value: "admin", icon: "⚙️", title: "Admin", desc: "Управление", color: "#e67e22" },
                        { value: "owner", icon: "👑", title: "Owner", desc: "Полный доступ", color: "#e74c3c" },
                      ].map((role) => (
                        <div
                          key={role.value}
                          onClick={() => setCodeForm({ ...codeForm, role: role.value })}
                          style={{
                            padding: "12px",
                            borderRadius: "8px",
                            border: `2px solid ${codeForm.role === role.value ? role.color : "#ddd"}`,
                            background: codeForm.role === role.value ? `${role.color}15` : "#fff",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            textAlign: "center",
                          }}
                        >
                          <div style={{ fontSize: "24px", marginBottom: "4px" }}>{role.icon}</div>
                          <div style={{ fontWeight: 950, fontSize: "13px", color: role.color }}>{role.title}</div>
                          <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>{role.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="split">
                    <input
                      className="input"
                      placeholder="Код (6 цифр, пусто = авто)"
                      value={codeForm.code}
                      onChange={(e) => setCodeForm({ ...codeForm, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      maxLength={6}
                      pattern="\d{6}"
                    />
                    <input
                      className="input"
                      type="number"
                      placeholder="Макс. использований (пусто = ∞)"
                      value={codeForm.max_uses ?? ""}
                      onChange={(e) => setCodeForm({ ...codeForm, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>

                  <div className="split" style={{ marginTop: 10 }}>
                    <input
                      className="input"
                      type="datetime-local"
                      placeholder={t.expiresAt}
                      value={codeForm.expires_at}
                      onChange={(e) => setCodeForm({ ...codeForm, expires_at: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder={t.note}
                      value={codeForm.note}
                      onChange={(e) => setCodeForm({ ...codeForm, note: e.target.value })}
                    />
                  </div>

                  <button className="btnPrimary" style={{ marginTop: 12, width: "100%" }} onClick={adminSaveCode}>
                    🔐 Создать код доступа
                  </button>

                  {generatedCode && (
                    <div style={{ 
                      marginTop: "16px", 
                      padding: "16px", 
                      background: "#d4edda", 
                      borderRadius: "12px", 
                      border: "2px solid #28a745" 
                    }}>
                      <div style={{ fontWeight: 900, marginBottom: 8, color: "#155724" }}>✅ Код создан успешно!</div>
                      <div style={{ 
                        fontFamily: "monospace", 
                        fontSize: "20px", 
                        fontWeight: 900, 
                        letterSpacing: "2px", 
                        color: "#111",
                        padding: "12px",
                        background: "#fff",
                        borderRadius: "8px",
                        textAlign: "center",
                        marginBottom: "12px"
                      }}>
                        {generatedCode}
                      </div>
                      <div style={{ fontSize: 12, color: "#856404", marginBottom: 8 }}>
                        ⚠️ Сохраните этот код! Он больше не будет показан.
                      </div>
                      <button 
                        className="btnPrimary" 
                        onClick={() => { copyText(generatedCode); setGeneratedCode(null); }}
                        style={{ width: "100%" }}
                      >
                        📋 Скопировать и закрыть
                      </button>
                    </div>
                  )}

                  <div style={{ marginTop: 16, fontWeight: 950, fontSize: 14 }}>Список кодов ({accessCodes.length})</div>
                  <div className="adminListContainer">
                    {accessCodes.length === 0 ? (
                      <div style={{ textAlign: "center", padding: 20, color: "rgba(0,0,0,.5)", fontStyle: "italic" }}>Нет кодов</div>
                    ) : (
                      (() => {
                        // Группируем коды: активные → истёкшие → неактивные
                        const active = accessCodes.filter(ac => ac.is_active && (!ac.expires_at || new Date(ac.expires_at) >= new Date()));
                        const expired = accessCodes.filter(ac => ac.is_active && ac.expires_at && new Date(ac.expires_at) < new Date());
                        const inactive = accessCodes.filter(ac => !ac.is_active);
                        const sorted = [...active, ...expired, ...inactive];
                        
                        return sorted.map((ac) => {
                        const expiresDate = ac.expires_at ? new Date(ac.expires_at) : null;
                        const isExpired = expiresDate && expiresDate < new Date();
                        const daysLeft = expiresDate ? Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                        
                        return (
                          <div key={ac.id} className="cardCream" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10, opacity: ac.is_active ? 1 : 0.5 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ fontSize: 13, color: "#666", fontFamily: "monospace" }}>
                                {ac.display_code || "🔑 " + ac.id.slice(0, 8) + "..."}
                              </div>
                              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                <span style={{ 
                                  padding: "4px 10px", 
                                  borderRadius: 6, 
                                  fontSize: 11, 
                                  fontWeight: 900,
                                  background: "#e3f2fd",
                                  color: "#1565c0"
                                }}>
                                  {ac.role === "owner" ? "👑 OWNER" : ac.role === "admin" ? "⚙️ ADMIN" : ac.role === "editor" ? "✏️ EDITOR" : "👁️ VIEWER"}
                                </span>
                                <span style={{ 
                                  padding: "4px 10px", 
                                  borderRadius: 6, 
                                  fontSize: 11, 
                                  fontWeight: 900,
                                  background: !ac.is_active ? "#f8d7da" : (isExpired ? "#fff3cd" : "#d4edda"),
                                  color: !ac.is_active ? "#721c24" : (isExpired ? "#856404" : "#155724")
                                }}>
                                  {!ac.is_active ? "ОТКЛЮЧЕН" : isExpired ? "ИСТЁК" : "АКТИВЕН"}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: 10, fontSize: 13, color: "rgba(0,0,0,.6)" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, marginBottom: 2 }}>Срок:</div>
                                {expiresDate ? expiresDate.toLocaleDateString("ru-RU") + " " + expiresDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "Неограничен"}
                                {daysLeft !== null && daysLeft > 0 && (
                                  <div style={{ fontSize: 11, color: "rgba(0,0,0,.5)", marginTop: 2 }}>
                                    ({daysLeft} дн. осталось)
                                  </div>
                                )}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, marginBottom: 2 }}>Использований:</div>
                                {ac.uses_count} / {ac.max_uses ?? "∞"}
                              </div>
                            </div>

                            {ac.note && (
                              <div style={{ fontSize: 13, color: "rgba(0,0,0,.6)" }}>
                                <div style={{ fontWeight: 700, marginBottom: 2 }}>Заметка:</div>
                                {ac.note}
                              </div>
                            )}

                            <div style={{ fontSize: 11, color: "rgba(0,0,0,.4)" }}>
                              Создан: {new Date(ac.created_at).toLocaleDateString("ru-RU")}
                            </div>

                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                              <button className="btnGhost" onClick={() => deleteAccessCode(ac.id)} style={{ padding: "6px 10px", fontSize: 11 }}>
                                🗑️ {ac.is_active ? "Отключить" : "Удалён"}
                              </button>
                            </div>
                          </div>
                        );
                      });
                      })()
                    )}
                  </div>
                </div>
              )}

              {canManage() && adminTab === "faq" && (
                <>

                  <div className="headerBlock">
                    <div className="h2">{t.manageFaq}</div>
                  </div>

                  <div className="cardCream">
                    <div style={{ fontWeight: 950, marginBottom: 12 }}>{t.add}</div>
                    <div className="split">
                      <input
                        className="input"
                        placeholder={t.questionRu}
                        value={faqForm.question_ru}
                        onChange={(e) => setFaqForm({ ...faqForm, question_ru: e.target.value })}
                      />
                      <input
                        className="input"
                        placeholder={t.questionUz}
                        value={faqForm.question_uz}
                        onChange={(e) => setFaqForm({ ...faqForm, question_uz: e.target.value })}
                      />
                    </div>
                    <div className="split">
                      <textarea
                        className="input"
                        placeholder={t.answerRu}
                        value={faqForm.answer_ru}
                        onChange={(e) => setFaqForm({ ...faqForm, answer_ru: e.target.value })}
                        rows={3}
                      />
                      <textarea
                        className="input"
                        placeholder={t.answerUz}
                        value={faqForm.answer_uz}
                        onChange={(e) => setFaqForm({ ...faqForm, answer_uz: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="split">
                      <input
                        className="input"
                        type="number"
                        placeholder={t.sort}
                        value={faqForm.sort}
                        onChange={(e) => setFaqForm({ ...faqForm, sort: parseInt(e.target.value) || 0 })}
                      />
                      <button className="btnPrimary" onClick={adminSaveFaq}>
                        {t.save}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: 16, fontWeight: 950, fontSize: 14 }}>Список FAQ ({faq.length})</div>
                  <div className="adminListContainer">
                    {faq.length === 0 ? (
                      <div style={{ textAlign: "center", padding: 20, color: "rgba(0,0,0,.5)", fontStyle: "italic" }}>Нет FAQ</div>
                    ) : (
                      faq.map((f) => (
                        <div key={f.id} style={{ 
                          padding: "12px 16px", 
                          background: "rgba(111,0,255,.05)", 
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px"
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: "#111", marginBottom: "6px", wordBreak: "break-word" }}>{f.question_ru}</div>
                            <div style={{ fontSize: "13px", color: "#666", marginBottom: "10px", wordBreak: "break-word" }}>{f.answer_ru}</div>
                            <div style={{ fontSize: "12px", color: "#999", marginBottom: "4px", wordBreak: "break-word" }}>{f.question_uz}</div>
                            <div style={{ fontSize: "12px", color: "#999", wordBreak: "break-word" }}>{f.answer_uz}</div>
                          </div>
                          <button 
                            className="btnGhost" 
                            onClick={() => adminDeleteFaq(f.id)}
                            style={{ flexShrink: 0, padding: "6px 12px", fontSize: "12px" }}
                          >
                            Удалить
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <BottomBar userName={userName} userPhoto="" onSignOut={adminSignOut} />
          </div>
        )}

        {/* Uzum Onboarding Modal */}
        {showUzumOnboarding && (
          <UzumOnboarding
            lang={lang}
            onComplete={() => setShowUzumOnboarding(false)}
          />
        )}

        {/* ВРЕМЕННО ОТКЛЮЧЕНО - раскомментировать когда доработаешь
        {route.name === "chat" && (
          <div className="page">
            <TopBar
              t={t}
              lang={lang}
              setLang={setLang}
              showSearch={false}
              search={search}
              setSearch={setSearch}
              onBack={goBack}
              onHome={goHome}
            />

            <div className="headerBlock">
              <div className="h2">Чат поддержки</div>
              <div className="sub">Задайте вопрос</div>
            </div>

            <Chat />

            <BottomBar userName={userName} userPhoto="" onSignOut={signOut} />
          </div>
        )}
        */}

        {toast ? <div className="toast">{toast}</div> : null}
      </div>
    </div>
  );
}
