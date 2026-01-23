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
};

type NewsRow = {
  id: string;
  title_ru: string;
  title_uz: string;
  body_ru: string;
  body_uz: string;
  published_at: string;
  pinned: boolean;
};

const ADMIN_CODE = "SANYA4565"; // можно вводить Sanya4565 / sanya4565 и т.д.

const T = {
  ru: {
    welcome: "Добро\nпожаловать",
    enterCode: "Введите код доступа",
    acceptRules: "Принимаю правила пользования",
    continue: "Продолжить",
    search: "Поиск по разделам",
    hello: "Здравствуйте",
    sections: "Разделы",
    news: "Новости",
    back: "Назад",
    home: "Домой",
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
  },
  uz: {
    welcome: "Xush\nkelibsiz",
    enterCode: "Kirish kodini kiriting",
    acceptRules: "Foydalanish qoidalarini qabul qilaman",
    continue: "Davom etish",
    search: "Bo‘limlar bo‘yicha qidirish",
    hello: "Salom",
    sections: "Bo‘limlar",
    news: "Yangiliklar",
    back: "Orqaga",
    home: "Bosh sahifa",
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
  t: any;
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
      <button className="iconBtn" onClick={onBack} aria-label={t.back}>
        ←
      </button>

      {showSearch ? (
        <div className="searchWrap">
          <input className="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} />
        </div>
      ) : (
        <div className="searchWrap" style={{ justifyContent: "center" }}>
          <div style={{ fontWeight: 950 }}>{t.home}</div>
        </div>
      )}

      <div className="langSelectWrap">
        <select className="langSelect" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
          <option value="ru">RU</option>
          <option value="uz">UZ</option>
        </select>
      </div>

      <button className="iconBtn" onClick={onHome} aria-label={t.home}>
        ⌂
      </button>

      {rightSlot ? rightSlot : null}
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState<Lang>((localStorage.getItem("lang") as Lang) || "ru");
  const t = T[lang];

  const [route, setRoute] = useState<Route>(() => {
    const ok = localStorage.getItem("access_ok") === "1";
    return ok ? { name: "home" } : { name: "welcome" };
  });

  const [search, setSearch] = useState("");

  const [code, setCode] = useState("");
  const [rules, setRules] = useState(false);
  const [error, setError] = useState("");

  const [toast, setToast] = useState("");

  const [sections, setSections] = useState<SectionRow[]>([]);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [news, setNews] = useState<NewsRow[]>([]);

  const [adminOk, setAdminOk] = useState<boolean>(() => localStorage.getItem("admin_ok") === "1");

  // keep lang
  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  // toast helper
  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout((window as any).__toastTimer);
    (window as any).__toastTimer = window.setTimeout(() => setToast(""), 1200);
  };

  // Load public content
  const loadPublic = async () => {
    const s = await supabase.from("sections").select("*").order("sort", { ascending: true });
    const c = await supabase.from("cards").select("*").order("sort", { ascending: true });
    const n = await supabase.from("news").select("*").order("pinned", { ascending: false }).order("published_at", { ascending: false });

    if (!s.error) setSections((s.data ?? []) as SectionRow[]);
    if (!c.error) setCards((c.data ?? []) as CardRow[]);
    if (!n.error) setNews((n.data ?? []) as NewsRow[]);
  };

  useEffect(() => {
    loadPublic();
  }, []);

  // защитим админку (если вручную попадут на route admin)
  useEffect(() => {
    if (route.name === "admin" && !adminOk) {
      setRoute({ name: "home" });
    }
  }, [route.name, adminOk]);

  const filteredSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter((s) => (lang === "ru" ? s.title_ru : s.title_uz).toLowerCase().includes(q));
  }, [sections, search, lang]);

  const getSectionTitle = (s: SectionRow) => (lang === "ru" ? s.title_ru : s.title_uz);
  const getCardTitle = (c: CardRow) => (lang === "ru" ? c.title_ru : c.title_uz);
  const getCardBody = (c: CardRow) => (lang === "ru" ? c.body_ru : c.body_uz);

  const canContinue = code.trim().length > 0 && rules;

  const submitCode = async () => {
    if (!canContinue) return;

    const entered = code.trim().toUpperCase();

    // ✅ Админ-код: сразу открываем админку
    if (entered === ADMIN_CODE) {
      setError("");
      localStorage.setItem("access_ok", "1");
      localStorage.setItem("admin_ok", "1");
      setAdminOk(true);
      setRoute({ name: "admin" });
      return;
    }

    // Обычный пользователь — проверка через Supabase
    const resp = await supabase
      .from("access_codes")
      .select("code,is_active,expires_at")
      .eq("code", entered)
      .limit(1);

    if (resp.error || !resp.data || resp.data.length === 0) {
      setError(t.invalidCode);
      return;
    }

    const row = resp.data[0] as { is_active: boolean; expires_at: string | null };

    if (!row.is_active) {
      setError(t.invalidCode);
      return;
    }
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
      setError(t.invalidCode);
      return;
    }

    setError("");
    localStorage.setItem("access_ok", "1");
    localStorage.removeItem("admin_ok");
    setAdminOk(false);
    setRoute({ name: "home" });
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
    if (route.name === "section" || route.name === "news" || route.name === "admin") return setRoute({ name: "home" });
    if (route.name === "home") return setRoute({ name: "welcome" });
  };

  // ---------- Admin UI helpers ----------
  const [adminTab, setAdminTab] = useState<"sections" | "cards" | "news" | "codes">("sections");

  const [secForm, setSecForm] = useState({ key: "", title_ru: "", title_uz: "", icon: "📄", sort: 100 });
  const [cardForm, setCardForm] = useState({ section_id: "", title_ru: "", title_uz: "", body_ru: "", body_uz: "", sort: 100 });
  const [newsForm, setNewsForm] = useState({
    title_ru: "",
    title_uz: "",
    body_ru: "",
    body_uz: "",
    published_at: new Date().toISOString().slice(0, 10),
    pinned: false,
  });
  const [codeForm, setCodeForm] = useState({ code: "", is_active: true, expires_at: "", note: "" });

  const adminSignOut = async () => {
    localStorage.removeItem("admin_ok");
    setAdminOk(false);
    showToast("Ок");
    setRoute({ name: "home" });
  };

  const adminSaveSection = async () => {
    const resp = await supabase.from("sections").insert(secForm as any);
    if (resp.error) {
      showToast("Ошибка");
      return;
    }
    showToast("Ок");
    setSecForm({ key: "", title_ru: "", title_uz: "", icon: "📄", sort: 100 });
    await loadPublic();
  };

  const adminDeleteSection = async (id: string) => {
    const resp = await supabase.from("sections").delete().eq("id", id);
    if (resp.error) {
      showToast("Ошибка");
      return;
    }
    showToast("Ок");
    await loadPublic();
  };

  const adminSaveCard = async () => {
    const resp = await supabase.from("cards").insert({ ...cardForm, updated_at: new Date().toISOString() } as any);
    if (resp.error) {
      showToast("Ошибка");
      return;
    }
    showToast("Ок");
    setCardForm({ section_id: "", title_ru: "", title_uz: "", body_ru: "", body_uz: "", sort: 100 });
    await loadPublic();
  };

  const adminDeleteCard = async (id: string) => {
    const resp = await supabase.from("cards").delete().eq("id", id);
    if (resp.error) {
      showToast("Ошибка");
      return;
    }
    showToast("Ок");
    await loadPublic();
  };

  const adminSaveNews = async () => {
    const resp = await supabase.from("news").insert(newsForm as any);
    if (resp.error) {
      showToast("Ошибка");
      return;
    }
    showToast("Ок");
    setNewsForm({
      title_ru: "",
      title_uz: "",
      body_ru: "",
      body_uz: "",
      published_at: new Date().toISOString().slice(0, 10),
      pinned: false,
    });
    await loadPublic();
  };

  const adminDeleteNews = async (id: string) => {
    const resp = await supabase.from("news").delete().eq("id", id);
    if (resp.error) {
      showToast("Ошибка");
      return;
    }
    showToast("Ок");
    await loadPublic();
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
      showToast("Ошибка");
      return;
    }
    showToast("Ок");
    setCodeForm({ code: "", is_active: true, expires_at: "", note: "" });
  };

  // ---------- UI ----------
  return (
    <div className="app">
      <div className="phone">
        {route.name === "welcome" && (
          <div className="page">
            <div className="center">
              <div className="logoBox">
                <img className="logoImg" src="/assets/uzum-logo.png" alt="Uzum" />
              </div>

              <div className="h1">{t.welcome}</div>

              <div className="cardCream">
                <div style={{ fontWeight: 950, marginBottom: 8 }}>{t.enterCode}</div>
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

                <label className="row" style={{ marginTop: 10, color: "rgba(20,18,26,.88)" }}>
                  <input
                    type="checkbox"
                    checked={rules}
                    onChange={(e) => {
                      setRules(e.target.checked);
                      if (error) setError("");
                    }}
                    style={{ width: 20, height: 20, accentColor: "#6F00FF" }}
                  />
                  <span style={{ fontWeight: 900 }}>{t.acceptRules}</span>
                </label>

                {error ? <div style={{ marginTop: 8, color: "#b00020", fontWeight: 950 }}>{error}</div> : null}

                <button
                  className="btnPrimary"
                  style={{ marginTop: 12, opacity: canContinue ? 1 : 0.5, cursor: canContinue ? "pointer" : "not-allowed" }}
                  onClick={submitCode}
                >
                  {t.continue}
                </button>
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
            />

            <div className="headerBlock">
              <div className="h2">{t.hello}, Авьясов А.</div>
              <div className="sub">{t.sections}</div>
            </div>

            <div className="blockTitle">{t.sections}</div>
            <div className="sectionList">
              {filteredSections.map((s) => (
                <button key={s.id} className="sectionRow" onClick={() => setRoute({ name: "section", sectionId: s.id })}>
                  <div className="sectionIcon">{s.icon}</div>

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

                  <div className="sectionMeta">
                    {news[0]?.published_at ? news[0].published_at.split("-").reverse().slice(0, 2).join(".") : ""}
                  </div>
                </button>
              ))}

              <button className="sectionRow" onClick={() => setRoute({ name: "news" })}>
                <div className="sectionIcon">📰</div>
                <div className="sectionText">
                  <div className="sectionTitle">{t.news}</div>
                  <div className="sectionSub">{news[0] ? (lang === "ru" ? news[0].title_ru : news[0].title_uz) : "—"}</div>
                </div>
                <div className="sectionMeta">
                  {news[0]?.published_at ? news[0].published_at.split("-").reverse().slice(0, 2).join(".") : ""}
                </div>
              </button>
            </div>

            <div className="blockTitle">{t.news}</div>
            <div className="list">
              {news.slice(0, 2).map((n) => (
                <div key={n.id} className="cardCream">
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 950 }}>{lang === "ru" ? n.title_ru : n.title_uz}</div>
                    <div style={{ opacity: 0.65, fontWeight: 950 }}>{n.published_at.split("-").reverse().slice(0, 2).join(".")}</div>
                  </div>
                  <div style={{ marginTop: 8, opacity: 0.85, lineHeight: 1.35 }}>{lang === "ru" ? n.body_ru : n.body_uz}</div>
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
              <div className="h2">{getSectionTitle(sections.find((s) => s.id === route.sectionId) as SectionRow)}</div>
              <div className="sub">Карточки</div>
            </div>

            <div className="list">
              {cards
                .filter((c) => c.section_id === route.sectionId)
                .sort((a, b) => a.sort - b.sort)
                .map((c) => (
                  <div key={c.id} className="cardCream">
                    <div style={{ fontWeight: 950 }}>{getCardTitle(c)}</div>
                    <div style={{ marginTop: 8, opacity: 0.85, lineHeight: 1.35, whiteSpace: "pre-wrap" }}>
                      {getCardBody(c).split("\n").slice(0, 3).join("\n")}
                      {getCardBody(c).split("\n").length > 3 ? "\n..." : ""}
                    </div>

                    <div className="split" style={{ marginTop: 12 }}>
                      <button className="smallBtn" onClick={() => setRoute({ name: "card", cardId: c.id })}>
                        Открыть
                      </button>
                      <button className="btnPrimary" onClick={() => copyText(getCardBody(c))}>
                        {t.copyAll}
                      </button>
                    </div>
                  </div>
                ))}
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
                <div style={{ padding: 14 }}>
                  <div className="h2">{getCardTitle(c)}</div>
                  <div className="cardCream" style={{ marginTop: 12 }}>
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{body}</pre>
                    <button className="btnPrimary" style={{ marginTop: 12 }} onClick={() => copyText(body)}>
                      {t.copyAll}
                    </button>
                  </div>
                </div>
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
              <div className="sub">Все новости</div>
            </div>

            <div className="list">
              {news.map((n) => (
                <div key={n.id} className="cardCream">
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 950 }}>
                      {n.pinned ? "📌 " : ""}
                      {lang === "ru" ? n.title_ru : n.title_uz}
                    </div>
                    <div style={{ opacity: 0.65, fontWeight: 950 }}>{n.published_at.split("-").reverse().slice(0, 2).join(".")}</div>
                  </div>
                  <div style={{ marginTop: 8, opacity: 0.85, lineHeight: 1.35, whiteSpace: "pre-wrap" }}>
                    {lang === "ru" ? n.body_ru : n.body_uz}
                  </div>
                </div>
              ))}
            </div>
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
                <button className="smallBtn" onClick={adminSignOut}>
                  {t.signOut}
                </button>
              }
            />

            <div style={{ padding: 14 }}>
              <div className="h2">{t.admin}</div>

              <div className="row" style={{ marginTop: 12 }}>
                <button className="smallBtn" onClick={() => setAdminTab("sections")}>
                  {t.manageSections}
                </button>
                <button className="smallBtn" onClick={() => setAdminTab("cards")}>
                  {t.manageCards}
                </button>
                <button className="smallBtn" onClick={() => setAdminTab("news")}>
                  {t.manageNews}
                </button>
                <button className="smallBtn" onClick={() => setAdminTab("codes")}>
                  {t.manageCodes}
                </button>
              </div>

              {/* SECTIONS */}
              {adminTab === "sections" && (
                <div className="cardCream" style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 950, marginBottom: 10 }}>{t.manageSections}</div>

                  <div className="split">
                    <input
                      className="input"
                      placeholder="key (например docs)"
                      value={secForm.key}
                      onChange={(e) => setSecForm({ ...secForm, key: e.target.value })}
                    />
                    <input className="input" placeholder={t.icon} value={secForm.icon} onChange={(e) => setSecForm({ ...secForm, icon: e.target.value })} />
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

                  <div style={{ marginTop: 14, fontWeight: 950 }}>Список</div>
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                    {sections.map((s) => (
                      <div key={s.id} className="row" style={{ justifyContent: "space-between" }}>
                        <div style={{ fontWeight: 950 }}>
                          {s.icon} {s.title_ru}
                        </div>
                        <button className="smallBtn" onClick={() => adminDeleteSection(s.id)}>
                          {t.delete}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CARDS */}
              {adminTab === "cards" && (
                <div className="cardCream" style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 950, marginBottom: 10 }}>{t.manageCards}</div>

                  <select className="input" value={cardForm.section_id} onChange={(e) => setCardForm({ ...cardForm, section_id: e.target.value })}>
                    <option value="">Выбери раздел</option>
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
                      style={{ height: 120, paddingTop: 12 }}
                      placeholder={t.bodyRu}
                      value={cardForm.body_ru}
                      onChange={(e) => setCardForm({ ...cardForm, body_ru: e.target.value })}
                    />
                    <textarea
                      className="input"
                      style={{ height: 120, paddingTop: 12 }}
                      placeholder={t.bodyUz}
                      value={cardForm.body_uz}
                      onChange={(e) => setCardForm({ ...cardForm, body_uz: e.target.value })}
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

                  <div style={{ marginTop: 14, fontWeight: 950 }}>Список</div>
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                    {cards.map((c) => (
                      <div key={c.id} className="row" style={{ justifyContent: "space-between" }}>
                        <div style={{ fontWeight: 950 }}>{c.title_ru}</div>
                        <button className="smallBtn" onClick={() => adminDeleteCard(c.id)}>
                          {t.delete}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NEWS */}
              {adminTab === "news" && (
                <div className="cardCream" style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 950, marginBottom: 10 }}>{t.manageNews}</div>

                  <div className="split">
                    <input className="input" placeholder={t.titleRu} value={newsForm.title_ru} onChange={(e) => setNewsForm({ ...newsForm, title_ru: e.target.value })} />
                    <input className="input" placeholder={t.titleUz} value={newsForm.title_uz} onChange={(e) => setNewsForm({ ...newsForm, title_uz: e.target.value })} />
                  </div>

                  <div className="split" style={{ marginTop: 10 }}>
                    <textarea
                      className="input"
                      style={{ height: 120, paddingTop: 12 }}
                      placeholder={t.bodyRu}
                      value={newsForm.body_ru}
                      onChange={(e) => setNewsForm({ ...newsForm, body_ru: e.target.value })}
                    />
                    <textarea
                      className="input"
                      style={{ height: 120, paddingTop: 12 }}
                      placeholder={t.bodyUz}
                      value={newsForm.body_uz}
                      onChange={(e) => setNewsForm({ ...newsForm, body_uz: e.target.value })}
                    />
                  </div>

                  <div className="split" style={{ marginTop: 10 }}>
                    <input className="input" placeholder={t.date} value={newsForm.published_at} onChange={(e) => setNewsForm({ ...newsForm, published_at: e.target.value })} />
                    <label className="row" style={{ color: "rgba(20,18,26,.85)" }}>
                      <input type="checkbox" checked={newsForm.pinned} onChange={(e) => setNewsForm({ ...newsForm, pinned: e.target.checked })} />
                      <span style={{ fontWeight: 950 }}>{t.pinned}</span>
                    </label>
                  </div>

                  <button className="btnPrimary" style={{ marginTop: 10 }} onClick={adminSaveNews}>
                    {t.add}
                  </button>

                  <div style={{ marginTop: 14, fontWeight: 950 }}>Список</div>
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                    {news.map((n) => (
                      <div key={n.id} className="row" style={{ justifyContent: "space-between" }}>
                        <div style={{ fontWeight: 950 }}>
                          {n.pinned ? "📌 " : ""}
                          {n.title_ru}
                        </div>
                        <button className="smallBtn" onClick={() => adminDeleteNews(n.id)}>
                          {t.delete}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CODES */}
              {adminTab === "codes" && (
                <div className="cardCream" style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 950, marginBottom: 10 }}>{t.manageCodes}</div>

                  <div className="split">
                    <input className="input" placeholder={t.code} value={codeForm.code} onChange={(e) => setCodeForm({ ...codeForm, code: e.target.value })} />
                    <input className="input" placeholder={t.note} value={codeForm.note} onChange={(e) => setCodeForm({ ...codeForm, note: e.target.value })} />
                  </div>

                  <div className="split" style={{ marginTop: 10 }}>
                    <input className="input" placeholder={t.expiresAt} value={codeForm.expires_at} onChange={(e) => setCodeForm({ ...codeForm, expires_at: e.target.value })} />
                    <label className="row" style={{ color: "rgba(20,18,26,.85)" }}>
                      <input type="checkbox" checked={codeForm.is_active} onChange={(e) => setCodeForm({ ...codeForm, is_active: e.target.checked })} />
                      <span style={{ fontWeight: 950 }}>{t.active}</span>
                    </label>
                  </div>

                  <button className="btnPrimary" style={{ marginTop: 10 }} onClick={adminSaveCode}>
                    {t.save}
                  </button>

                  <div style={{ marginTop: 14, fontWeight: 950 }}>Примечание: список кодов видит только админ (это нормально).</div>
                </div>
              )}
            </div>
          </div>
        )}

        {toast ? <div className="toast">{toast}</div> : null}
      </div>
    </div>
  );
}
