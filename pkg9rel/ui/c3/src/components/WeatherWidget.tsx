import * as React from 'react';
import WeatherDisplay from './WeatherDisplay.js';
import DropdownContainer from './DropdownContainer.js';
import CustomLocationModal from './CustomLocationModal.js';
import { createUseWeatherService } from '../hooks/useWeatherService.js';
import { createUseGeocoder } from '../hooks/useGeocoder.js';
import { createTimedCache, fetchWithTimeout, formatTz } from '../utils/weatherHelpers';
import { FALLBACKS, DEFAULT_REFRESH_MS } from '../utils/weatherConstants';

const API_KEY = '75cb98e60f3fe4b06610b0936cab22ad';
const CACHE_TTL = { GEO: 3600000, WEATHER: 600000 };
const RATE_LIMIT = 1000;

const toC = (f: number) => Math.round((f - 32) * 5 / 9);
const formatTemp = (t: number | null | undefined, u: string) => (typeof t === 'number' ? (u === 'F' ? t : toC(t)) : null);
const formatLabel = (f: { name: string; city?: string; state?: string }) => {
  const s = [f.city, f.state].filter(Boolean).join(', ');
  return s ? `${f.name} (${s})` : f.name;
};

const WeatherWidget: React.FunctionComponent = () => {
  const useWeather = createUseWeatherService({
    useState: React.useState,
    useRef: React.useRef,
    useCallback: React.useCallback,
    createTimedCache,
    fetchWithTimeout,
    apiKey: API_KEY,
    cacheTtlMs: CACHE_TTL.WEATHER,
    rateLimitMs: RATE_LIMIT,
    formatTimezone: formatTz,
  });

  const useGeocoder = createUseGeocoder({
    useRef: React.useRef,
    useCallback: React.useCallback,
    createTimedCache,
    fetchWithTimeout,
    apiKey: API_KEY,
    cacheTtlMs: CACHE_TTL.GEO,
  });

  const { weatherData: w, weatherError: err, weatherLoading: load, timezoneLabel: tz, fetchWeather, setWeatherError } = useWeather();
  const geocode = useGeocoder();

  const [ui, setUi] = React.useState({ drop: false, modal: false, unit: 'F' as 'F' | 'C' });
  const [sel, setSel] = React.useState('Detecting location...');
  const [custom, setCustom] = React.useState<string[]>([]);
  const [coords, setCoords] = React.useState<{ lat: number; lon: number } | null>(null);
  const [refreshMs, setRefreshMs] = React.useState(DEFAULT_REFRESH_MS);

  const useFacilities = () => {
    const [list, setList] = React.useState<any[]>([]);
    React.useEffect(() => {
      let active = true;
      (async () => {
        try {
          const res = await fetch('/api/facilities');
          const d = await res.json();
          const raw = Array.isArray(d) ? d : (d.objs || d.facilities || []);
          if (!active) return;

          setList(raw.map((f: any) => {
            const l = f.location || f.coordinates || {};
            return {
              id: f.id || f.facilityId,
              name: f.name || f.facilityName,
              city: f.city || l.city,
              state: f.state || l.state,
              latitude: Number(f.latitude ?? l.latitude ?? l.lat ?? 0),
              longitude: Number(f.longitude ?? l.longitude ?? l.lon ?? 0),
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

  const useAutoLocation = (onFound: (label: string, lat: number, lon: number) => void) => {
    const [loc, setLoc] = React.useState({ label: 'Detecting...', value: 'Detecting...', lat: null as number | null, lon: null as number | null });
    React.useEffect(() => {
      let active = true;
      (async () => {
        try {
          const res = await fetchWithTimeout('https://ipapi.co/json/');
          const d = await res.json();
          const r = {
            label: `${d.city}, ${d.region_code} (Auto)`,
            value: 'auto-location',
            lat: parseFloat(d.latitude),
            lon: parseFloat(d.longitude),
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

  const facilities = useFacilities();

  const handleLoc = React.useCallback((lbl: string, lat: number, lon: number) => {
    if (lat == null || lon == null) return;
    setSel(lbl);
    setCoords({ lat, lon });
    fetchWeather(lat, lon);
  }, [fetchWeather]);

  const autoLoc = useAutoLocation(handleLoc);

  React.useEffect(() => {
    if (!coords) return;
    const id = setInterval(() => fetchWeather(coords.lat, coords.lon), refreshMs);
    return () => clearInterval(id);
  }, [coords, fetchWeather, refreshMs]);

  const handleSelect = React.useCallback(async (val: string, id: string) => {
    setUi(p => ({ ...p, drop: false }));
    if (id === 'custom-new') return setUi(p => ({ ...p, modal: true }));
    if (id === 'auto') return handleLoc(autoLoc.label, autoLoc.lat as number, autoLoc.lon as number);

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

  const sections = React.useMemo(() => [
    { id: 'auto', items: [{ id: 'auto', label: autoLoc.label, value: autoLoc.value }] },
    { id: 'fac', label: `FACILITIES (${facilities.length})`, items: facilities.map(f => ({ id: f.id, label: formatLabel(f), value: formatLabel(f) })) },
    { id: 'custom', items: [...custom.map((c, i) => ({ id: `c-${i}`, label: c, value: c })), { id: 'custom-new', label: 'Custom Location...', value: 'custom-new' }] },
  ], [autoLoc, facilities, custom]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <CustomLocationModal
        isOpen={ui.modal}
        onClose={() => setUi(p => ({ ...p, modal: false }))}
        onApply={(n: string, lat: number, lon: number) => { setCustom(p => (p.includes(n) ? p : [...p, n])); setUi(p => ({ ...p, modal: false })); handleLoc(n, lat, lon); }}
        geocodeLocation={geocode}
      />
      <DropdownContainer
        sections={sections}
        selectedValue={sel}
        selectedItems={[sel]}
        onSelect={handleSelect}
        isOpen={ui.drop}
        onOpenChange={(o: boolean) => setUi(p => ({ ...p, drop: o }))}
        width="240px"
      >
        <div style={{ padding: '8px 16px', background: '#fff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ddd' }}>
          <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{sel}</span>
          <span style={{ fontSize: 12, color: '#888' }}>▼</span>
        </div>
      </DropdownContainer>
      <WeatherDisplay
        temperature={formatTemp(w?.temperature, ui.unit)}
        unit={ui.unit}
        condition={w?.condition}
        error={err}
        loading={load}
        onUnitToggle={() => setUi(p => ({ ...p, unit: p.unit === 'F' ? 'C' : 'F' }))}
      />
      <span style={{ color: '#333', fontSize: 13 }}>{tz}</span>
    </div>
  );
};

export default WeatherWidget;
