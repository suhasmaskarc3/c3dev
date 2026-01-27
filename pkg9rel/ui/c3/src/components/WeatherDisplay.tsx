import React from 'react';
import { FaSun, FaCloudSun, FaCloud, FaCloudRain, FaSnowflake, FaWind, FaSmog, FaBolt, FaThermometerHalf } from 'react-icons/fa';

// WeatherIcon Component: Maps text-based weather conditions to specific React Icons.
const WeatherIcon: React.FC<{ condition?: string; loading?: boolean }> = ({ condition, loading }) => {
  if (loading) return <span style={{ fontSize: 28 }} aria-label="Loading">⏳</span>;
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
  return <Icon size={28} title={condition} style={{ color: '#555' }} />;
};

const S = {
  container: { display: 'flex', alignItems: 'center', gap: 12 },
  temp: (err?: boolean) => ({ fontSize: 18, fontWeight: 600, color: err ? '#d32f2f' : '#333', cursor: 'pointer', userSelect: 'none', marginLeft: 8 }),
  text: (err?: boolean) => ({ fontSize: err ? 11 : 13, color: err ? '#d32f2f' : '#666', maxWidth: err ? 150 : 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })
};

export interface WeatherDisplayProps {
  temperature: number | null;
  unit: string;
  condition?: string;
  error?: string | null;
  loading?: boolean;
  onUnitToggle?: () => void;
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ temperature, unit, condition, error, loading, onUnitToggle }) => {
  return (
    <div style={S.container}>
      <WeatherIcon condition={condition} loading={loading} />
      <div onClick={onUnitToggle} style={S.temp(!!error)}>
        {typeof temperature === 'number' ? `${temperature}°${unit}` : `--°${unit}`}
      </div>
      {(condition || error) && (
        <div style={S.text(!!error)} title={error || condition || ''}>
          {error || condition}
        </div>
      )}
    </div>
  );
};

export default WeatherDisplay;
