import React from 'react';
import { FaSun, FaCloudSun, FaCloud, FaCloudRain, FaSnowflake, FaWind, FaSmog, FaBolt, FaThermometerHalf } from 'react-icons/fa';
const e = React.createElement;

// Map weather condition text to an icon; keep simple visual feedback in the navbar.
const WeatherIcon = ({ condition, loading }) => {
  if (loading) return e('span', { style: { fontSize: 28 }, 'aria-label': 'Loading' }, '⏳');
  const c = (condition || '').toLowerCase();
  let Icon = FaThermometerHalf;
  if (c.includes('clear') || c.includes('sun')) Icon = FaSun;
  else if (c.includes('partly')) Icon = FaCloudSun;
  else if (c.includes('cloud')) Icon = FaCloud;
  else if (c.includes('rain') || c.includes('drizzle')) Icon = FaCloudRain;
  else if (c.includes('snow') || c.includes('sleet') || c.includes('hail')) Icon = FaSnowflake;
  else if (c.includes('wind')) Icon = FaWind;
  else if (c.includes('fog') || c.includes('haze') || c.includes('smog')) Icon = FaSmog;
  else if (c.includes('thunder')) Icon = FaBolt;
  return e(Icon, { size: 28, title: condition, style: { color: '#555' } });
};

const S = {
  container: { display: 'flex', alignItems: 'center', gap: 12 },
  temp: (err) => ({ fontSize: 18, fontWeight: 600, color: err ? '#d32f2f' : '#333', cursor: 'pointer', userSelect: 'none', marginLeft: 8 }),
  text: (err) => ({ fontSize: err ? 11 : 13, color: err ? '#d32f2f' : '#666', maxWidth: err ? 150 : 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })
};

const WeatherDisplay = ({ temperature, unit, condition, error, loading, onUnitToggle }) => {
  return e('div', { style: S.container },
    e(WeatherIcon, { condition, loading }),
    e('div', { onClick: onUnitToggle, style: S.temp(!!error) }, typeof temperature === 'number' ? `${temperature}°${unit}` : `--°${unit}`),
    (condition || error) && e('div', { style: S.text(!!error), title: error || condition || '' }, error || condition)
  );
};

export default WeatherDisplay;
