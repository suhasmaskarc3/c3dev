/**
 * Weather Widget
 *
 * This file is intentionally self-contained: it mounts a React widget into
 * `#weather-widget-root` and can be embedded into other pages.
 *
 * Integration points:
 * - URL params: `?facilityCity=...&facilityState=...`
 * - CustomEvent: dispatch `facilitySelected` with `{ serviceCity, serviceState }`
 * - Imperative API: `window.updateWeatherFromFacility(facility)` convenience wrapper
 *
 * The widget:
 * - Fetches current weather via OpenWeatherMap
 * - Uses OWM `lang` parameter for localized weather descriptions
 * - Localizes *UI chrome strings* via `UI_LABELS` in this file
 * - Optionally localizes city display names via OWM geocoding `local_names`
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { WiDaySunny, WiCloudy, WiDayCloudy, WiRain, WiSnow, WiStrongWind, WiFog, WiThunderstorm, WiThermometer } from 'react-icons/wi';
import { FaSpinner } from 'react-icons/fa';

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

/** Request timeout for all network calls (ms). */
const TIMEOUT = 5000,
  /** Cache TTL for weather results & periodic refresh interval (ms). */
  CACHE_TTL = 600000;

/** OpenWeatherMap base URL. */
const API = 'https://api.openweathermap.org';

/** City used when location detection fails. */
const DEFAULT_CITY = 'Redwood City, CA';

/** Event name used for facility selection. */
const FACILITY_EVENT = 'facilitySelected';

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
  en: { search: 'Search', searching: 'Searching...', cancel: 'Cancel', apply: 'Apply', addLocation: 'Add Custom Location', placeholder: 'Search by city or ZIP...', detecting: 'Detecting location...', auto: 'Auto', default: 'Default', addLocationMenu: '+ Add Custom Location...', utc: 'UTC' },
  es: { search: 'Buscar', searching: 'Buscando...', cancel: 'Cancelar', apply: 'Aplicar', addLocation: 'Agregar ubicación', placeholder: 'Buscar por ciudad o código postal...', detecting: 'Detectando ubicación...', auto: 'Auto', default: 'Predeterminado', addLocationMenu: '+ Agregar ubicación...', utc: 'UTC' },
  fr: { search: 'Rechercher', searching: 'Recherche...', cancel: 'Annuler', apply: 'Appliquer', addLocation: 'Ajouter un lieu', placeholder: 'Rechercher par ville ou code postal...', detecting: 'Détection de la position...', auto: 'Auto', default: 'Par défaut', addLocationMenu: '+ Ajouter un lieu...', utc: 'UTC' },
  de: { search: 'Suchen', searching: 'Suche...', cancel: 'Abbrechen', apply: 'Anwenden', addLocation: 'Ort hinzufügen', placeholder: 'Nach Stadt oder PLZ suchen...', detecting: 'Standort wird ermittelt...', auto: 'Auto', default: 'Standard', addLocationMenu: '+ Ort hinzufügen...', utc: 'UTC' },
  zh_cn: { search: '搜索', searching: '搜索中...', cancel: '取消', apply: '应用', addLocation: '添加位置', placeholder: '按城市或邮编搜索...', detecting: '正在检测位置...', auto: '自动', default: '默认', addLocationMenu: '+ 添加位置...', utc: '协调世界时' },
  ja: { search: '検索', searching: '検索中...', cancel: 'キャンセル', apply: '適用', addLocation: '場所を追加', placeholder: '都市または郵便番号で検索...', detecting: '位置を検出中...', auto: '自動', default: 'デフォルト', addLocationMenu: '+ 場所を追加...', utc: '協定世界時' },
  kr: { search: '검색', searching: '검색 중...', cancel: '취소', apply: '적용', addLocation: '위치 추가', placeholder: '도시 또는 우편번호로 검색...', detecting: '위치 감지 중...', auto: '자동', default: '기본값', addLocationMenu: '+ 위치 추가...', utc: '협정세계시' },
  pt: { search: 'Pesquisar', searching: 'Pesquisando...', cancel: 'Cancelar', apply: 'Aplicar', addLocation: 'Adicionar local', placeholder: 'Pesquisar por cidade ou CEP...', detecting: 'Detectando localização...', auto: 'Auto', default: 'Padrão', addLocationMenu: '+ Adicionar local...', utc: 'UTC' },
  it: { search: 'Cerca', searching: 'Ricerca...', cancel: 'Annulla', apply: 'Applica', addLocation: 'Aggiungi luogo', placeholder: 'Cerca per città o CAP...', detecting: 'Rilevamento posizione...', auto: 'Auto', default: 'Predefinito', addLocationMenu: '+ Aggiungi luogo...', utc: 'UTC' },
  nl: { search: 'Zoeken', searching: 'Zoeken...', cancel: 'Annuleren', apply: 'Toepassen', addLocation: 'Locatie toevoegen', placeholder: 'Zoek op stad of postcode...', detecting: 'Locatie detecteren...', auto: 'Auto', default: 'Standaard', addLocationMenu: '+ Locatie toevoegen...', utc: 'UTC' },
  ru: { search: 'Поиск', searching: 'Поиск...', cancel: 'Отмена', apply: 'Применить', addLocation: 'Добавить место', placeholder: 'Поиск по городу или индексу...', detecting: 'Определение местоположения...', auto: 'Авто', default: 'По умолчанию', addLocationMenu: '+ Добавить место...', utc: 'ВКВ' },
  ar: { search: 'بحث', searching: 'جاري البحث...', cancel: 'إلغاء', apply: 'تطبيق', addLocation: 'إضافة موقع', placeholder: 'البحث حسب المدينة أو الرمز البريدي...', detecting: 'جاري تحديد الموقع...', auto: 'تلقائي', default: 'افتراضي', addLocationMenu: '+ إضافة موقع...', utc: 'ت.ع.م' },
  hi: { search: 'खोजें', searching: 'खोज रहा है...', cancel: 'रद्द करें', apply: 'लागू करें', addLocation: 'स्थान जोड़ें', placeholder: 'शहर या पिन कोड से खोजें...', detecting: 'स्थान का पता लगा रहा है...', auto: 'स्वतः', default: 'डिफ़ॉल्ट', addLocationMenu: '+ स्थान जोड़ें...', utc: 'यूटीसी' },
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

