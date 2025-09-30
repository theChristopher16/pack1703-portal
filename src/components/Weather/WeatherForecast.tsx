import React, { useState, useEffect } from 'react';
import { Cloud, Thermometer, Droplets, Wind, Sun, CloudRain, Zap } from 'lucide-react';
import { weatherService, WeatherForecast, WeatherLocation } from '../../services/weatherService';

interface WeatherForecastProps {
  location: WeatherLocation;
  eventDate: Date;
  className?: string;
  showDetails?: boolean;
}

const WeatherForecastComponent: React.FC<WeatherForecastProps> = ({
  location,
  eventDate,
  className = '',
  showDetails = false
}) => {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        const weatherData = await weatherService.getWeatherForecast(location, eventDate);
        setForecast(weatherData);
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Unable to load weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location, eventDate]);

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-gray-500 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span>Loading weather...</span>
      </div>
    );
  }

  if (error || !forecast) {
    // Check if event is too far in the future
    const today = new Date();
    const daysDifference = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference > 5) {
      return (
        <div className={`flex items-center space-x-2 text-sm text-gray-400 ${className}`}>
          <Cloud className="h-4 w-4" />
          <span>Forecast available {daysDifference - 5} days before event</span>
        </div>
      );
    }
    
    if (daysDifference < 0) {
      return (
        <div className={`flex items-center space-x-2 text-sm text-gray-400 ${className}`}>
          <Cloud className="h-4 w-4" />
          <span>Event has passed</span>
        </div>
      );
    }

    return (
      <div className={`flex items-center space-x-2 text-sm text-gray-400 ${className}`}>
        <Cloud className="h-4 w-4" />
        <span>Weather unavailable</span>
      </div>
    );
  }

  const getWeatherIcon = (iconCode: string) => {
    if (iconCode.startsWith('01')) return <Sun className="h-4 w-4 text-yellow-500" />;
    if (iconCode.startsWith('02') || iconCode.startsWith('03')) return <Cloud className="h-4 w-4 text-gray-500" />;
    if (iconCode.startsWith('09') || iconCode.startsWith('10')) return <CloudRain className="h-4 w-4 text-blue-500" />;
    if (iconCode.startsWith('11')) return <Zap className="h-4 w-4 text-purple-500" />;
    if (iconCode.startsWith('13')) return <CloudRain className="h-4 w-4 text-blue-300" />;
    return <Cloud className="h-4 w-4 text-gray-500" />;
  };

  const formatTemperature = (temp: number) => `${temp}°F`;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Weather Icon */}
      <div className="flex items-center">
        {getWeatherIcon(forecast.icon)}
      </div>

      {/* Temperature */}
      <div className="flex items-center space-x-1">
        <Thermometer className="h-3 w-3 text-gray-500" />
        <span className="text-sm font-medium">
          {formatTemperature(forecast.temperature.max)}/{formatTemperature(forecast.temperature.min)}
        </span>
      </div>

      {/* Weather Description */}
      <span className="text-sm text-gray-600 capitalize">
        {forecast.description}
      </span>

      {/* Additional Details (if showDetails is true) */}
      {showDetails && (
        <div className="flex items-center space-x-3 text-xs text-gray-500">
          {/* Humidity */}
          <div className="flex items-center space-x-1">
            <Droplets className="h-3 w-3" />
            <span>{forecast.humidity}%</span>
          </div>

          {/* Wind Speed */}
          <div className="flex items-center space-x-1">
            <Wind className="h-3 w-3" />
            <span>{forecast.windSpeed} mph</span>
          </div>

          {/* Precipitation */}
          {forecast.precipitation > 0 && (
            <div className="flex items-center space-x-1">
              <Droplets className="h-3 w-3" />
              <span>{forecast.precipitation}mm</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeatherForecastComponent;
