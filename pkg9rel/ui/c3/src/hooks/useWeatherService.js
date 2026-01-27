/**
 * Factory for the useWeatherService hook.
 * Handles fetching, caching, and rate limiting for OpenWeatherMap API.
 */
export const createUseWeatherService = ({ 
    useState, useRef, useCallback, createTimedCache, fetchWithTimeout, 
    apiKey, cacheTtlMs, rateLimitMs, formatTimezone, fetchTimezoneName 
}) => {
    if (!useState || !useRef || !useCallback) throw new Error('React hooks required');

    return () => {
        // State mapped to external interface
        const [data, setData] = useState(null);
        const [err, setErr] = useState(null);
        const [loading, setLoading] = useState(false);
        const [tzLabel, setTzLabel] = useState('Detecting timezone...');
        
        const cache = useRef(createTimedCache(cacheTtlMs));
        const tzCache = useRef(createTimedCache(24 * 60 * 60 * 1000));
        const lastCall = useRef(0);

        const fetchWeather = useCallback(async (lat, lon) => {
            if (lat == null || lon == null) return null;

            // Cache hit
            const key = `${lat},${lon}`;
            const cached = cache.current.get(key);
            if (cached) {
                setData(cached); setTzLabel(formatTimezone(cached.timezone, cached.timezoneName)); setErr(null);
                return cached;
            }

            try {
                setLoading(true); setErr(null);

                // Rate limiting
                const wait = rateLimitMs - (Date.now() - lastCall.current);
                if (wait > 0) await new Promise(r => setTimeout(r, wait));
                lastCall.current = Date.now();

                const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;
                const res = await fetchWithTimeout(url);
                if (!res.ok) throw new Error('Weather API error');
                
                const json = await res.json();
                const w = json.weather?.[0];
                const cond = w?.description 
                    ? w.description.charAt(0).toUpperCase() + w.description.slice(1) 
                    : (w?.main || 'Unknown');

                const tzKey = `${lat},${lon}`;
                let timezoneName = tzCache.current.get(tzKey);
                if (!timezoneName && fetchTimezoneName) {
                    try { timezoneName = await fetchTimezoneName(lat, lon); } catch { timezoneName = null; }
                }
                if (timezoneName) tzCache.current.set(tzKey, timezoneName);

                const payload = {
                    temperature: json.main?.temp != null ? Math.round(json.main.temp) : null,
                    condition: cond,
                    humidity: json.main?.humidity ?? null,
                    windSpeed: json.wind?.speed != null ? Math.round(json.wind.speed) : null,
                    timezone: json.timezone ?? null,
                    timezoneName
                };

                cache.current.set(key, payload);
                setData(payload);
                setTzLabel(formatTimezone(payload.timezone, payload.timezoneName));
                return payload;

            } catch (e) {
                setData(null);
                setTzLabel('Unknown Timezone');
                setErr(e.message || 'Weather API error');
                return null;
            } finally {
                setLoading(false);
            }
        }, [apiKey, fetchWithTimeout, formatTimezone, rateLimitMs]);

        return { 
            weatherData: data, 
            weatherError: err, 
            weatherLoading: loading, 
            timezoneLabel: tzLabel, 
            fetchWeather, 
            setWeatherError: setErr 
        };
    };
};
