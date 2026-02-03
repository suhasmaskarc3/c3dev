/**
 * Weather Widget
 *
 * This file is intentionally self-contained: it mounts a React widget into
 * `#weather-widget-root` and can be embedded into other pages.
 *
 * Integration points:
 * - URL params: `?facilityCity=...&facilityState=...`
 * - CustomEvent: dispatch `facilitySelected` with `{ serviceCity, serviceState }`
 * - CustomEvent: dispatch `facilityListUpdated` with an array of facilities (or locations)
 * - Imperative API: `window.updateWeatherFromFacility(facility)` convenience wrapper
 * - Imperative API: `window.setWeatherFacilityList(facilities)` convenience wrapper
 *
 * The widget:
 * - Fetches current weather via OpenWeatherMap
 * - Uses OWM `lang` parameter for localized weather descriptions
 * - Localizes *UI chrome strings* via `UI_LABELS` in this file
 * - Optionally localizes city display names via OWM geocoding `local_names`
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import { WiDaySunny, WiCloudy, WiDayCloudy, WiRain, WiSnow, WiStrongWind, WiFog, WiThunderstorm, WiThermometer } from 'react-icons/wi';
// -----------------------------
// Configuration & constants
// -----------------------------

/**
 * OpenWeatherMap API key.
 *
 * NOTE: This is currently inlined for demo/dev usage. In production, it is
 * typically better to inject this via environment/config and/or proxy requests
 * through a backend to avoid exposing keys to the browser.
 */
const API_KEY = '75cb98e60f3fe4b06610b0936cab22ad';

/** Request timeout (ms) and cache TTL / refresh interval (ms). */
const TIMEOUT = 5000, CACHE_TTL = 600000;

/** OpenWeatherMap base URL. */
const API = 'https://api.openweathermap.org';

/** City used when location detection fails. */
const DEFAULT_CITY = 'Redwood City, CA';

/** Event name used for facility selection. */
const FACILITY_EVENT = 'facilitySelected';

/** Event name used for facility list updates (to drive the dropdown options). */
const FACILITY_LIST_EVENT = 'facilityListUpdated';

/** Used to strip UI-only suffixes like "(Auto)" / "(Default)" from city strings. */
const SUFFIX_RE = /\s*\((Auto|Default)\)/;

/** US ZIP format used to decide between OWM zip vs direct geocoding endpoints. */
const ZIP_RE = /^\d{5}(-\d{4})?$/;

// -----------------------------
// UI i18n (UI chrome only)
// -----------------------------

/**
 * UI labels for the widget's own chrome.
 *
 * IMPORTANT: Weather condition text is NOT translated here.
 * OpenWeatherMap provides localized weather descriptions via `lang` on the
 * weather endpoint.
 */
