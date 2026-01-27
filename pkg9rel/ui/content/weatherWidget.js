import { createUseGeocoder } from './hooks/useGeocoder.js';
import { createUseWeatherService } from './hooks/useWeatherService.js';
import { ConfigService } from './services/configService.js';
import WeatherDisplay from './components/WeatherDisplay.js';
import CustomLocationModal from './components/CustomLocationModal.js';
import DropdownContainer from './components/DropdownContainer.js';

const { createElement: h, useState, useEffect, useRef, useMemo, useCallback } = React;
const { createRoot } = ReactDOM;

// -- Configuration --
const API_KEY = '75cb98e60f3fe4b06610b0936cab22ad';
const CACHE_TTL = { GEO: 3600000, WEATHER: 600000 };
const RATE_LIMIT = 1000;
const DEFAULT_REFRESH_MS = 3600000;

const FALLBACKS = [
    { id: 'fac-001', name: 'Main Facility', city: 'New York', state: 'NY', latitude: 40.7128, longitude: -74.006 },
    { id: 'fac-002', name: 'West Coast Hub', city: 'Los Angeles', state: 'CA', latitude: 34.0522, longitude: -118.2437 },
    { id: 'fac-003', name: 'Central Office', city: 'Chicago', state: 'IL', latitude: 41.8781, longitude: -87.6298 }
];

// -- Styles --
const S = {
    dropdownLabel: { padding: '8px 16px', background: '#fff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ddd' },
    tz: { color: '#333', fontSize: '13px' }
};

// -- Utilities --
const toC = (f) => Math.round((f - 32) * 5 / 9);
const formatTemp = (t, u) => (typeof t === 'number' ? (u === 'F' ? t : toC(t)) : null);
const formatLabel = (f) => {
    const s = [f.city, f.state].filter(Boolean).join(', ');
    return s ? `${f.name} (${s})` : f.name;
};
const formatTz = (s) => {
    if (typeof s !== 'number') return 'Unknown Timezone';
    const h = s / 3600;
    const map = { '-5': 'Eastern', '-6': 'Central', '-7': 'Mountain', '-8': 'Pacific', '-9': 'Alaska', '-10': 'Hawaii' };
    return `${map[h] || 'Pacific'} Time Zone (UTC${h < 0 ? '-' : '+'}${Math.abs(h).toString().padStart(2, '0')}:00)`;
};

const createTimedCache = (ttl) => {
    const m = new Map();
    return {
        get: (k) => { const v = m.get(k); return (v && Date.now() - v.t <= ttl) ? v.d : (m.delete(k), null); },
        set: (k, d) => m.set(k, { d, t: Date.now() })
    };
};

const fetchWithTimeout = (url, ms = 5000) => {
    const c = new AbortController();
    const id = setTimeout(() => c.abort(), ms);
    return fetch(url, { signal: c.signal }).finally(() => clearTimeout(id));
};

// -- Hooks --
const useFacilities = () => {
    const [list, setList] = useState([]);
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const res = await fetch('/api/facilities');
                const d = await res.json();
                const raw = Array.isArray(d) ? d : (d.objs || d.facilities || []);
                if (!active) return;
                
                setList(raw.map(f => {
                    const l = f.location || f.coordinates || {};
                    return {
                        id: f.id || f.facilityId,
                        name: f.name || f.facilityName,
                        city: f.city || l.city,
                        state: f.state || l.state,
                        latitude: Number(f.latitude ?? l.latitude ?? l.lat ?? 0),
                        longitude: Number(f.longitude ?? l.longitude ?? l.lon ?? 0)
                    };
                }));
            } catch {
                if (active) setList(FALLBACKS);
            }
        })();
        return () => { active = false; };
    }, []);
    return list;
};

const useAutoLocation = (onFound) => {
    const [loc, setLoc] = useState({ label: 'Detecting...', value: 'Detecting...', lat: null, lon: null });
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const res = await fetchWithTimeout('https://ipapi.co/json/');
                const d = await res.json();
                const r = {
                    label: `${d.city}, ${d.region_code} (Auto)`,
                    value: 'auto-location',
                    lat: parseFloat(d.latitude),
                    lon: parseFloat(d.longitude)
                };
                if (active) { setLoc(r); onFound(r.label, r.lat, r.lon); }
            } catch {
                const fb = { label: 'Redwood City, USA (Auto)', value: 'auto-location', lat: 37.4852, lon: -122.2364 };
                if (active) { setLoc(fb); onFound(fb.label, fb.lat, fb.lon); }
            }
        })();
        return () => { active = false; };
    }, [onFound]);
    return loc;
};