/** Helper to reference CSS variables defined in index.html (theme-aware). */
const v = (name: string) => `var(--${name})`;

/**
 * Shared inline-style tokens.
 *
 * The widget uses inline styles so it can be embedded without a bundler-driven
 * CSS pipeline. All colors come from CSS variables provided by the host page.
 */
const S = {
  flex: { display: 'flex', alignItems: 'center' },
  btn: { padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: 14, background: v('bg-tertiary'), color: v('text-primary') },
  input: { padding: '8px 12px', borderRadius: '4px', border: `1px solid ${v('border-color')}`, fontSize: 14, width: '100%', background: v('bg-input'), color: v('text-primary') }
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
(window as any).updateWeatherFromFacility = (f: any) => f?.serviceCity && window.dispatchEvent(new CustomEvent(FACILITY_EVENT, { detail: f }));

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

/**
 * Format city for the geocoding endpoint.
 *
 * - Converts some human-readable country names into ISO codes.
 * - Special-cases US city + state (2 parts) to just "city" since the OWM
 *   geocoder often works better without the state.
 */
const fmtGeoQuery = (city: string): string => {
  const parts = city.split(',').map(s => s.trim());
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    // Convert country name to ISO code if needed
    if (COUNTRY_MAP[last]) {
      parts[parts.length - 1] = COUNTRY_MAP[last];
    }
    // If it's a 2-letter US state code, just use city name for better results
    if (parts.length === 2 && /^[A-Z]{2}$/.test(parts[1]) && !COUNTRY_MAP[last]) {
      return parts[0]; // Just city name works better for US cities
    }
  }
  return parts.join(',');
};

/**
 * Resolve a localized display name for a city.
 *
 * Uses OWM geocoding `local_names` to obtain native names when available.
 * If `local_names` does not include the requested locale, falls back to the
 * canonical `name` field and then finally the original input.
 */