const UI_LABELS: Record<string, Record<string, string>> = {
  en: { search: 'Search', searching: 'Searching...', cancel: 'Cancel', apply: 'Apply', addLocation: 'Add Custom Location', placeholder: 'Search by city or ZIP...', detecting: 'Detecting location...', auto: 'Auto', default: 'Default', addLocationMenu: '+ Add Custom Location...', utc: 'UTC', cityNotFound: 'City not found', failed: 'Failed' },
  es: { search: 'Buscar', searching: 'Buscando...', cancel: 'Cancelar', apply: 'Aplicar', addLocation: 'Agregar ubicación', placeholder: 'Buscar por ciudad o código postal...', detecting: 'Detectando ubicación...', auto: 'Auto', default: 'Predeterminado', addLocationMenu: '+ Agregar ubicación...', utc: 'UTC', cityNotFound: 'Ciudad no encontrada', failed: 'Error' },
  fr: { search: 'Rechercher', searching: 'Recherche...', cancel: 'Annuler', apply: 'Appliquer', addLocation: 'Ajouter un lieu', placeholder: 'Rechercher par ville ou code postal...', detecting: 'Détection de la position...', auto: 'Auto', default: 'Par défaut', addLocationMenu: '+ Ajouter un lieu...', utc: 'UTC', cityNotFound: 'Ville introuvable', failed: 'Échec' },
  de: { search: 'Suchen', searching: 'Suche...', cancel: 'Abbrechen', apply: 'Anwenden', addLocation: 'Ort hinzufügen', placeholder: 'Nach Stadt oder PLZ suchen...', detecting: 'Standort wird ermittelt...', auto: 'Auto', default: 'Standard', addLocationMenu: '+ Ort hinzufügen...', utc: 'UTC', cityNotFound: 'Stadt nicht gefunden', failed: 'Fehlgeschlagen' },
  zh_cn: { search: '搜索', searching: '搜索中...', cancel: '取消', apply: '应用', addLocation: '添加位置', placeholder: '按城市或邮编搜索...', detecting: '正在检测位置...', auto: '自动', default: '默认', addLocationMenu: '+ 添加位置...', utc: '协调世界时', cityNotFound: '未找到城市', failed: '失败' },
  ja: { search: '検索', searching: '検索中...', cancel: 'キャンセル', apply: '適用', addLocation: '場所を追加', placeholder: '都市または郵便番号で検索...', detecting: '位置を検出中...', auto: '自動', default: 'デフォルト', addLocationMenu: '+ 場所を追加...', utc: '協定世界時', cityNotFound: '都市が見つかりません', failed: '失敗しました' },
  kr: { search: '검색', searching: '검색 중...', cancel: '취소', apply: '적용', addLocation: '위치 추가', placeholder: '도시 또는 우편번호로 검색...', detecting: '위치 감지 중...', auto: '자동', default: '기본값', addLocationMenu: '+ 위치 추가...', utc: '협정세계시', cityNotFound: '도시를 찾을 수 없음', failed: '실패' },
  pt: { search: 'Pesquisar', searching: 'Pesquisando...', cancel: 'Cancelar', apply: 'Aplicar', addLocation: 'Adicionar local', placeholder: 'Pesquisar por cidade ou CEP...', detecting: 'Detectando localização...', auto: 'Auto', default: 'Padrão', addLocationMenu: '+ Adicionar local...', utc: 'UTC', cityNotFound: 'Cidade não encontrada', failed: 'Falhou' },
  it: { search: 'Cerca', searching: 'Ricerca...', cancel: 'Annulla', apply: 'Applica', addLocation: 'Aggiungi luogo', placeholder: 'Cerca per città o CAP...', detecting: 'Rilevamento posizione...', auto: 'Auto', default: 'Predefinito', addLocationMenu: '+ Aggiungi luogo...', utc: 'UTC', cityNotFound: 'Città non trovata', failed: 'Non riuscito' },
  nl: { search: 'Zoeken', searching: 'Zoeken...', cancel: 'Annuleren', apply: 'Toepassen', addLocation: 'Locatie toevoegen', placeholder: 'Zoek op stad of postcode...', detecting: 'Locatie detecteren...', auto: 'Auto', default: 'Standaard', addLocationMenu: '+ Locatie toevoegen...', utc: 'UTC', cityNotFound: 'Stad niet gevonden', failed: 'Mislukt' },
  ru: { search: 'Поиск', searching: 'Поиск...', cancel: 'Отмена', apply: 'Применить', addLocation: 'Добавить место', placeholder: 'Поиск по городу или индексу...', detecting: 'Определение местоположения...', auto: 'Авто', default: 'По умолчанию', addLocationMenu: '+ Добавить место...', utc: 'ВКВ', cityNotFound: 'Город не найден', failed: 'Ошибка' },
  ar: { search: 'بحث', searching: 'جاري البحث...', cancel: 'إلغاء', apply: 'تطبيق', addLocation: 'إضافة موقع', placeholder: 'البحث حسب المدينة أو الرمز البريدي...', detecting: 'جاري تحديد الموقع...', auto: 'تلقائي', default: 'افتراضي', addLocationMenu: '+ إضافة موقع...', utc: 'ت.ع.م', cityNotFound: 'لم يتم العثور على المدينة', failed: 'فشل' },
  hi: { search: 'खोजें', searching: 'खोज रहा है...', cancel: 'रद्द करें', apply: 'लागू करें', addLocation: 'स्थान जोड़ें', placeholder: 'शहर या पिन कोड से खोजें...', detecting: 'स्थान का पता लगा रहा है...', auto: 'स्वतः', default: 'डिफ़ॉल्ट', addLocationMenu: '+ स्थान जोड़ें...', utc: 'यूटीसी', cityNotFound: 'शहर नहीं मिला', failed: 'विफल' },
};
/** Simple translation helper with English fallback. */
const t = (lang: string, key: string) => UI_LABELS[lang]?.[key] || UI_LABELS.en[key];

// -----------------------------
// Localization helpers
// -----------------------------

/**
 * Format numbers using the browser's Intl API.
 *
 * For a subset of supported languages we opt into native numeral systems.
 * This keeps temperature and timezone digits consistent with user expectations
 * (e.g. Arabic-Indic numerals).
 */
