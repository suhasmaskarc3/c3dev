/**
 * Factory for creating the useGeocoder hook.
 * Handles geocoding by ZIP or City name via OpenWeatherMap API with caching.
 */
export const createUseGeocoder = ({ useRef, useCallback, createTimedCache, fetchWithTimeout, apiKey, cacheTtlMs }) => {
    if (!useRef || !useCallback) throw new Error('React hooks required');

    return () => {
        // Persistent cache across renders
        const cache = useRef(createTimedCache(cacheTtlMs));

        return useCallback(async (query) => {
            const q = (query || '').trim();
            if (!q) throw new Error('Location required');

            // Cache check
            const key = q.toLowerCase();
            const cached = cache.current.get(key);
            if (cached) return cached;

            // Determine strategy: ZIP vs Direct
            const isZip = /^\d{5}(?:-\d{4})?$/.test(q.replace(/\s+/g, ''));
            const endpoint = isZip ? 'zip' : 'direct';
            // Construct params: ZIP requires "zip={code},US", direct uses "q={name}&limit=1"
            const params = isZip ? `zip=${encodeURIComponent(q.replace(/\s+/g, ''))},US` : `q=${encodeURIComponent(q)}&limit=1`;
            const url = `https://api.openweathermap.org/geo/1.0/${endpoint}?${params}&appid=${apiKey}`;

            const res = await fetchWithTimeout(url);
            if (!res.ok) throw new Error('Geocoding unavailable');
            
            const json = await res.json();
            // Normalize result: ZIP returns object, Direct returns array
            const data = Array.isArray(json) ? json[0] : json;

            if (!data || (!isZip && Array.isArray(json) && json.length === 0)) {
                throw new Error(`Location "${q}" not found.`);
            }

            const lat = parseFloat(data.lat), lon = parseFloat(data.lon);
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('Invalid coordinates');

            // Format display name
            const label = isZip 
                ? `${data.name || q} (${q})` 
                : [data.name, data.state || data.country].filter(Boolean).join(', ');

            const result = { lat, lon, name: label || q };
            
            // Update cache
            cache.current.set(key, result);
            return result;
        }, []);
    };
};