const getLocalizedCityName = async (city: string, lang: string): Promise<string> => {
  // Don't translate special menu items
  if (city.startsWith('+')) return city;
  
  // Strip any suffix like (Auto) or (Default) for lookup
  const cleanCity = city.replace(SUFFIX_RE, '').trim();
  const cacheKey = `${cleanCity}_${lang}`;
  const cached = localizedCityCache.get(cacheKey);
  if (cached) return cached;
  
  // Map our internal language codes to OWM `local_names` keys.
  // (OWM uses 'zh' and 'ko' instead of 'zh_cn' and 'kr')
  const langMap: Record<string, string> = { zh_cn: 'zh', kr: 'ko' };
  const locale = langMap[lang] || lang;
  
  try {
    const q = fmtGeoQuery(cleanCity);
    // `limit=1` because we only need the best match for display purposes.
    const r = await fetchTimeout(`${API}/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${API_KEY}`);
    const d = await r.json();
    if (d?.[0]?.local_names?.[locale]) {
      // Handle multiple names separated by semicolons (take first)
      let localized = d[0].local_names[locale];
      if (localized.includes(';')) localized = localized.split(';')[0];
      localizedCityCache.set(cacheKey, localized);
      return localized;
    }
    // Fallback to the standard name if no local name
    if (d?.[0]?.name) {
      localizedCityCache.set(cacheKey, d[0].name);
      return d[0].name;
    }
  } catch { /* fallback to original */ }
  // Return just the city name part (before first comma)
  return cleanCity.split(',')[0].trim();
};

function cache<T>(ttl: number) {
  /**
   * Tiny in-memory TTL cache.
   *
   * Used for weather responses to avoid repeatedly hitting the API while the
   * widget is mounted.
   */
  const m = new Map<string, { d: T; e: number }>();
  return {
    get: (k: string) => { const v = m.get(k); if (v && Date.now() < v.e) return v.d; m.delete(k); return null; },
    set: (k: string, d: T) => m.set(k, { d, e: Date.now() + ttl })
  };
}

async function fetchTimeout(url: string, opts: RequestInit = {}): Promise<Response> {
  /**
   * Fetch wrapper with AbortController timeout.
   *
   * Keeps the UI responsive in slow networks and ensures we don't keep
   * outstanding requests around indefinitely.
   */
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), TIMEOUT);
  try { return await fetch(url, { ...opts, signal: c.signal }); } finally { clearTimeout(t); }
}