const formatNumber = (num: number, lang: string): string => {
  // Map language codes to proper locales with numbering systems
  const localeMap: Record<string, string> = {
    zh_cn: 'zh-CN',
    kr: 'ko-KR',
    ar: 'ar-SA-u-nu-arab',  // Arabic numerals: ٠١٢٣٤٥٦٧٨٩
    hi: 'hi-IN-u-nu-deva',  // Devanagari numerals: ०१२३४५६७८९
  };
  const locale = localeMap[lang] || lang;
  try { return new Intl.NumberFormat(locale).format(num); }
  catch { return String(num); }
};

// -----------------------------
// Styling helpers
// -----------------------------

/**
 * Helper to reference CSS variables (theme-aware).
 *
 * Supports fallbacks so the widget remains readable even if a host page is
 * missing some of the expected CSS variables.
 */
const v = (name: string, ...fallbacks: string[]) => {
  if (!fallbacks.length) return `var(--${name})`;
  let expr = `var(--${fallbacks[fallbacks.length - 1]})`;
  for (let i = fallbacks.length - 2; i >= 0; i--) {
    expr = `var(--${fallbacks[i]}, ${expr})`;
  }
  return `var(--${name}, ${expr})`;
};

/**
 * Theme variable fallbacks.
 *
 * Some host pages scope `--bg-*` variables to a container rather than `:root`.
 * Dropdowns are rendered via portals and can lose those scoped vars.
 *
 * We fall back to VS Code webview theme vars when available.
 */
const BG = {
  // Final fallback uses the CSS system color keyword `Canvas` to guarantee an opaque surface
  // even if no theme variables are present in the current scope.
  surface: 'var(--bg-primary, var(--vscode-menu-background, var(--vscode-editorWidget-background, var(--vscode-editor-background, var(--vscode-sideBar-background, var(--vscode-panel-background, var(--bg-input, var(--bg-tertiary, Canvas))))))))',
  input: 'var(--bg-input, var(--vscode-input-background, var(--vscode-editorWidget-background, var(--vscode-editor-background, var(--bg-primary, var(--bg-tertiary, Canvas)))))))',
  raised: 'var(--bg-tertiary, var(--vscode-dropdown-background, var(--vscode-editorWidget-background, var(--vscode-sideBar-background, var(--vscode-editor-background, var(--bg-primary, Canvas))))))',
};

/**
 * Shared inline-style tokens.
 *
 * The widget uses inline styles so it can be embedded without a bundler-driven
 * CSS pipeline. All colors come from CSS variables provided by the host page.
 */
const S = {
  flex: { display: 'flex', alignItems: 'center' },
  btn: { padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: 14, background: BG.raised, color: v('text-primary') },
  input: { padding: '8px 12px', borderRadius: '4px', border: `1px solid ${v('border-color')}`, fontSize: 14, width: '100%', background: BG.input, color: v('text-primary') }
};

