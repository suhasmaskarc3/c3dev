import WeatherIcon from './WeatherIcon.js';
const e = React.createElement;

const S = {
    container: { display: 'flex', alignItems: 'center', gap: 12 },
    temp: (err) => ({ fontSize: 18, fontWeight: 600, color: err ? '#d32f2f' : '#333', cursor: 'pointer', userSelect: 'none', marginLeft: 8 }),
    text: (err) => ({ fontSize: err ? 11 : 13, color: err ? '#d32f2f' : '#666', maxWidth: err ? 150 : 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })
};

/**
 * WeatherDisplay Component
 * Compact navbar UI for temperature and conditions.
 */
const WeatherDisplay = ({ temperature, unit, condition, error, loading, onUnitToggle }) => {
    return e('div', { style: S.container },
        e(WeatherIcon, { condition, loading }),
        e('div', { onClick: onUnitToggle, style: S.temp(error) }, typeof temperature === 'number' ? `${temperature}°${unit}` : `--°${unit}`),
        (condition || error) && e('div', { style: S.text(!!error), title: error || condition }, error || condition)
    );
};

export default WeatherDisplay;