// -- Initialized Services --
const useGeocoder = createUseGeocoder({ useRef, useCallback, createTimedCache, fetchWithTimeout, apiKey: API_KEY, cacheTtlMs: CACHE_TTL.GEO });
const useWeather = createUseWeatherService({ useState, useRef, useCallback, createTimedCache, fetchWithTimeout, apiKey: API_KEY, cacheTtlMs: CACHE_TTL.WEATHER, rateLimitMs: RATE_LIMIT, formatTimezone: formatTz });

// -- Main Component --
const App = () => {
    const facilities = useFacilities();
    const geocode = useGeocoder();
    const { weatherData: w, weatherError: err, weatherLoading: load, timezoneLabel: tz, fetchWeather, setWeatherError } = useWeather();

    const [ui, setUi] = useState({ drop: false, modal: false, unit: 'F' });
    const [sel, setSel] = useState('Detecting location...');
    const [custom, setCustom] = useState([]);
    const [coords, setCoords] = useState(null);
    const [refreshMs, setRefreshMs] = useState(DEFAULT_REFRESH_MS);

    // Load Admin Config
    useEffect(() => {
        ConfigService.getConfig().then(cfg => {
            if (cfg?.refreshIntervalMinutes) {
                setRefreshMs(cfg.refreshIntervalMinutes * 60000);
            }
        }).catch(err => console.warn('Config load failed, using default', err));
    }, []);

    const handleLoc = useCallback((lbl, lat, lon) => {
        if (lat == null || lon == null) return;
        setSel(lbl);
        setCoords({ lat, lon });
        fetchWeather(lat, lon);
    }, [fetchWeather]);

    const autoLoc = useAutoLocation(handleLoc);

    useEffect(() => {
        if (!coords) return;
        const id = setInterval(() => fetchWeather(coords.lat, coords.lon), refreshMs);
        return () => clearInterval(id);
    }, [coords, fetchWeather, refreshMs]);

    const handleSelect = useCallback(async (val, id) => {
        setUi(p => ({ ...p, drop: false }));
        if (id === 'custom-new') return setUi(p => ({ ...p, modal: true }));
        if (id === 'auto') return handleLoc(autoLoc.label, autoLoc.lat, autoLoc.lon);

        const fac = facilities.find(f => f.id === id);
        if (fac) {
            if (fac.latitude && fac.longitude) return handleLoc(val, fac.latitude, fac.longitude);
            try {
                const q = [fac.city, fac.state].filter(Boolean).join(', ') || val;
                const c = await geocode(q);
                handleLoc(val, c.lat, c.lon);
            } catch { setWeatherError('Facility location not found'); }
            return;
        }

        try {
            const c = await geocode(val);
            handleLoc(val, c.lat, c.lon);
        } catch { setWeatherError('City not found'); }
    }, [autoLoc, facilities, geocode, handleLoc, setWeatherError]);

    const sections = useMemo(() => [
        { id: 'auto', items: [{ id: 'auto', label: autoLoc.label, value: autoLoc.value }] },
        { id: 'fac', label: `FACILITIES (${facilities.length})`, items: facilities.map(f => ({ id: f.id, label: formatLabel(f), value: formatLabel(f) })) },
        { id: 'custom', items: [...custom.map((c, i) => ({ id: `c-${i}`, label: c, value: c })), { id: 'custom-new', label: 'Custom Location...', value: 'custom-new' }] }
    ], [autoLoc, facilities, custom]);

    return h('div', { style: { display: 'flex', alignItems: 'center', gap: 16 } },
        h(CustomLocationModal, {
            isOpen: ui.modal,
            onClose: () => setUi(p => ({ ...p, modal: false })),
            onApply: (n, lat, lon) => { setCustom(p => (p.includes(n) ? p : [...p, n])); setUi(p => ({ ...p, modal: false })); handleLoc(n, lat, lon); },
            geocodeLocation: geocode
        }),
        h(DropdownContainer, {
            sections,
            selectedValue: sel,
            selectedItems: [sel],
            onSelect: handleSelect,
            isOpen: ui.drop,
            onOpenChange: (o) => setUi(p => ({ ...p, drop: o })),
            width: '240px'
        },
            h('div', { style: S.dropdownLabel },
                h('span', { style: { fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 } }, sel),
                h('span', { style: { fontSize: 12, color: '#888' } }, '▼')
            )
        ),
        h(WeatherDisplay, {
            temperature: formatTemp(w?.temperature, ui.unit),
            unit: ui.unit,
            condition: w?.condition,
            error: err,
            loading: load,
            onUnitToggle: () => setUi(p => ({ ...p, unit: p.unit === 'F' ? 'C' : 'F' }))
        }),
        h('span', { style: S.tz }, tz)
    );
};

createRoot(document.getElementById('weather-widget-root')).render(h(App));