const DROPDOWN_STYLES = {
  trigger: { padding: '6px 10px', border: `1px solid ${v('border-color')}`, borderRadius: '4px', cursor: 'pointer', fontSize: 13, background: BG.input, color: v('text-primary'), minWidth: 120, maxWidth: 180, width: 'auto' as const },
  menu: { position: 'fixed' as const, backgroundColor: BG.surface, border: `1px solid ${v('border-color')}`, borderRadius: '4px', minWidth: 160, maxHeight: 300, overflow: 'auto', zIndex: 2147483647, opacity: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', whiteSpace: 'normal' as const, wordBreak: 'break-word' as const },
  menuItem: { padding: '8px 12px', cursor: 'pointer', ...S.flex, justifyContent: 'space-between', color: v('text-primary') },
  arrow: { fontSize: 12, marginLeft: 8, color: v('text-secondary') }
};

const MODAL_STYLES = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'var(--overlay-bg, rgba(0,0,0,0.6))',
    ...S.flex,
    justifyContent: 'center',
    zIndex: 2147483646
  },
  shell: { backgroundColor: BG.surface, borderRadius: '10px', padding: '20px', minWidth: 360, maxWidth: 480, maxHeight: '90vh', overflow: 'auto', color: v('text-primary'), boxShadow: '0 14px 42px rgba(0,0,0,0.30)', border: `2px solid ${v('border-color')}` },
  input: { ...S.input, background: BG.input, border: `1.5px solid ${v('border-color')}`, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  footer: { ...S.flex, gap: 8, justifyContent: 'flex-end', paddingTop: 12, marginTop: 8, borderTop: `1px solid ${v('border-color')}` },
  buttonBase: { ...S.btn, minWidth: 92, borderRadius: 4 },
  results: {
    container: { marginBottom: 12, backgroundColor: BG.raised, padding: 10, borderRadius: 10, border: `1px solid ${v('border-color')}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    card: (active: boolean) => ({ padding: '10px 12px', marginBottom: 6, cursor: 'pointer', backgroundColor: active ? BG.input : BG.surface, borderRadius: '6px', border: `1px solid ${active ? v('accent-color') : v('border-color')}`, fontSize: 13, color: v('text-primary'), boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' })
  }
};

// -----------------------------
// Generic helpers
// -----------------------------

/**
 * Normalize a city query string for OpenWeatherMap's `q=` parameter.
 *
 * - Removes UI suffixes like "(Auto)" / "(Default)".
 * - If query looks like "City, ST" (2-letter state), appends ",US" to improve
 *   hit-rate for US cities.
 */
const fmtQuery = (city: string) => {
  const p = city.replace(SUFFIX_RE, '').trim().split(',').map(s => s.trim());
  return p.length === 2 && p[1].length === 2 ? `${p[0]},${p[1]},US` : city;
};

/**
 * Best-effort JSON parser for fetch responses.
 *
 * Uses `clone()` so we can still access the response body if needed.
 * Returns `{}` on parse errors to make error handling simpler.
 */
const parseJson = async (r: Response) => { try { return await r.clone().json(); } catch { return {}; } };

// -----------------------------
// OpenWeatherMap API
// -----------------------------

/**
 * Fetch current weather for a city.
 *
 * Uses imperial units by default (Fahrenheit). Conversion to Celsius happens
 * client-side when the user toggles units.
 */
const fetchWeather = async (city: string, lang: string = 'en'): Promise<WeatherData> => {
  const r = await fetchTimeout(`${API}/data/2.5/weather?q=${encodeURIComponent(fmtQuery(city))}&appid=${API_KEY}&units=imperial&lang=${lang}`);
  const d = await parseJson(r);
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${d?.message || 'Error'}`);
  return { location: d.name || city, temp: Math.round(d.main?.temp ?? 0), condition: d.weather?.[0]?.description ?? 'Unknown', timestamp: Date.now(), timezone: d.timezone ?? 0 };
};

/**
 * Geocode a user query to a list of candidate locations.
 *
 * - ZIP codes use the dedicated `/zip` endpoint.
 * - Everything else uses `/direct` with up to 5 candidates.
 */
const geocode = async (q: string): Promise<GeoResult[]> => {
  const isZip = ZIP_RE.test(q.trim());
  const url = isZip ? `${API}/geo/1.0/zip?zip=${q.trim()},US&appid=${API_KEY}` : `${API}/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${API_KEY}`;
  const r = await fetchTimeout(url);
  const d = await parseJson(r);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (isZip ? [d] : d).map((i: any) => ({ name: i.name, state: i.state, country: i.country }));
};

/**
 * Optional imperative integration API for host pages.
 *
 * Host code may call `window.updateWeatherFromFacility({ serviceCity, serviceState })`
 * and this widget will react as if a `facilitySelected` event was dispatched.
 */
if (typeof window !== 'undefined') {
  (window as any).updateWeatherFromFacility = (f: any) =>
    f?.serviceCity && window.dispatchEvent(new CustomEvent(FACILITY_EVENT, { detail: f }));

  (window as any).setWeatherFacilityList = (facilities: any) =>
    window.dispatchEvent(new CustomEvent(FACILITY_LIST_EVENT, { detail: facilities }));
}

const normalizeFacilityLocation = (f: any): string | null => {
  if (!f) return null;
  if (typeof f === 'string') return f.trim() || null;

  const city = (f.serviceCity ?? f.city ?? f.facilityCity ?? '').toString().trim();
  const state = (f.serviceState ?? f.state ?? f.facilityState ?? '').toString().trim();
  if (!city) return null;
  return state ? `${city}, ${state}` : city;
};

const uniqLocations = (arr: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of arr) {
    const s = raw.trim();
    if (!s) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
};

const normalizeFacilityListToLocations = (payload: any): string[] => {
  const list = Array.isArray(payload) ? payload : Array.isArray(payload?.facilities) ? payload.facilities : [];
  return uniqLocations(list.map(normalizeFacilityLocation).filter(Boolean) as string[]);
};

interface WeatherData { location: string; temp: number; condition: string; timestamp: number; timezone?: number; }
interface GeoResult { name: string; state?: string; country: string; localNames?: Record<string, string>; }
interface LocalizedCity { original: string; display: string; }

// -----------------------------
// City name localization via geocoding local_names
// -----------------------------

/**
 * Cache for localized city display names.
 *
 * Keyed by "<cleanCity>_<lang>".
 * This avoids repeated geocoding calls when toggling units or when the menu
 * re-renders.
 */
const localizedCityCache = new Map<string, string>();

// Country name to ISO code mapping for geocoding
const COUNTRY_MAP: Record<string, string> = {
  'UK': 'GB', 'Japan': 'JP', 'China': 'CN', 'Germany': 'DE', 'France': 'FR',
  'Spain': 'ES', 'Italy': 'IT', 'Brazil': 'BR', 'India': 'IN', 'Russia': 'RU'
};

/** Format city for geocoding: converts country names to ISO codes, simplifies US cities. */
const fmtGeoQuery = (city: string): string => {
  const parts = city.split(',').map(s => s.trim());
  if (parts.length < 2) return city;
  const last = parts[parts.length - 1];
  if (COUNTRY_MAP[last]) parts[parts.length - 1] = COUNTRY_MAP[last];
  return parts.length === 2 && /^[A-Z]{2}$/.test(parts[1]) && !COUNTRY_MAP[last] ? parts[0] : parts.join(',');
};

/** Resolve localized display name via OWM geocoding local_names, with caching. */
const getLocalizedCityName = async (city: string, lang: string): Promise<string> => {
  if (city.startsWith('+')) return city;
  const cleanCity = city.replace(SUFFIX_RE, '').trim();
  const cacheKey = `${cleanCity}_${lang}`;
  const cached = localizedCityCache.get(cacheKey);
  if (cached) return cached;
  const locale = { zh_cn: 'zh', kr: 'ko' }[lang] || lang;
  try {
    const r = await fetchTimeout(`${API}/geo/1.0/direct?q=${encodeURIComponent(fmtGeoQuery(cleanCity))}&limit=1&appid=${API_KEY}`);
    const d = await r.json();
    let name = d?.[0]?.local_names?.[locale] || d?.[0]?.name;
    if (name?.includes(';')) name = name.split(';')[0];
    if (name) { localizedCityCache.set(cacheKey, name); return name; }
  } catch { /* fallback */ }
  return cleanCity.split(',')[0].trim();
};

/** Tiny in-memory TTL cache for weather responses. */
function cache<T>(ttl: number) {
  const m = new Map<string, { d: T; e: number }>();
  return {
    get: (k: string) => { const v = m.get(k); if (v && Date.now() < v.e) return v.d; m.delete(k); return null; },
    set: (k: string, d: T) => m.set(k, { d, e: Date.now() + ttl })
  };
}

/** Fetch wrapper with AbortController timeout for responsive UI. */
async function fetchTimeout(url: string, opts: RequestInit = {}): Promise<Response> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), TIMEOUT);
  try { return await fetch(url, { ...opts, signal: c.signal }); } finally { clearTimeout(t); }
}

