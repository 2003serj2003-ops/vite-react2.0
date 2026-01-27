import { type ReactNode, useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "./supabase";
import "./App.css";
// import Chat from "./Chat"; // ВРЕМЕННО ОТКЛЮЧЕНО - раскомментировать когда доработаешь
import { runCrawl } from "../scripts/crawls";

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
    const ok = localStorage.getItem("access_ok") === "1";
    return ok ? { name: "home" } : { name: "welcome" };
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

  // Проверка прав доступа
  const canEdit = () => ["editor", "admin", "owner"].includes(userRole);
  const canManage = () => ["admin", "owner"].includes(userRole);
  const canFullAccess = () => userRole === "owner";

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

  // Get Telegram user info
  useEffect(() => {
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
          
          if (fullName) {
            setUserName(fullName);
            localStorage.setItem("user_name", fullName);
          }
          
          // Save user ID to database
          if (user.id) {
            saveUserToDb(user.id, firstName, lastName);
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
    if (route.name === "section" || route.name === "news" || route.name === "news_item" || route.name === "news_card" || route.name === "faq" || route.name === "admin") {
      return setRoute({ name: "home" });
    }
  };

  const signOut = () => {
    localStorage.setItem("access_ok", "0");
    localStorage.setItem("admin_ok", "0");
    setAdminOk(false);
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
      // Генерация кода
      let plainCode = codeForm.code.trim();
      if (!plainCode) {
        plainCode = Math.floor(100000 + Math.random() * 900000).toString();
      }

      // Проверка формата
      if (!/^\d{6}$/.test(plainCode)) {
        showToast("Код должен быть 6 цифр");
        return;
      }

      // Хешируем код
      const codeHash = await hashCode(plainCode);
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
                    Для получения кода доступа
                  </div>
                  <div style={{ 
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#6F00FF"
                  }}>
                    обратитесь к @alex_uzumm
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {route.name === "home" && (
          <div className="page">
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
                        onClick={() => {
                          setRoute({ name: "section", sectionId: s.id });
                          setMenuOpen(false);
                        }}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          marginBottom: "8px",
                          border: "2px solid rgba(111,0,255,.15)",
                          borderRadius: "12px",
                          background: "white",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          transition: "all .2s ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(111,0,255,.05)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                      >
                        <span style={{ fontSize: "24px" }}>{s.icon}</span>
                        <span style={{ fontWeight: 700, fontSize: "14px", color: "#111" }}>
                          {getSectionTitle(s)}
                        </span>
                      </button>
                    ))}
                    
                    <button
                      onClick={() => {
                        setRoute({ name: "faq" });
                        setMenuOpen(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        marginBottom: "8px",
                        border: "2px solid rgba(111,0,255,.15)",
                        borderRadius: "12px",
                        background: "#FFF8E8",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>❓</span>
                      <span style={{ fontWeight: 700, fontSize: "14px", color: "#111" }}>{t.faq}</span>
                    </button>
                  </div>
                  
                  <div style={{ 
                    padding: "16px", 
                    borderTop: "2px solid rgba(111,0,255,.15)",
                    background: "linear-gradient(145deg, #FFF8E8, #FFECD2)"
                  }}>
                    <button
                      onClick={() => {
                        signOut();
                        setMenuOpen(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "2px solid rgba(176,0,32,.2)",
                        borderRadius: "12px",
                        background: "#FFF8E8",
                        color: "#b00020",
                        fontWeight: 800,
                        fontSize: "14px",
                        cursor: "pointer"
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

            {/* Компактное приветствие */}
            <div style={{ 
              padding: "12px 16px",
              background: "linear-gradient(145deg, #FFF8E8, #FFECD2)",
              borderBottom: "2px solid rgba(111,0,255,.15)"
            }}>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#6F00FF", marginBottom: "2px" }}>
                {t.hello} {userName || "Гость"} 👋
              </div>
              <div style={{ fontSize: "12px", color: "rgba(0,0,0,.6)" }}>
                {new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : "uz-UZ", { weekday: "long", day: "numeric", month: "long" })}
              </div>
            </div>

            {/* Карусель разделов */}
            <div style={{ padding: "16px 0" }}>
              <div style={{ 
                fontSize: "14px", 
                fontWeight: 800, 
                color: "rgba(0,0,0,.7)", 
                padding: "0 16px 8px",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                {t.sections}
              </div>
              <div className="sectionList" ref={sectionListRef} onWheel={(e: any) => {
                const el = sectionListRef.current as HTMLDivElement | null;
                if (!el) return;
                el.scrollLeft += e.deltaY;
                e.preventDefault();
                window.requestAnimationFrame(() => handleSectionScroll());
              }} onScroll={() => handleSectionScroll()}>
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

            {/* Bottom Bar с FAQ */}
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
          <div className="page">
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

            <div className="headerBlock">
              <div className="h2">Профиль</div>
              <div className="sub">{userName || "Гость"}</div>
            </div>

            <div className="list">
              <div className="cardCream">
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                  <div style={{ 
                    width: "80px", 
                    height: "80px", 
                    borderRadius: "50%", 
                    background: "linear-gradient(135deg, #6F00FF, #9d4edd)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "40px"
                  }}>
                    {getRandomEmoji()}
                  </div>
                  <div>
                    <div style={{ fontSize: "20px", fontWeight: 900, color: "#111", marginBottom: "4px" }}>
                      {userName || "Гость"}
                    </div>
                    <div style={{ fontSize: "14px", color: "rgba(0,0,0,.6)" }}>
                      Пользователь
                    </div>
                  </div>
                </div>

                <div style={{ padding: "12px", background: "rgba(111,0,255,.05)", borderRadius: "12px", marginBottom: "12px" }}>
                  <div style={{ fontSize: "12px", color: "rgba(0,0,0,.6)", marginBottom: "4px" }}>
                    ID пользователя
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: 700 }}>
                    {(window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id || "—"}
                  </div>
                </div>

                <div style={{ padding: "12px", background: "rgba(111,0,255,.05)", borderRadius: "12px", marginBottom: "12px" }}>
                  <div style={{ fontSize: "12px", color: "rgba(0,0,0,.6)", marginBottom: "4px" }}>
                    Язык интерфейса
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>
                    {lang === "ru" ? "🇷🇺 Русский" : "🇺🇿 O'zbek"}
                  </div>
                </div>

                <button
                  className="btnPrimary"
                  onClick={signOut}
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #b00020, #d32f2f)",
                    marginTop: "8px"
                  }}
                >
                  {t.signOut}
                </button>
              </div>

              {adminOk && (
                <div className="cardCream">
                  <div style={{ fontSize: "16px", fontWeight: 900, marginBottom: "12px", color: "#6F00FF" }}>
                    ⚙️ Администрирование
                  </div>
                  <button
                    className="btnGhost"
                    onClick={() => setRoute({ name: "admin" })}
                    style={{ width: "100%", padding: "12px" }}
                  >
                    Панель администратора
                  </button>
                </div>
              )}
            </div>

            <BottomBar userName={userName} userPhoto="" onSignOut={signOut} />
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
                  style={{ textAlign: "left", display: "flex", gap: 12, alignItems: "center" }}
                  onClick={() => setRoute({ name: "section", sectionId: s.id })}
                >
                  <div className="sectionIconBox" style={{ flex: "0 0 auto" }}>
                    <div className="sectionIcon">{s.icon}</div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 950, color: "#111" }}>{getSectionTitle(s)}</div>
                    <div style={{ marginTop: 6, color: "rgba(0,0,0,.55)", fontSize: 13 }}>
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
                  {canFullAccess() && (
                    <button className="btnGhost" onClick={async () => { await runCrawl(); alert('Краулинг завершён'); }}>
                      🚀 Краулинг
                    </button>
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
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: "#111", marginBottom: "2px" }}>{s.title_ru}</div>
                          <div style={{ fontSize: "12px", color: "#666" }}>{s.title_uz}</div>
                        </div>
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
                          borderRadius: "8px"
                        }}>
                          <div style={{ fontWeight: 700, color: "#111", marginBottom: "4px" }}>{c.title_ru}</div>
                          <div style={{ fontSize: "12px", color: "#666", marginBottom: "2px" }}>{c.title_uz}</div>
                          {section && (
                            <div style={{ fontSize: "11px", color: "#999", marginTop: "6px" }}>
                              {section.icon} {section.title_ru}
                            </div>
                          )}
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
                        borderRadius: "8px"
                      }}>
                        <div style={{ fontWeight: 700, color: "#111", marginBottom: "4px" }}>
                          {n.pinned ? "📌 " : ""}
                          {n.title_ru}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666", marginBottom: "2px" }}>{n.title_uz}</div>
                        <div style={{ fontSize: "11px", color: "#999", marginTop: "6px" }}>
                          {new Date(n.published_at).toLocaleDateString("ru-RU")}
                        </div>
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
                          borderRadius: "8px"
                        }}>
                          <div style={{ fontWeight: 700, color: "#111", marginBottom: "6px" }}>{f.question_ru}</div>
                          <div style={{ fontSize: "13px", color: "#666", marginBottom: "10px" }}>{f.answer_ru}</div>
                          <div style={{ fontSize: "12px", color: "#999", marginBottom: "4px" }}>{f.question_uz}</div>
                          <div style={{ fontSize: "12px", color: "#999" }}>{f.answer_uz}</div>
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