const fmtTz = (s: number, lang: string = 'en') => {
  /**
   * Format a timezone offset (seconds from UTC) into a label like `UTC+05:30`.
   *
   * Digits are localized (e.g. Arabic-Indic numerals) via `formatNumber`.
   */
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

const WeatherIcon: React.FC<{ condition?: string; loading?: boolean }> = React.memo(({ condition, loading }) => {
  /**
   * Picks an icon based on a substring match of the localized condition string.
   * This is intentionally fuzzy ("rain", "cloud", "fog"...) so it works across
   * languages as long as the keyword appears in the translated condition.
   */
  if (loading) return <FaSpinner style={{ fontSize: 28, color: v('text-primary') }} />;
  const Icon = Object.entries(ICONS).find(([k]) => (condition || '').toLowerCase().includes(k))?.[1] || WiThermometer;
  return <Icon style={{ fontSize: 48, color: v('text-primary') }} />;
});

const WeatherDisplay: React.FC<{
  temperature: number | null; unit: string; condition?: string;
  error?: string | null; loading?: boolean; onUnitToggle?: () => void; lang?: string;
}> = React.memo(({ temperature, unit, condition, error, loading, onUnitToggle, lang = 'en' }) =>
  /**
   * Compact display shown in the nav bar.
   *
   * Clicking the temperature toggles units.
   * When `error` is set, it is shown instead of `condition`.
   */
  React.createElement('div', { style: { ...S.flex, gap: 12 } },
    React.createElement(WeatherIcon, { condition, loading }),
    React.createElement('div', {
      onClick: onUnitToggle,
      style: { fontSize: 18, fontWeight: 600, color: error ? v('error-color') : v('text-primary'), cursor: 'pointer', marginLeft: 8 }
    }, typeof temperature === 'number' ? `${formatNumber(temperature, lang)}°${unit}` : `--°${unit}`),
    (condition || error) && React.createElement('div', {
      style: { fontSize: error ? 11 : 13, color: error ? v('error-color') : v('text-muted'), maxWidth: 100, textTransform: 'capitalize' as const }
    }, error || condition)
  )
);

const SimpleDropdown: React.FC<{ value: string; options: LocalizedCity[]; onChange: (c: string) => void }> = React.memo(({ value, options, onChange }) => {
  /**
   * Minimal custom dropdown.
   *
   * We keep it dependency-free to simplify embedding in non-React host apps.
   */
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close the menu on outside click.
  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selectedDisplay = options.find(o => o.original === value)?.display || value;
  const ddStyle = { padding: '8px 16px', border: `1px solid ${v('border-color')}`, borderRadius: '4px', cursor: 'pointer', fontSize: 14, background: v('bg-input'), color: v('text-primary'), minWidth: 200 };
  const menuStyle = { position: 'absolute' as const, top: '100%', left: 0, background: v('bg-input'), border: `1px solid ${v('border-color')}`, borderRadius: '4px', marginTop: 4, minWidth: 200, maxHeight: 300, overflow: 'auto', zIndex: 1000 };
  const itemStyle = { padding: '8px 12px', cursor: 'pointer', ...S.flex, justifyContent: 'space-between', color: v('text-primary') };

  return React.createElement('div', { ref, style: { position: 'relative' } },
    React.createElement('div', { onClick: () => setOpen(!open), style: ddStyle },
      selectedDisplay, React.createElement('span', { style: { fontSize: 12, marginLeft: 8, color: v('text-secondary') } }, '▼')),
    open && React.createElement('div', { style: menuStyle },
      options.map((c, i) => React.createElement('div', { key: i, onClick: () => { onChange(c.original); setOpen(false); }, style: itemStyle },
        c.display, c.original === value && React.createElement('span', { style: { color: v('success-color'), fontWeight: 'bold' } }, '✓'))))
  );
});

const CustomLocationModal: React.FC<{
  isOpen: boolean; onClose: () => void; onApply: (city: string) => void;
  geocodeLocation: (q: string) => Promise<GeoResult[]>; lang: string;
}> = React.memo(({ isOpen, onClose, onApply, geocodeLocation, lang }) => {
  /**
   * Modal for adding a custom location.
   *
   * Uses the geocoding endpoint to present candidates and returns a
   * comma-separated location string suitable for weather lookup.
   */
  const [search, setSearch] = React.useState('');
  const [results, setResults] = React.useState<GeoResult[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [sel, setSel] = React.useState<GeoResult | null>(null);

  const doSearch = React.useCallback(async () => {
    // Avoid empty searches and keep the UI responsive.
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

  const overlay = { position: 'fixed' as const, inset: 0, background: v('overlay-bg'), ...S.flex, justifyContent: 'center', zIndex: 10000 };
  const modal = { background: v('bg-primary'), borderRadius: '8px', padding: '20px', minWidth: 360, maxWidth: 480, maxHeight: '90vh', overflow: 'auto', color: v('text-primary') };
  const resultStyle = (r: GeoResult) => ({ padding: '8px 12px', marginBottom: 2, cursor: 'pointer', background: sel === r ? v('selected-bg') : v('bg-tertiary'), borderRadius: '4px', border: `1px solid ${v('border-color')}`, fontSize: 13, color: v('text-primary') });

  return React.createElement('div', { style: overlay, onClick: onClose },
    React.createElement('div', { style: modal, onClick: (e: React.MouseEvent) => e.stopPropagation() },
      React.createElement('h3', { style: { margin: '0 0 12px', fontSize: 16, color: v('text-primary') } }, t(lang, 'addLocation')),
      React.createElement('div', { style: { marginBottom: 12 } },
        React.createElement('input', { type: 'text', placeholder: t(lang, 'placeholder'), value: search,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
          onKeyPress: (e: React.KeyboardEvent) => e.key === 'Enter' && doSearch(), style: S.input }),
        React.createElement('button', { onClick: doSearch, disabled: searching,
          style: { ...S.btn, marginTop: 6, background: v('accent-color'), color: '#fff' } }, searching ? t(lang, 'searching') : t(lang, 'search'))),
      results.length > 0 && React.createElement('div', { style: { marginBottom: 12 } },
        results.map((r, i) => React.createElement('div', { key: i, onClick: () => setSel(r), style: resultStyle(r) },
          `${r.name}${r.state ? ', ' + r.state : ''}, ${r.country}`))),
      React.createElement('div', { style: { ...S.flex, gap: 6, justifyContent: 'flex-end' } },
        React.createElement('button', { onClick: onClose, style: { ...S.btn, background: v('bg-tertiary') } }, t(lang, 'cancel')),
        React.createElement('button', { onClick: doApply, disabled: !sel,
          style: { ...S.btn, background: sel ? v('success-color') : v('border-color'), color: '#fff', cursor: sel ? 'pointer' : 'not-allowed' } }, t(lang, 'apply')))))
});

const WeatherWidget: React.FC = () => {
  /**
   * Language is set by `index.html` and broadcast via `languageChanged`.
   * We read initial value from localStorage so the widget renders immediately.
   */
  const [lang, setLang] = React.useState(() => {
    return localStorage.getItem('weatherLang') || 'en';
  });
  const [data, setData] = React.useState<WeatherData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [tz, setTz] = React.useState('');
  const [unit, setUnit] = React.useState<'F' | 'C'>('F');
  const [selected, setSelected] = React.useState('');
  const [autoCity, setAutoCity] = React.useState('');
  const [showModal, setShowModal] = React.useState(false);
  const [customCities, setCustomCities] = React.useState<string[]>([]);
  const [facility, setFacility] = React.useState<string | null>(null);
  const [localizedCities, setLocalizedCities] = React.useState<LocalizedCity[]>([]);
  // Track whether autoCity is auto-detected or default
  const [isAutoDetected, setIsAutoDetected] = React.useState(true);
  const [initialized, setInitialized] = React.useState(false);

  // Listen for language changes from index.html.
  React.useEffect(() => {
    const handler = (e: CustomEvent) => setLang(e.detail.lang);
    window.addEventListener('languageChanged', handler as EventListener);
    return () => window.removeEventListener('languageChanged', handler as EventListener);
  }, []);

  /**
   * Per-mount TTL cache for weather results.
   *
   * Keyed by `${city}_${lang}` so that switching language refreshes condition
   * strings (which are localized by the API).
   */
  const wCache = React.useRef(cache<{ weather: WeatherData; rawTz: number }>(CACHE_TTL));

  const doFetch = React.useCallback(async (city: string) => {
    // Guard against invalid placeholder values.
    if (!city || city === 'Detecting...') return;

    // Cache is language-specific to preserve localized condition text.
    const cacheKey = `${city}_${lang}`;
    const c = wCache.current.get(cacheKey);
    if (c) { setData(c.weather); setTz(fmtTz(c.rawTz, lang)); return; }
    setLoading(true); setError(null);
    try {
      const w = await fetchWeather(city, lang);
      const rawTz = w.timezone ?? 0;
      wCache.current.set(cacheKey, { weather: w, rawTz });
      setData(w); setTz(fmtTz(rawTz, lang));
    } catch (e: any) { setError(e.message || 'Failed'); }
    finally { setLoading(false); }
  }, [lang]);

  const handleCity = React.useCallback((city: string) => { setSelected(city); void doFetch(city); }, [doFetch]);

  // Re-fetch when the selected city or UI language changes.
  // (Changing language should update the condition string from OWM.)
  React.useEffect(() => {
    if (selected && initialized) void doFetch(selected);
  }, [selected, lang, doFetch, initialized]);

  React.useEffect(() => {
    // Facility can be supplied via query params at load time.
    const p = new URLSearchParams(window.location.search);
    const city = p.get('facilityCity'), state = p.get('facilityState');
    if (city) { const loc = state ? `${city}, ${state}` : city; setFacility(loc); setSelected(loc); setInitialized(true); return; }

    // Or via events later (from host page).
    const h = (e: CustomEvent) => {
      const f = e.detail;
      if (f?.serviceCity) { const loc = f.serviceState ? `${f.serviceCity}, ${f.serviceState}` : f.serviceCity; setFacility(loc); setSelected(loc); }
    };
    window.addEventListener(FACILITY_EVENT, h as EventListener);
    return () => window.removeEventListener(FACILITY_EVENT, h as EventListener);
  }, []);

  // Auto-detect location only once on mount.
  // Uses ipapi.co as a lightweight client-side fallback.
  React.useEffect(() => {
    if (initialized || facility) return;
    let active = true;
    (async () => {
      try {
        const d: any = await (await fetchTimeout('https://ipapi.co/json/')).json();
        const city = `${d.city}, ${d.region_code}`;
        if (active) { setAutoCity(city); setIsAutoDetected(true); setSelected(city); setInitialized(true); }
      } catch {
        if (active) { setAutoCity(DEFAULT_CITY); setIsAutoDetected(false); setSelected(DEFAULT_CITY); setInitialized(true); }
      }
    })();
    return () => { active = false; };
  }, [initialized, facility]);

  React.useEffect(() => {
    // Periodic refresh: keeps the displayed weather from going stale.
    // Uses CACHE_TTL as both refresh interval and cache eviction window.
    if (!selected || !initialized) return;
    const id = setInterval((): void => { void doFetch(selected); }, CACHE_TTL);
    return () => clearInterval(id);
  }, [selected, doFetch, initialized]);

  const temp = React.useMemo(() => {
    // Display temperature is derived from the API (F) + local unit toggle.
    if (typeof data?.temp !== 'number') return null;
    return unit === 'F' ? data.temp : Math.round(((data.temp - 32) * 5) / 9);
  }, [data?.temp, unit]);

  const addLocationMenuText = t(lang, 'addLocationMenu');
  const presetCities = ['San Francisco, CA', 'New York, NY', 'London, GB', 'Tokyo, JP'];
  const baseCities = React.useMemo(() => [
    autoCity, ...presetCities, ...customCities, addLocationMenuText
  ].filter(Boolean), [autoCity, customCities, addLocationMenuText]);

  // Localize city names using OpenWeatherMap geocoding API.
  // This affects the dropdown display only (original values are used for lookup).
  React.useEffect(() => {
    let active = true;
    (async () => {
      const localized = await Promise.all(
        baseCities.map(async (city) => {
          // Don't translate menu items
          if (city === addLocationMenuText) return { original: city, display: city };
          const display = await getLocalizedCityName(city, lang);
          // Add suffix for auto-detected city
          const suffix = city === autoCity ? ` (${t(lang, isAutoDetected ? 'auto' : 'default')})` : '';
          return { original: city, display: display + suffix };
        })
      );
      if (active) setLocalizedCities(localized);
    })();
    return () => { active = false; };
  }, [baseCities, lang, addLocationMenuText, autoCity, isAutoDetected]);

  const onLocationChange = React.useCallback((c: string) => {
    // Selecting the menu sentinel opens the modal instead of changing location.
    if (c === addLocationMenuText) { setShowModal(true); return; }
    handleCity(c);
  }, [handleCity, addLocationMenuText]);

  const onAddCity = React.useCallback((c: string) => { setCustomCities(p => [...p, c]); handleCity(c); }, [handleCity]);

  return React.createElement('div', { style: { ...S.flex, gap: 16, flexWrap: 'wrap' } },
    React.createElement(CustomLocationModal, { isOpen: showModal, onClose: () => setShowModal(false), onApply: onAddCity, geocodeLocation: geocode, lang }),
    React.createElement(SimpleDropdown, { value: selected || t(lang, 'detecting'), options: localizedCities.length ? localizedCities : baseCities.map(c => ({ original: c, display: c })), onChange: onLocationChange }),
    React.createElement(WeatherDisplay, { temperature: temp, unit, condition: data?.condition, error, loading, onUnitToggle: () => setUnit(u => u === 'F' ? 'C' : 'F'), lang }),
    React.createElement('span', { style: { color: v('text-primary'), fontSize: 13 } }, tz)
  );
};

// -----------------------------
// Mounting
// -----------------------------

/**
 * Widget mounts into the host page's placeholder element.
 * If the element is not present, we do nothing (safe no-op).
 */
const rootElement = document.getElementById('weather-widget-root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(React.createElement(WeatherWidget));
}