/** Format timezone offset (seconds) into localized label like `UTC+05:30`. */
const fmtTz = (s: number, lang: string = 'en') => {
  const hours = Math.floor(Math.abs(s) / 3600);
  const mins = Math.floor((Math.abs(s) % 3600) / 60);
  const hStr = String(hours).padStart(2, '0');
  const mStr = String(mins).padStart(2, '0');
  // Format each digit with localized numerals
  const localizeDigits = (str: string) => str.split('').map(c => /\d/.test(c) ? formatNumber(parseInt(c), lang) : c).join('');
  const utcLabel = t(lang, 'utc');
  return `${utcLabel}${s >= 0 ? '+' : '-'}${localizeDigits(hStr)}:${localizeDigits(mStr)}`;
};

const ICONS: Record<string, any> = {
  clear: WiDaySunny, sun: WiDaySunny, partly: WiDayCloudy, cloud: WiCloudy,
  rain: WiRain, drizzle: WiRain, snow: WiSnow, sleet: WiSnow, hail: WiSnow,
  wind: WiStrongWind, fog: WiFog, haze: WiFog, smog: WiFog, thunder: WiThunderstorm
};

/** CSS spinner for loading state. */
const Spinner: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <span style={{ display: 'inline-block', width: size, height: size, border: `2px solid ${v('text-muted')}`, borderTopColor: v('text-primary'), borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </span>
);

/** Picks icon via fuzzy substring match on condition (works across languages). */
const WeatherIcon: React.FC<{ condition?: string; loading?: boolean }> = React.memo(({ condition, loading }) => {
  if (loading) return <Spinner size={22} />;
  const Icon = Object.entries(ICONS).find(([k]) => (condition || '').toLowerCase().includes(k))?.[1] || WiThermometer;
  return <Icon style={{ fontSize: 32, color: v('text-primary') }} />;
});

/** Compact nav bar display: click temperature to toggle units. */
const WeatherDisplay: React.FC<{
  temperature: number | null; unit: string; condition?: string;
  error?: string | null; loading?: boolean; onUnitToggle?: () => void; lang?: string;
}> = React.memo(({ temperature, unit, condition, error, loading, onUnitToggle, lang = 'en' }) => {
  const rightText = typeof temperature === 'number' ? `${formatNumber(temperature, lang)}°${unit}` : `--°${unit}`;
  const subText = error || condition;
  const subStyle: React.CSSProperties = { fontSize: error ? 11 : 12, color: error ? v('error-color') : v('text-muted'), maxWidth: 80, textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };

  return (
    <div style={{ ...S.flex, gap: 8, alignItems: 'center' }}>
      <WeatherIcon condition={condition} loading={loading} />
      <div onClick={onUnitToggle} style={{ fontSize: 16, fontWeight: 600, color: error ? v('error-color') : v('text-primary'), cursor: 'pointer', marginLeft: 6 }}>{rightText}</div>
      {subText && <div style={subStyle}>{subText}</div>}
    </div>
  );
});

/** Minimal portal-based dropdown for embedding without overflow issues. */
const SimpleDropdown: React.FC<{ value: string; options: LocalizedCity[]; onChange: (c: string) => void }> = React.memo(({ value, options, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const [menuPos, setMenuPos] = React.useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 200 });
  const ref = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  React.useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const maxW = Math.min(220, window.innerWidth - 16), width = Math.min(Math.max(rect.width, 160), maxW);
    const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - width - 8));
    setMenuPos({ top: rect.bottom + 8, left, width });
  }, [open]);

  const selectedDisplay = options.find(o => o.original === value)?.display || value;
  const menuStyle = { ...DROPDOWN_STYLES.menu, top: menuPos.top, left: menuPos.left, width: menuPos.width, maxWidth: menuPos.width };
  // IMPORTANT: Portal into the widget container when possible so theme CSS vars
  // scoped to the nav/widget root still apply. Falling back to body can cause
  // `var(--bg-...)` to resolve to transparent if vars aren't defined globally.
  const portalTarget = ref.current || document.body;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div ref={triggerRef} onClick={() => setOpen(!open)} style={DROPDOWN_STYLES.trigger}>
        {selectedDisplay}<span style={DROPDOWN_STYLES.arrow}>▼</span>
      </div>
      {open && ReactDOM.createPortal(
        <div ref={menuRef} style={menuStyle}>
          {options.map((c, i) => (
            <div key={i} onClick={() => { onChange(c.original); setOpen(false); }} style={DROPDOWN_STYLES.menuItem}>
              {c.display}{c.original === value && <span style={{ color: v('success-color'), fontWeight: 'bold' }}>✓</span>}
            </div>
          ))}
        </div>,
        portalTarget
      )}
    </div>
  );
});

