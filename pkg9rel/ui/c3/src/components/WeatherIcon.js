import { FaSun, FaCloudSun, FaCloud, FaCloudRain, FaSnowflake, FaWind, FaSmog, FaBolt, FaThermometerHalf } from 'react-icons/fa';
const e = React.createElement;

/**
 * WeatherIcon Component:
 * Maps text-based weather conditions to specific React Icons.
 */
const WeatherIcon = ({ condition, loading }) => {
    // Show spinner icon while network requests are active
    if (loading) return e('span', { style: { fontSize: 28 }, 'aria-label': 'Loading' }, '⏳');
    
    const c = (condition || '').toLowerCase();
    let Icon = FaThermometerHalf;
    
    // Pattern matching for diverse OpenWeatherMap condition strings
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

export default WeatherIcon;
