// Helper for compact style objects
const S = {
    menu: (w, h) => ({ position: 'absolute' 
        , backgroundColor: '#fff'
         , border: '1px solid #ddd'
    }),
    item: (disabled, isHigh) => ({ 
        padding: '10px 12px'
    }),
     div: { height: '1px', backgroundColor: '#eee', margin: '4px 0' }
};

/**
 * DropdownContainer Component
 * A reusable, accessible dropdown menu with keyboard support and virtualization-ready structure.
 */
const DropdownContainer = ({ sections, selectedValue, onSelect, isOpen, onOpenChange, children, maxHeight = '300px', width = '250px', selectedItems = [] }) => {
    const ref = React.useRef(null);
    const [hlIdx, setHlIdx] = React.useState(0);
    
    // Flatten approach simplifies keyboard navigation across sections
    const all = React.useMemo(() => sections.flatMap(s => s.items), [sections]);

    // Handle clicks outside and keyboard navigation (Arrows, Enter, Escape)
    React.useEffect(() => {
        if (!isOpen) return;
        const click = (ev) => !ref.current?.contains(ev.target) && onOpenChange(false);
        const key = (ev) => {
            if (ev.key === 'ArrowDown') { ev.preventDefault(); setHlIdx(i => Math.min(i + 1, all.length - 1)); }
            else if (ev.key === 'ArrowUp') { ev.preventDefault(); setHlIdx(i => Math.max(i - 1, 0)); }
            else if (ev.key === 'Enter') { 
                ev.preventDefault(); 
                const item = all[hlIdx];
                if (item && !item.disabled) { onSelect(item.value, item.id); onOpenChange(false); }
            }
            else if (ev.key === 'Escape') { ev.preventDefault(); onOpenChange(false); }
        };
        document.addEventListener('mousedown', click);
        document.addEventListener('keydown', key);
        return () => { document.removeEventListener('mousedown', click); document.removeEventListener('keydown', key); };
    }, [isOpen, hlIdx, all, onSelect, onOpenChange]);

    // Ensure highlighted index matches selected value when opened
    React.useEffect(() => {
        if (isOpen) {
            const idx = all.findIndex(i => i.value === selectedValue);
            setHlIdx(idx >= 0 ? idx : 0);
        }
    }, [isOpen, selectedValue, all]);

    return React.createElement('div', { ref, style: { position: 'relative', display: 'inline-block' } },
        React.createElement('div', { onClick: () => onOpenChange(!isOpen), style: { cursor: 'pointer' } }, children),
        isOpen && React.createElement('div', { style: { ...S.menu(width, maxHeight), top: '100%', left: 0, marginTop: 8 } },
            sections.map((sec, i) => React.createElement('div', { key: sec.id },
                sec.label && React.createElement('div', { style: S.label }, sec.label),
                sec.items.map(item => {
                    const gIdx = all.findIndex(x => x.id === item.id);
                    return React.createElement('div', {
                        key: item.id,
                        onClick: () => !item.disabled && (onSelect(item.value, item.id), onOpenChange(false)),
                        onMouseEnter: () => !item.disabled && setHlIdx(gIdx),
                        style: S.item(item.disabled, gIdx === hlIdx)
                    }, React.createElement('span', null, item.label), (item.value === selectedValue || selectedItems.includes(item.id)) && React.createElement('span', { style: S.check }, '✓'));
                }),
                i < sections.length - 1 && React.createElement('div', { style: S.div })
            ))
        )
    );
};

export default DropdownContainer;