const GeoResultList: React.FC<{ results: GeoResult[]; selected: GeoResult | null; onSelect: (r: GeoResult) => void }> = React.memo(({ results, selected, onSelect }) => {
  if (!results.length) return null;
  return (
    <div style={MODAL_STYLES.results.container}>
      {results.map((r, i) => (
        <div key={i} onClick={() => onSelect(r)} style={MODAL_STYLES.results.card(selected === r)}>
          {`${r.name}${r.state ? ', ' + r.state : ''}, ${r.country}`}
        </div>
      ))}
    </div>
  );
});

const CustomLocationModal: React.FC<{
  isOpen: boolean; onClose: () => void; onApply: (city: string) => void;
  geocodeLocation: (query: string) => Promise<GeoResult[]>; lang: string;
}> = React.memo(({ isOpen, onClose, onApply, geocodeLocation, lang }) => {
  const [search, setSearch] = React.useState('');
  const [results, setResults] = React.useState<GeoResult[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [sel, setSel] = React.useState<GeoResult | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) inputRef.current?.focus();
    else { setSearch(''); setResults([]); setSel(null); }
  }, [isOpen]);

  const doSearch = React.useCallback(async () => {
    if (!search.trim()) return;
    setSearching(true);
    try { const d = await geocodeLocation(search); setResults(d); if (d.length) setSel(d[0]); }
    catch { setResults([]); }
    finally { setSearching(false); }
  }, [search, geocodeLocation]);

  const doApply = () => {
    if (!sel) return;
    onApply([sel.name, sel.state, sel.country].filter(Boolean).join(', '));
    setSearch(''); setResults([]); setSel(null); onClose();
  };

  if (!isOpen) return null;

  const showEdges = search.trim().length > 0 || results.length > 0;
  const edgeStyle = showEdges ? { background: v('bg-tertiary'), border: `1px solid ${v('border-color')}`, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' } : { background: 'transparent', border: '1px solid transparent', boxShadow: 'none' };
  const actionStyle = (enabled: boolean): React.CSSProperties => ({ ...MODAL_STYLES.buttonBase, ...edgeStyle, borderRadius: 6, fontWeight: 600, color: enabled ? v('text-primary') : v('text-muted'), cursor: enabled ? 'pointer' : 'not-allowed', opacity: enabled ? 1 : 0.65 });

  const onKeyActivate = (fn: () => void) => (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') fn(); };

  const ActionButton: React.FC<{ enabled?: boolean; label: string; onClick?: () => void }> = ({ enabled = true, label, onClick: h }) => (
    <div role="button" tabIndex={enabled ? 0 : -1} aria-disabled={enabled ? undefined : true} onClick={enabled ? h : undefined} onKeyDown={enabled && h ? onKeyActivate(h) : undefined} style={actionStyle(enabled)}>{label}</div>
  );

  return (
    <div style={MODAL_STYLES.overlay} onClick={onClose}>
      <div style={MODAL_STYLES.shell} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, color: v('text-primary') }}>{t(lang, 'addLocation')}</h3>
        <div style={{ marginBottom: 12 }}>
          <input type="text" placeholder={t(lang, 'placeholder')} value={search} onChange={e => setSearch(e.target.value)} onKeyPress={e => e.key === 'Enter' && doSearch()} style={MODAL_STYLES.input} ref={inputRef} />
          <button onClick={doSearch} disabled={searching} style={{ ...S.btn, marginTop: 6, background: v('accent-color'), color: '#fff' }}>{searching ? t(lang, 'searching') : t(lang, 'search')}</button>
        </div>
        <GeoResultList results={results} selected={sel} onSelect={r => setSel(r)} />
        <div style={MODAL_STYLES.footer}>
          <ActionButton label={t(lang, 'cancel')} onClick={onClose} />
          <ActionButton label={t(lang, 'apply')} enabled={Boolean(sel)} onClick={doApply} />
        </div>
      </div>
    </div>
  );
});

