import { useState, useEffect, useCallback } from 'react';

// Fallback data for offline/error modes
const FALLBACK_FACILITIES = [
    { id: 'fac-001', name: 'Main Facility', city: 'New York', state: 'NY', latitude: 40.7128, longitude: -74.006, type: 'headquarters' },
    { id: 'fac-002', name: 'West Coast Hub', city: 'Los Angeles', state: 'CA', latitude: 34.0522, longitude: -118.2437, type: 'regional' },
    { id: 'fac-003', name: 'Central Office', city: 'Chicago', state: 'IL', latitude: 41.8781, longitude: -87.6298, type: 'regional' }
];

// Normalize flexible C3 API responses into a strict interface
const normalize = (f: any) => {
    const l = f.location || f.coordinates || {};
    return {
        id: f.id || f.facilityId,
        name: f.name || f.facilityName || f.label,
        city: f.city || l.city || f.locationName || f.cityName || '',
        state: f.state || l.state || f.stateCode || f.region || '',
        latitude: Number(f.latitude ?? f.geometry?.latitude ?? l.latitude ?? l.lat ?? 0),
        longitude: Number(f.longitude ?? f.geometry?.longitude ?? l.longitude ?? l.lon ?? 0),
        type: f.type || f.facilityType
    };
};

/**
 * useFacilities Hook
 * Fetches facility data and manages selection state.
 */
const useFacilities = () => {
    const [list, setList] = useState<any[]>([]);
    const [sel, setSel] = useState<string[]>([]);
    const [load, setLoad] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // Fetch data on mount
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                setLoad(true); setErr(null);
                const res = await fetch('/api/facilities');
                if (!res.ok) throw new Error('API Error');
                const d = await res.json();
                const raw = Array.isArray(d) ? d : (d.objs || d.facilities || d.results || []);
                if (active) setList(raw.map(normalize));
            } catch (e) {
                console.warn('Facility fetch error', e);
                if (active) { setErr('Fetch failed'); setList(FALLBACK_FACILITIES); }
            } finally {
                if (active) setLoad(false);
            }
        })();
        return () => { active = false; };
    }, []);

    // Selection helpers
    const select = useCallback((id: string) => setSel(p => p.includes(id) ? p : [...p, id]), []);
    const deselect = useCallback((id: string) => setSel(p => p.filter(x => x !== id)), []);
    const clear = useCallback(() => setSel([]), []);
    
    // Coordinate lookup
    const getCoords = useCallback((id: string) => {
        const f = list.find(x => x.id === id);
        if (!f) return null;
        const lat = Number(f.latitude), lon = Number(f.longitude);
        return (Number.isFinite(lat) && Number.isFinite(lon)) ? { lat, lon } : null;
    }, [list]);

    return { 
        facilities: list, selectedFacilities: sel, loading: load, error: err, 
        selectFacility: select, deselectFacility: deselect, clearSelection: clear, getFacilityCoordinates: getCoords 
    };
};


export { FALLBACK_FACILITIES };
export default useFacilities;
