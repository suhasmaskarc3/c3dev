// Compact styles object
const S = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modal: { backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', width: '90%', maxWidth: '400px', padding: '24px' },
    inputParams: { display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '4px', padding: '8px', marginBottom: '8px', backgroundColor: '#fff' },
    input: { border: 'none', backgroundColor: 'transparent', flex: 1, fontSize: '14px', outline: 'none', fontFamily: 'inherit', minWidth: 0 },
    err: { fontSize: '12px', color: '#d32f2f', minHeight: '18px', marginTop: '4px' },
    btn: (primary, loading) => ({
        padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 500,
        backgroundColor: primary ? (loading ? '#ccc' : '#2196F3') : '#f0f0f0', 
        color: primary ? '#fff' : (loading ? '#999' : '#333'), opacity: loading ? 0.7 : 1
    })
};

/**
 * CustomLocationModal
 * A simplified modal dialog for inputting a custom city/zip location.
 * Handles validation, geocoding calls, and focus management.
 */
const CustomLocationModal = ({ isOpen, onClose, onApply, geocodeLocation }) => {
    const [val, setVal] = React.useState('');
    const [err, setErr] = React.useState('');
    const [load, setLoad] = React.useState(false);
    const inpRef = React.useRef(null);
    const modRef = React.useRef(null);

    // Lifecycle: Handle focus, body scroll locking, and click-outside/escape dismissal
    React.useEffect(() => {
        if (!isOpen) return;
        setVal(''); setErr(''); setLoad(false); 
        // Slight delay to ensure visibility before focus
        const timer = setTimeout(() => inpRef.current?.focus(), 50);
        document.body.style.overflow = 'hidden';
        
        const exit = (ev) => {
            if ((ev.type === 'keydown' && ev.key === 'Escape') || 
                (ev.type === 'mousedown' && !modRef.current?.contains(ev.target))) {
                onClose();
            }
        };

        document.addEventListener('mousedown', exit); 
        document.addEventListener('keydown', exit);
        return () => { 
            clearTimeout(timer);
            document.body.style.overflow = 'auto'; 
            document.removeEventListener('mousedown', exit); 
            document.removeEventListener('keydown', exit); 
        };
    }, [isOpen, onClose]);

    const submit = async () => {
        const q = val.trim();
        if (!q) return setErr('Please enter a location');
        if (!/^[a-zA-Z0-9,\s\-.]+$/.test(q)) return setErr('Invalid characters');
        
        setLoad(true);
        try { 
            const res = await geocodeLocation(q); 
            onApply(res.name || q, res.lat, res.lon); 
        } catch (e) { 
            setErr(e.message || 'Location not found'); 
        } finally { 
            setLoad(false); 
        }
    };

    if (!isOpen) return null;

    return React.createElement('div', { style: S.overlay },
        React.createElement('div', { ref: modRef, style: S.modal },
            React.createElement('h2', { style: { fontSize: '18px', fontWeight: 600, color: '#2c3e50', marginBottom: '20px', marginTop: 0 } }, 'Add Custom Location'),
            React.createElement('div', { style: { marginBottom: '20px' } },
                React.createElement('div', { style: S.inputParams },
                    React.createElement('span', { style: { marginRight: '8px', userSelect: 'none' } }, '🔍'),
                    React.createElement('input', { 
                        ref: inpRef, 
                        value: val, 
                        placeholder: 'e.g. New York, NY or 10001', 
                        style: S.input, 
                        onChange: e => { setVal(e.target.value); if(err) setErr(''); },
                        onKeyDown: e => e.key === 'Enter' && submit(),
                        disabled: load
                    })
                ),
                err && React.createElement('div', { style: S.err }, err)
            ),
            React.createElement('div', { style: { display: 'flex', gap: '8px', justifyContent: 'flex-end' } },
                React.createElement('button', { onClick: onClose, disabled: load, style: S.btn(false, load) }, 'Cancel'),
                React.createElement('button', { onClick: submit, disabled: load, style: S.btn(true, load) }, load ? 'Locating...' : 'Apply')
            )
        )
    );
};
export default CustomLocationModal;
