import { type ReactNode, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import "./App.css";

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

const ADMIN_CODE = "SANYA4565"; // ввод без учета регистра: Sanya4565 / sanya4565 / SANYA4565

const FACE_EMOJIS = ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "😑", "😐", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤮", "🤢", "🤮", "🤮", "🤮", "🤮", "🤮", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁", "☹️", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾"];

const getRandomEmoji = () => FACE_EMOJIS[Math.floor(Math.random() * FACE_EMOJIS.length)];

const T = {
  ru: {
    welcome: "Добро\nпожаловать",
    enterCode: "Введите код доступа",
    acceptRules: "Принимаю правила пользования",
    continue: "Продолжить",
    search: "Поиск по разделам",
    hello: "Здравствуйте",
    sections: "РАЗДЕЛЫ",
    news: "НОВОСТИ",
    back: "Назад",
    home: "Домой",
    open: "Открыть",
    copyAll: "Скопировать всё",
    copied: "Скопировано",
    invalidCode: "Неверный код доступа",
    admin: "Админ",
    manageSections: "Разделы",
    manageCards: "Карточки",
    manageNews: "Новости",
    manageCodes: "Коды доступа",
    save: "Сохранить",
    add: "Добавить",
    delete: "Удалить",
    titleRu: "Заголовок (RU)",
    titleUz: "Заголовок (UZ)",
    bodyRu: "Текст (RU)",
    bodyUz: "Текст (UZ)",
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
    search: "Bo‘limlar bo‘yicha qidirish",
    hello: "Salom",
    sections: "BO‘LIMLAR",
    news: "YANGILIKLAR",
    back: "Orqaga",
    home: "Bosh sahifa",
    open: "Ochish",
    copyAll: "Hammasini nusxalash",
    copied: "Nusxalandi",
    invalidCode: "Kod noto‘g‘ri",
    admin: "Admin",
    manageSections: "Bo‘limlar",
    manageCards: "Kartochkalar",
    manageNews: "Yangiliklar",
    manageCodes: "Kirish kodlari",
    save: "Saqlash",
    add: "Qo‘shish",
    delete: "O‘chirish",
    titleRu: "Sarlavha (RU)",
    titleUz: "Sarlavha (UZ)",
    bodyRu: "Matn (RU)",
    bodyUz: "Matn (UZ)",
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
    allNews: "Barcha yangiliklar",
    chooseSection: "Bo‘limni tanlang",
    ok: "Ok",
    error: "Xato",
  },
} as const;

type Route =
  | { name: "welcome" }
  | { name: "home" }
  | { name: "section"; sectionId: string }
  | { name: "card"; cardId: string }
  | { name: "news" }
  | { name: "admin" };

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
}) {
  const { t, lang, setLang, showSearch, search, setSearch, onBack, onHome, rightSlot } = props;

  return (
    <div className="topbar">
      <button className="smallIconBtn" onClick={onBack} aria-label={t.back}>
        ←
      </button>

      {showSearch ? (
        <div className="searchWrap">
          <input
            className="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
          />
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

      <button className="smallIconBtn" onClick={onHome} aria-label={t.home}>
        ⌂
      </button>

      {rightSlot ? rightSlot : null}
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
    <div className="bottombar">
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

  const [sections, setSections] = useState<SectionRow[]>([]);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [news, setNews] = useState<NewsRow[]>([]);

  const [adminOk, setAdminOk] = useState<boolean>(() => localStorage.getItem("admin_ok") === "1");
  const [userName, setUserName] = useState<string>(() => localStorage.getItem("user_name") || "");

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

    console.log("[DATA] Sections:", s.error ? `✗ ${s.error.message}` : `✓ ${s.data?.length || 0}`);
    console.log("[DATA] Cards:", c.error ? `✗ ${c.error.message}` : `✓ ${c.data?.length || 0}`);
    console.log("[DATA] News:", n.error ? `✗ ${n.error.message}` : `✓ ${n.data?.length || 0}`);

    if (!s.error) setSections((s.data ?? []) as SectionRow[]);
    if (!c.error) setCards((c.data ?? []) as CardRow[]);
    if (!n.error) setNews((n.data ?? []) as NewsRow[]);
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

  const getSectionTitle = (s: SectionRow) => (lang === "ru" ? s.title_ru : s.title_uz);
  const getCardTitle = (c: CardRow) => (lang === "ru" ? c.title_ru : c.title_uz);
  const getCardBody = (c: CardRow) => (lang === "ru" ? c.body_ru : c.body_uz);

  const canContinue = code.trim().length > 0 && rules;

  const submitCode = async () => {
    if (!canContinue) return;

    const entered = code.trim().toUpperCase();
    console.log("[CODE] Checking code:", entered);

    // ADMIN: open admin immediately, no button needed
    if (entered === ADMIN_CODE) {
      console.log("[CODE] Admin code matched");
      setError("");
      localStorage.setItem("access_ok", "1");
      localStorage.setItem("admin_ok", "1");
      setAdminOk(true);
      setRoute({ name: "admin" });
      return;
    }

    // user access codes via Supabase
    try {
      const resp = await supabase
        .from("access_codes")
        .select("code,is_active,expires_at")
        .eq("code", entered)
        .limit(1);

      console.log("[CODE] Supabase response:", resp);

      if (resp.error || !resp.data || resp.data.length === 0) {
        console.log("[CODE] Code not found or error");
        setError(t.invalidCode);
        return;
      }

      const row = resp.data[0] as { is_active: boolean; expires_at: string | null };
      console.log("[CODE] Code found:", row);

      if (!row.is_active) {
        console.log("[CODE] Code is inactive");
        setError(t.invalidCode);
        return;
      }
      if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
        console.log("[CODE] Code expired");
        setError(t.invalidCode);
        return;
      }

      console.log("[CODE] Code valid, granting access");
      setError("");
      localStorage.setItem("access_ok", "1");
      localStorage.removeItem("admin_ok");
      setAdminOk(false);
      setRoute({ name: "home" });
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
    if (route.name === "section" || route.name === "news" || route.name === "admin") {
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
  const [adminTab, setAdminTab] = useState<"sections" | "cards" | "news" | "codes">("sections");

  const [secForm, setSecForm] = useState({ key: "", title_ru: "", title_uz: "", icon: "📄", sort: 100 });
  const [cardForm, setCardForm] = useState({
    section_id: "",
    title_ru: "",
    title_uz: "",
    body_ru: "",
    body_uz: "",
    sort: 100,
    file_url: "",
  });
  const [newsForm, setNewsForm] = useState({
    title_ru: "",
    title_uz: "",
    body_ru: "",
    body_uz: "",
    published_at: new Date().toISOString().slice(0, 10),
    pinned: false,
    image_url: "",
  });
  const [codeForm, setCodeForm] = useState({ code: "", is_active: true, expires_at: "", note: "" });
  const [accessCodes, setAccessCodes] = useState<any[]>([]);

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
    const resp = await supabase.from("cards").insert({ ...cardForm, updated_at: new Date().toISOString() } as any);
    if (resp.error) {
      showToast(t.error);
      return;
    }
    showToast(t.ok);
    setCardForm({ section_id: "", title_ru: "", title_uz: "", body_ru: "", body_uz: "", sort: 100, file_url: "" });
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

  const loadAccessCodes = async () => {
    const resp = await supabase.from("access_codes").select("code,is_active,expires_at,note").order("expires_at", { ascending: false });
    if (resp.error) return;
    setAccessCodes((resp.data ?? []) as any[]);
  };

  useEffect(() => {
    if (adminTab === "codes") loadAccessCodes();
  }, [adminTab]);

  const updateAccessCode = async (codeKey: string, patch: any) => {
    const resp = await supabase.from("access_codes").update(patch).eq("code", codeKey);
    if (resp.error) {
      showToast(t.error);
      return;
    }
    showToast(t.ok);
    await loadAccessCodes();
  };

  const deleteAccessCode = async (codeKey: string) => {
    const resp = await supabase.from("access_codes").delete().eq("code", codeKey);
    if (resp.error) {
      showToast(t.error);
      return;
    }
    showToast(t.ok);
    await loadAccessCodes();
  };

  const adminSaveCode = async () => {
    const payload: any = {
      code: codeForm.code.trim().toUpperCase(),
      is_active: codeForm.is_active,
      note: codeForm.note || null,
      expires_at: codeForm.expires_at ? new Date(codeForm.expires_at).toISOString() : null,
    };
    const resp = await supabase.from("access_codes").upsert(payload as any);
    if (resp.error) {
      showToast(t.error);
      return;
    }
    showToast(t.ok);
    setCodeForm({ code: "", is_active: true, expires_at: "", note: "" });
    await loadAccessCodes();
  };

  const fmtDM = (iso: string) => {
    // ISO yyyy-mm-dd -> dd.mm
    const parts = iso.split("-");
    if (parts.length !== 3) return iso;
    return `${parts[2]}.${parts[1]}`;
  };

  // ---------- UI ----------
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
          <div className="page">
            <div className="center">
              <div className="logoBox">
                <img className="logoImg" src="/assets/uzum-logo.png" alt="Uzum" />
              </div>

              <div className="h1">{t.welcome}</div>

              <div className="cardCream">
                <div style={{ fontWeight: 950, marginBottom: 10 }}>{t.enterCode}</div>

                <input
                  className="input"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if (error) setError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitCode();
                  }}
                />

                {/* Правила пользования - accordion */}
                <div style={{ marginTop: 12 }}>
                  <button 
                    className="rulesToggle"
                    onClick={() => setRulesExpanded(!rulesExpanded)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "2px solid rgba(111,0,255,.3)",
                      borderRadius: "12px",
                      background: "transparent",
                      color: "rgba(20,18,26,.8)",
                      fontWeight: 900,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 13,
                      transition: "all .3s ease"
                    }}
                  >
                    <span>📋 Правила пользования</span>
                    <span style={{ 
                      fontSize: 16, 
                      transition: "transform .3s ease", 
                      transform: rulesExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      display: "inline-block"
                    }}>▼</span>
                  </button>
                  
                  {rulesExpanded && (
                    <div className="rulesContent" style={{
                      marginTop: 10,
                      padding: "10px",
                      background: "rgba(111,0,255,.05)",
                      borderRadius: 8,
                      animation: "slideDown 0.3s ease"
                    }}>
                      <ul style={{ margin: "0 0 0 20px", paddingLeft: 0, fontSize: 12, color: "rgba(20,18,26,.7)", lineHeight: 1.8 }}>
                        <li>Соблюдайте законодательство Узбекистана</li>
                        <li>Не распространяйте коды доступа третьим лицам</li>
                        <li>Используйте информацию только в личных целях</li>
                        <li>Не копируйте и не воспроизводите контент</li>
                        <li>Администратор имеет право отключить доступ в любой момент</li>
                      </ul>
                    </div>
                  )}
                </div>

                <label className="row" style={{ marginTop: 12, color: "rgba(20,18,26,.88)" }}>
                  <input
                    type="checkbox"
                    checked={rules}
                    onChange={(e) => {
                      setRules(e.target.checked);
                      if (error) setError("");
                    }}
                    style={{ width: 20, height: 20, accentColor: "#6F00FF" }}
                  />
                  <span style={{ fontWeight: 900 }}>Согласен с правилами</span>
                </label>

                {error ? (
                  <div style={{ marginTop: 10, color: "#b00020", fontWeight: 950 }}>{error}</div>
                ) : null}

                <button
                  className="btnPrimary"
                  style={{
                    marginTop: 14,
                    opacity: canContinue ? 1 : 0.55,
                    cursor: canContinue ? "pointer" : "not-allowed",
                    width: "100%",
                  }}
                  onClick={submitCode}
                >
                  {t.continue}
                </button>

                <div style={{
                  marginTop: 24,
                  padding: "12px",
                  background: "rgba(111,0,255,.08)",
                  borderRadius: 8,
                  textAlign: "center",
                  fontSize: 12,
                  color: "rgba(20,18,26,.7)",
                  lineHeight: 1.6
                }}>
                  <div>Для получения кода доступа</div>
                  <div style={{ fontWeight: 900, color: "#6F00FF", marginTop: 4 }}>
                    обратитесь к <strong>@alex_uzumm</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {route.name === "home" && (
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
              rightSlot={undefined}
            />

            <div className="headerBlock">
              <div className="h2">{t.hello} {userName || "Гость"}</div>
              <div className="sub">{t.sections}</div>
            </div>

            <div className="sectionList">
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

            {/* на главном — только последние 4, остальное в "Новости" */}
            <div className="blockTitle">{t.news}</div>
            <div className="list">
              {news.slice(0, 4).map((n) => (
                <div key={n.id} className="cardCream">
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <div className="newsTitle">
                      {n.pinned ? "📌 " : ""}
                      {lang === "ru" ? n.title_ru : n.title_uz}
                    </div>
                    <div className="newsMeta">{fmtDM(n.published_at)}</div>
                  </div>
                  <div className="newsBody">{lang === "ru" ? n.body_ru : n.body_uz}</div>
                </div>
              ))}
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
                    <div key={c.id} className="cardCream">
                      <div className="cardTitle">{getCardTitle(c)}</div>

                      <div className="cardPreview">
                        {preview}
                        {hasMore ? "\n..." : ""}
                      </div>

                      <div className="cardActions">
                        <button className="btnGhost" onClick={() => setRoute({ name: "card", cardId: c.id })}>
                          {t.open}
                        </button>
                        <button className="btnPrimary" onClick={() => copyText(body)}>
                          {t.copyAll}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
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
                    </div>
                  </div>
                </>
              );
            })()}
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

            <div className="list">
              {news.map((n) => (
                <div key={n.id} className="cardCream">
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
                        maxHeight: 300,
                      }}
                    />
                  )}

                  <div className="newsBody">{lang === "ru" ? n.body_ru : n.body_uz}</div>
                </div>
              ))}
            </div>

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
              onBack={goBack}
              onHome={goHome}
              rightSlot={
                <button className="btnGhost" onClick={adminSignOut}>
                  {t.signOut}
                </button>
              }
            />

            <div className="headerBlock">
              <div className="h2">{t.admin}</div>
              <div className="sub">{t.manageSections}</div>
            </div>

            <div className="list">
              <div className="cardCream">
                <div className="row" style={{ flexWrap: "wrap" }}>
                  <button className="btnGhost" onClick={() => setAdminTab("sections")}>
                    {t.manageSections}
                  </button>
                  <button className="btnGhost" onClick={() => setAdminTab("cards")}>
                    {t.manageCards}
                  </button>
                  <button className="btnGhost" onClick={() => setAdminTab("news")}>
                    {t.manageNews}
                  </button>
                  <button className="btnGhost" onClick={() => setAdminTab("codes")}>
                    {t.manageCodes}
                  </button>
                </div>
              </div>

              {adminTab === "sections" && (
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
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                    {sections.map((s) => (
                      <div key={s.id} className="row" style={{ justifyContent: "space-between" }}>
                        <div style={{ fontWeight: 950, color: "#111" }}>
                          {s.icon} {s.title_ru}
                        </div>
                        <button className="btnGhost" onClick={() => adminDeleteSection(s.id)}>
                          {t.delete}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adminTab === "cards" && (
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

                  <div className="split" style={{ marginTop: 10 }}>
                    <input
                      className="input"
                      placeholder={t.sort}
                      value={String(cardForm.sort)}
                      onChange={(e) => setCardForm({ ...cardForm, sort: Number(e.target.value || 100) })}
                    />
                    <button className="btnPrimary" onClick={adminSaveCard}>
                      {t.add}
                    </button>
                  </div>

                  <div style={{ marginTop: 16, fontWeight: 950 }}>Список</div>
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                    {cards.map((c) => (
                      <div key={c.id} className="row" style={{ justifyContent: "space-between" }}>
                        <div style={{ fontWeight: 950, color: "#111" }}>{c.title_ru}</div>
                        <button className="btnGhost" onClick={() => adminDeleteCard(c.id)}>
                          {t.delete}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adminTab === "news" && (
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
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                    {news.map((n) => (
                      <div key={n.id} className="row" style={{ justifyContent: "space-between" }}>
                        <div style={{ fontWeight: 950, color: "#111" }}>
                          {n.pinned ? "📌 " : ""}
                          {n.title_ru}
                        </div>
                        <button className="btnGhost" onClick={() => adminDeleteNews(n.id)}>
                          {t.delete}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adminTab === "codes" && (
                <div className="cardCream">
                  <div style={{ fontWeight: 950, marginBottom: 12 }}>{t.manageCodes}</div>

                  <div className="split">
                    <input
                      className="input"
                      placeholder={t.code}
                      value={codeForm.code}
                      onChange={(e) => setCodeForm({ ...codeForm, code: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder={t.note}
                      value={codeForm.note}
                      onChange={(e) => setCodeForm({ ...codeForm, note: e.target.value })}
                    />
                  </div>

                  <div className="split" style={{ marginTop: 10, alignItems: "center" }}>
                    <input
                      className="input"
                      type="datetime-local"
                      placeholder={t.expiresAt}
                      value={codeForm.expires_at}
                      onChange={(e) => setCodeForm({ ...codeForm, expires_at: e.target.value })}
                    />
                    <label className="row" style={{ color: "rgba(20,18,26,.85)" }}>
                      <input
                        type="checkbox"
                        checked={codeForm.is_active}
                        onChange={(e) => setCodeForm({ ...codeForm, is_active: e.target.checked })}
                      />
                      <span style={{ fontWeight: 950 }}>{t.active}</span>
                    </label>
                  </div>

                  <button className="btnPrimary" style={{ marginTop: 12, width: "100%" }} onClick={adminSaveCode}>
                    {t.save}
                  </button>

                  <div style={{ marginTop: 16, fontWeight: 950, fontSize: 14 }}>Список кодов ({accessCodes.length})</div>
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
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
                          <div key={ac.code} className="cardCream" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 16, color: "#111", letterSpacing: 1 }}>
                                {ac.code}
                              </div>
                              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                <span style={{ 
                                  padding: "4px 10px", 
                                  borderRadius: 6, 
                                  fontSize: 11, 
                                  fontWeight: 900,
                                  background: ac.is_active ? (isExpired ? "#fff3cd" : "#d4edda") : "#f8d7da",
                                  color: ac.is_active ? (isExpired ? "#856404" : "#155724") : "#721c24"
                                }}>
                                  {!ac.is_active ? "НЕАКТИВ" : isExpired ? "ИСТЁК" : "АКТИВЕН"}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: 10, fontSize: 13, color: "rgba(0,0,0,.6)" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, marginBottom: 2 }}>Срок:</div>
                                {expiresDate ? expiresDate.toLocaleDateString("ru-RU") : "Неограничен"}
                                {daysLeft !== null && daysLeft > 0 && (
                                  <div style={{ fontSize: 11, color: "rgba(0,0,0,.5)", marginTop: 2 }}>
                                    ({daysLeft} дн. осталось)
                                  </div>
                                )}
                              </div>
                              {ac.note && (
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 700, marginBottom: 2 }}>Заметка:</div>
                                  {ac.note}
                                </div>
                              )}
                            </div>

                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                              <input
                                className="input"
                                type="datetime-local"
                                value={ac.expires_at ? new Date(ac.expires_at).toISOString().slice(0,16) : ""}
                                onChange={(e) => updateAccessCode(ac.code, { expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                                style={{ flex: 1, minWidth: 140, height: 32, fontSize: 12 }}
                              />
                              <label style={{ display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap", padding: "6px 8px", background: "rgba(0,0,0,.02)", borderRadius: 6, cursor: "pointer" }}>
                                <input type="checkbox" checked={ac.is_active} onChange={() => updateAccessCode(ac.code, { is_active: !ac.is_active })} style={{ cursor: "pointer" }} />
                                <span style={{ fontWeight: 700, fontSize: 11 }}>Акт.</span>
                              </label>
                              <button className="btnGhost" onClick={() => deleteAccessCode(ac.code)} style={{ padding: "6px 10px", fontSize: 11, flexShrink: 0 }}>
                                {t.delete}
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
            </div>
          </div>
        )}

        {route.name !== "welcome" ? (
          <BottomBar userName={userName} userPhoto="" onSignOut={signOut} />
        ) : null}

        {toast ? <div className="toast">{toast}</div> : null}
      </div>
    </div>
  );
}