/** Main widget: language from localStorage, listens for languageChanged events. */
const WeatherWidget: React.FC = () => {
  const [lang, setLang] = React.useState(() => {
    try {
      return typeof localStorage !== 'undefined' ? (localStorage.getItem('weatherLang') || 'en') : 'en';
    } catch {
      return 'en';
    }
  });
  const [data, setData] = React.useState<WeatherData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [tz, setTz] = React.useState('');
  const [unit, setUnit] = React.useState<'F' | 'C'>('F');
  const [selected, setSelected] = React.useState(''), [autoCity, setAutoCity] = React.useState('');
  const [showModal, setShowModal] = React.useState(false), [customCities, setCustomCities] = React.useState<string[]>([]);
  const [facility, setFacility] = React.useState<string | null>(null), [localizedCities, setLocalizedCities] = React.useState<LocalizedCity[]>([]);
  const [facilityLocations, setFacilityLocations] = React.useState<string[]>([]);
  const [isAutoDetected, setIsAutoDetected] = React.useState(true), [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    const apply = (payload: any) => setFacilityLocations(normalizeFacilityListToLocations(payload));
    const h = (e: CustomEvent) => apply(e.detail);

    window.addEventListener(FACILITY_LIST_EVENT, h as EventListener);
    apply((window as any).weatherFacilityList);

    return () => window.removeEventListener(FACILITY_LIST_EVENT, h as EventListener);
  }, []);

  React.useEffect(() => {
    const h = (e: CustomEvent) => setLang(e.detail.lang);
    window.addEventListener('languageChanged', h as EventListener);
    return () => window.removeEventListener('languageChanged', h as EventListener);
  }, []);

  const wCache = React.useRef(cache<{ weather: WeatherData; rawTz: number }>(CACHE_TTL));

  const doFetch = React.useCallback(async (city: string) => {
    if (!city || city === 'Detecting...') return;
    const cacheKey = `${city}_${lang}`, c = wCache.current.get(cacheKey);
    if (c) { setData(c.weather); setTz(fmtTz(c.rawTz, lang)); return; }
    setLoading(true); setError(null);
    try {
      const w = await fetchWeather(city, lang), rawTz = w.timezone ?? 0;
      wCache.current.set(cacheKey, { weather: w, rawTz }); setData(w); setTz(fmtTz(rawTz, lang));
    } catch (e: any) {
      setError(e?.message?.includes('404') ? t(lang, 'cityNotFound') : (e?.message || t(lang, 'failed')));
      setData(null);
      setTz('');
    } finally { setLoading(false); }
  }, [lang]);

  const handleCity = React.useCallback((city: string) => { setSelected(city); void doFetch(city); }, [doFetch]);

  React.useEffect(() => { if (selected && initialized) void doFetch(selected); }, [selected, doFetch, initialized]);

  React.useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const city = p.get('facilityCity'), state = p.get('facilityState');
    if (city) { const loc = state ? `${city}, ${state}` : city; setFacility(loc); setSelected(loc); setInitialized(true); return; }
    const h = (e: CustomEvent) => {
      const f = e.detail; if (f?.serviceCity) { const loc = f.serviceState ? `${f.serviceCity}, ${f.serviceState}` : f.serviceCity; setFacility(loc); setSelected(loc); }
    };
    window.addEventListener(FACILITY_EVENT, h as EventListener);
    return () => window.removeEventListener(FACILITY_EVENT, h as EventListener);
  }, []);

  React.useEffect(() => {
    if (initialized || facility) return;
    let active = true;
    (async () => {
      try {
        const d: any = await (await fetchTimeout('https://ipapi.co/json/')).json();
        if (active) { setAutoCity(`${d.city}, ${d.region_code}`); setIsAutoDetected(true); setSelected(`${d.city}, ${d.region_code}`); setInitialized(true); }
      } catch { if (active) { setAutoCity(DEFAULT_CITY); setIsAutoDetected(false); setSelected(DEFAULT_CITY); setInitialized(true); } }
    })();
    return () => { active = false; };
  }, [initialized, facility]);

  React.useEffect(() => {
    if (!selected || !initialized) return;
    const id = setInterval(() => void doFetch(selected), CACHE_TTL);
    return () => clearInterval(id);
  }, [selected, doFetch, initialized]);

  const temp = React.useMemo(() => typeof data?.temp !== 'number' ? null : unit === 'F' ? data.temp : Math.round((data.temp - 32) * 5 / 9), [data?.temp, unit]);

  const addLocationMenuText = t(lang, 'addLocationMenu');
  const baseCities = React.useMemo(() => {
    const defaults = [autoCity, 'San Francisco, CA', 'New York, NY', 'Tokyo, JP'].filter(Boolean);
    const primary = facilityLocations.length ? facilityLocations : defaults;
    const withSelected = selected && !primary.includes(selected) ? [selected, ...primary] : primary;
    return [...withSelected, ...customCities, addLocationMenuText].filter(Boolean);
  }, [autoCity, facilityLocations, selected, customCities, addLocationMenuText]);
  const optionsToRender = React.useMemo(() => localizedCities.length ? localizedCities : baseCities.map(c => ({ original: c, display: c })), [localizedCities, baseCities]);

  React.useEffect(() => {
    let active = true;
    (async () => {
      const localized = await Promise.all(baseCities.map(async city => {
        if (city === addLocationMenuText) return { original: city, display: city };
        const [, ...rest] = city.split(',').map(s => s.trim()).filter(Boolean);
        const localizedCity = await getLocalizedCityName(city, lang);
        const suffix = city === autoCity ? ` (${t(lang, isAutoDetected ? 'auto' : 'default')})` : '';
        return { original: city, display: `${localizedCity}${rest.length ? `, ${rest.join(', ')}` : ''}${suffix}` };
      }));
      if (active) setLocalizedCities(localized);
    })();
    return () => { active = false; };
  }, [baseCities, lang, addLocationMenuText, autoCity, isAutoDetected]);

  const onLocationChange = React.useCallback((c: string) => { if (c === addLocationMenuText) setShowModal(true); else handleCity(c); }, [handleCity, addLocationMenuText]);
  const onAddCity = React.useCallback((c: string) => { setCustomCities(p => [...p, c]); handleCity(c); }, [handleCity]);

  return (
    <div style={{ ...S.flex, gap: 8, flexWrap: 'nowrap', alignItems: 'center', padding: '4px 6px', border: `1px solid ${v('border-color')}`, borderRadius: 6, backgroundColor: BG.surface, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', lineHeight: 1 }}>
      <CustomLocationModal isOpen={showModal} onClose={() => setShowModal(false)} onApply={onAddCity} geocodeLocation={geocode} lang={lang} />
      <SimpleDropdown value={selected || t(lang, 'detecting')} options={optionsToRender} onChange={onLocationChange} />
      <WeatherDisplay temperature={temp} unit={unit} condition={data?.condition} error={error} loading={loading} onUnitToggle={() => setUnit(u => u === 'F' ? 'C' : 'F')} lang={lang} />
      <span style={{ color: v('text-primary'), fontSize: 12, whiteSpace: 'nowrap' }}>{tz}</span>
    </div>
  );
};

/** Mount widget into #weather-widget-root if present. */
const rootElement = typeof document !== 'undefined' ? document.getElementById('weather-widget-root') : null;
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<WeatherWidget />);
}

// Export the component so other modules can import and render it directly.
export default WeatherWidget;
