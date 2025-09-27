import React, { useState, useEffect } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Gauge, 
  Wind, 
  Activity, 
  Eye,
  Play,
  Pause,
  RefreshCw,
  Info,
  Leaf,
  Sun,
  CloudRain,
  Zap
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';

// Mock sensor data types
interface SensorReading {
  timestamp: number;
  value: number;
  unit: string;
}

interface BME680Reading {
  timestamp: number;
  temperature: number;
  humidity: number;
  pressure: number;
  gasResistance: number;
  airQualityIndex: number;
}

interface SensorData {
  temperature: SensorReading[];
  humidity: SensorReading[];
  pressure: SensorReading[];
  airQuality: SensorReading[];
  light: SensorReading[];
  soilMoisture: SensorReading[];
  bme680: BME680Reading[];
}

interface EcologyData {
  sensors: SensorData;
  lastUpdated: number;
  isLive: boolean;
  location: string;
}

// Mock data generator
const generateMockData = (): EcologyData => {
  const now = Date.now();
  const generateSensorData = (baseValue: number, variance: number, unit: string): SensorReading[] => {
    return Array.from({ length: 24 }, (_, i) => ({
      timestamp: now - (23 - i) * 300000, // 5-minute intervals
      value: baseValue + (Math.random() - 0.5) * variance,
      unit
    }));
  };

  // Generate BME680 sensor data
  const generateBME680Data = (): BME680Reading[] => {
    return Array.from({ length: 24 }, (_, i) => ({
      timestamp: now - (23 - i) * 300000, // 5-minute intervals
      temperature: 22 + (Math.random() - 0.5) * 4, // °C
      humidity: 45 + (Math.random() - 0.5) * 15, // %
      pressure: 1013 + (Math.random() - 0.5) * 10, // hPa
      gasResistance: 50000 + (Math.random() - 0.5) * 20000, // ohms
      airQualityIndex: 50 + (Math.random() - 0.5) * 30 // AQI
    }));
  };

  return {
    sensors: {
      temperature: generateSensorData(22, 4, '°C'),
      humidity: generateSensorData(45, 15, '%'),
      pressure: generateSensorData(1013, 10, 'hPa'),
      airQuality: generateSensorData(50, 20, 'AQI'),
      light: generateSensorData(800, 200, 'lux'),
      soilMoisture: generateSensorData(60, 20, '%'),
      bme680: generateBME680Data()
    },
    lastUpdated: now,
    isLive: true,
    location: 'Pack 1703 Scout Garden'
  };
};

const EcologyDashboard: React.FC = () => {
  const [ecologyData, setEcologyData] = useState<EcologyData>(generateMockData());
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [showRawData, setShowRawData] = useState(false);

  // Simulate real-time data updates
  useEffect(() => {
    if (!isLiveMode) return;

    const interval = setInterval(() => {
      setEcologyData(prevData => {
        const newData = generateMockData();
        return {
          ...newData,
          sensors: {
            ...newData.sensors,
            // Keep some historical data for continuity
            temperature: [...prevData.sensors.temperature.slice(1), newData.sensors.temperature[23]],
            humidity: [...prevData.sensors.humidity.slice(1), newData.sensors.humidity[23]],
            pressure: [...prevData.sensors.pressure.slice(1), newData.sensors.pressure[23]],
            airQuality: [...prevData.sensors.airQuality.slice(1), newData.sensors.airQuality[23]],
            light: [...prevData.sensors.light.slice(1), newData.sensors.light[23]],
            soilMoisture: [...prevData.sensors.soilMoisture.slice(1), newData.sensors.soilMoisture[23]],
            bme680: [...prevData.sensors.bme680.slice(1), newData.sensors.bme680[23]]
          }
        };
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isLiveMode]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatValue = (value: number, unit: string) => {
    return `${value.toFixed(1)}${unit}`;
  };

  const getCurrentReading = (readings: SensorReading[] | BME680Reading[]) => {
    return readings[readings.length - 1] as SensorReading;
  };

  const getStatusColor = (sensor: string, value: number) => {
    switch (sensor) {
      case 'temperature':
        return value < 15 ? 'text-blue-600' : value > 30 ? 'text-red-600' : 'text-green-600';
      case 'humidity':
        return value < 30 ? 'text-yellow-600' : value > 70 ? 'text-blue-600' : 'text-green-600';
      case 'pressure':
        return value < 1000 ? 'text-red-600' : value > 1030 ? 'text-blue-600' : 'text-green-600';
      case 'airQuality':
        return value < 50 ? 'text-green-600' : value > 100 ? 'text-red-600' : 'text-yellow-600';
      case 'light':
        return value < 200 ? 'text-gray-600' : value > 1000 ? 'text-yellow-600' : 'text-green-600';
      case 'soilMoisture':
        return value < 30 ? 'text-red-600' : value > 80 ? 'text-blue-600' : 'text-green-600';
      case 'gasResistance':
        return value < 30000 ? 'text-red-600' : value > 80000 ? 'text-green-600' : 'text-yellow-600';
      case 'bme680Temperature':
        return value < 15 ? 'text-blue-600' : value > 30 ? 'text-red-600' : 'text-green-600';
      case 'bme680Humidity':
        return value < 30 ? 'text-yellow-600' : value > 70 ? 'text-blue-600' : 'text-green-600';
      case 'bme680Pressure':
        return value < 1000 ? 'text-red-600' : value > 1030 ? 'text-blue-600' : 'text-green-600';
      case 'bme680AirQuality':
        return value < 50 ? 'text-green-600' : value > 100 ? 'text-red-600' : 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (sensor: string, value: number) => {
    switch (sensor) {
      case 'temperature':
        return value < 15 ? <CloudRain className="w-5 h-5" /> : value > 30 ? <Sun className="w-5 h-5" /> : <Thermometer className="w-5 h-5" />;
      case 'humidity':
        return <Droplets className="w-5 h-5" />;
      case 'pressure':
        return <Gauge className="w-5 h-5" />;
      case 'airQuality':
        return <Wind className="w-5 h-5" />;
      case 'light':
        return <Sun className="w-5 h-5" />;
      case 'soilMoisture':
        return <Leaf className="w-5 h-5" />;
      case 'gasResistance':
        return <Zap className="w-5 h-5" />;
      case 'bme680Temperature':
        return value < 15 ? <CloudRain className="w-5 h-5" /> : value > 30 ? <Sun className="w-5 h-5" /> : <Thermometer className="w-5 h-5" />;
      case 'bme680Humidity':
        return <Droplets className="w-5 h-5" />;
      case 'bme680Pressure':
        return <Gauge className="w-5 h-5" />;
      case 'bme680AirQuality':
        return <Wind className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const sensorCards = [
    { key: 'temperature', label: 'Temperature', icon: Thermometer, color: 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
    { key: 'humidity', label: 'Humidity', icon: Droplets, color: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { key: 'pressure', label: 'Pressure', icon: Gauge, color: 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { key: 'airQuality', label: 'Air Quality', icon: Wind, color: 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { key: 'light', label: 'Light Level', icon: Sun, color: 'bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
    { key: 'soilMoisture', label: 'Soil Moisture', icon: Leaf, color: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' }
  ];

  // BME680 sensor cards
  const bme680Cards = [
    { key: 'bme680Temperature', label: 'BME680 Temp', icon: Thermometer, color: 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
    { key: 'bme680Humidity', label: 'BME680 Humidity', icon: Droplets, color: 'bg-gradient-to-br from-cyan-50 to-cyan-100/50 border-cyan-200', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
    { key: 'bme680Pressure', label: 'BME680 Pressure', icon: Gauge, color: 'bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-200', iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
    { key: 'gasResistance', label: 'Gas Resistance', icon: Zap, color: 'bg-gradient-to-br from-pink-50 to-pink-100/50 border-pink-200', iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
    { key: 'bme680AirQuality', label: 'BME680 Air Quality', icon: Wind, color: 'bg-gradient-to-br from-teal-50 to-teal-100/50 border-teal-200', iconBg: 'bg-teal-100', iconColor: 'text-teal-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-white/95 to-green-50/50 backdrop-blur-sm rounded-3xl border border-green-100 shadow-lg p-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center mb-3">
                <div className="p-3 bg-green-100 rounded-2xl mr-4 shadow-lg">
                  <Leaf className="w-10 h-10 text-green-600" />
                </div>
                Ecology Dashboard
              </h1>
              <p className="text-xl text-gray-700 mb-2">🌱 Real-time environmental monitoring for Pack 1703</p>
              <p className="text-lg text-gray-600 flex items-center mb-6">
                📍 {ecologyData.location}
              </p>
              
              {/* Control Buttons Below Location */}
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => setIsLiveMode(!isLiveMode)}
                  className={`flex items-center justify-center px-6 py-3 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto ${
                    isLiveMode 
                      ? 'bg-gradient-to-r from-green-400 to-green-600 text-white border border-green-300 hover:from-green-500 hover:to-green-700' 
                      : 'bg-gradient-to-r from-gray-400 to-gray-600 text-white border border-gray-300 hover:from-gray-500 hover:to-gray-700'
                  }`}
                >
                  {isLiveMode ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                  {isLiveMode ? 'Live' : 'Paused'}
                </button>
                <button
                  onClick={() => setEcologyData(generateMockData())}
                  className="flex items-center justify-center px-6 py-3 rounded-2xl font-bold text-lg bg-gradient-to-r from-blue-400 to-blue-600 text-white border border-blue-300 hover:from-blue-500 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Status */}
        {isLiveMode && (
          <div className="mb-6 flex items-center justify-center">
            <div className="flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="font-medium">Live Data • Last updated: {formatTime(ecologyData.lastUpdated)}</span>
            </div>
          </div>
        )}

        {/* Sensor Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {sensorCards.map(({ key, label, icon: Icon, color, iconBg, iconColor }) => {
            const currentReading = getCurrentReading(ecologyData.sensors[key as keyof SensorData]);
            const statusColor = getStatusColor(key, currentReading.value);
            const StatusIcon = getStatusIcon(key, currentReading.value);

            return (
              <div key={key} className={`bg-white/95 backdrop-blur-sm rounded-3xl border shadow-lg p-6 hover:shadow-xl transition-all duration-300 ${color} group`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-3 ${iconBg} rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{label}</h3>
                  </div>
                  <div className={`${statusColor} p-2 rounded-lg bg-white/50`}>
                    {StatusIcon}
                  </div>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2 group-hover:scale-105 transition-transform duration-300">
                  {formatValue(currentReading.value, currentReading.unit)}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  📅 {formatTime(currentReading.timestamp)}
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  {isLiveMode ? '🟢 Live' : '⏸️ Paused'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="space-y-8 mb-8">
          {/* Row 1: Temperature and Humidity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Temperature Chart */}
            <div className="bg-gradient-to-br from-white/95 to-red-50/50 backdrop-blur-sm rounded-3xl border border-red-100 shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="p-2 bg-red-100 rounded-xl mr-3">
                  <Thermometer className="w-6 h-6 text-red-600" />
                </div>
                Temperature Trends
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ecologyData.sensors.temperature}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => formatTime(value)}
                    fontSize={12}
                    stroke="#6b7280"
                  />
                  <YAxis fontSize={12} stroke="#6b7280" />
                  <Tooltip 
                    labelFormatter={(value) => formatTime(Number(value))}
                    formatter={(value: number, name) => [formatValue(value, '°C'), 'Temperature']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Humidity Chart */}
            <div className="bg-gradient-to-br from-white/95 to-blue-50/50 backdrop-blur-sm rounded-3xl border border-blue-100 shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="p-2 bg-blue-100 rounded-xl mr-3">
                  <Droplets className="w-6 h-6 text-blue-600" />
                </div>
                Humidity Trends
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={ecologyData.sensors.humidity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => formatTime(value)}
                    fontSize={12}
                    stroke="#6b7280"
                  />
                  <YAxis fontSize={12} stroke="#6b7280" />
                  <Tooltip 
                    labelFormatter={(value) => formatTime(Number(value))}
                    formatter={(value: number, name) => [formatValue(value, '%'), 'Humidity']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    fill="url(#humidityGradient)"
                    fillOpacity={0.4}
                    strokeWidth={3}
                  />
                  <defs>
                    <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Pressure and Air Quality */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pressure Chart */}
            <div className="bg-gradient-to-br from-white/95 to-purple-50/50 backdrop-blur-sm rounded-3xl border border-purple-100 shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="p-2 bg-purple-100 rounded-xl mr-3">
                  <Gauge className="w-6 h-6 text-purple-600" />
                </div>
                Atmospheric Pressure
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ecologyData.sensors.pressure}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => formatTime(value)}
                    fontSize={12}
                    stroke="#6b7280"
                  />
                  <YAxis fontSize={12} stroke="#6b7280" />
                  <Tooltip 
                    labelFormatter={(value) => formatTime(Number(value))}
                    formatter={(value: number, name) => [formatValue(value, 'hPa'), 'Pressure']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2, fill: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Air Quality Chart */}
            <div className="bg-gradient-to-br from-white/95 to-green-50/50 backdrop-blur-sm rounded-3xl border border-green-100 shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="p-2 bg-green-100 rounded-xl mr-3">
                  <Wind className="w-6 h-6 text-green-600" />
                </div>
                Air Quality Index
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={ecologyData.sensors.airQuality}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => formatTime(value)}
                    fontSize={12}
                    stroke="#6b7280"
                  />
                  <YAxis fontSize={12} stroke="#6b7280" />
                  <Tooltip 
                    labelFormatter={(value) => formatTime(Number(value))}
                    formatter={(value: number, name) => [formatValue(value, 'AQI'), 'Air Quality']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    fill="url(#airQualityGradient)"
                    fillOpacity={0.4}
                    strokeWidth={3}
                  />
                  <defs>
                    <linearGradient id="airQualityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 3: Light and Soil Moisture */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Light Level Chart */}
            <div className="bg-gradient-to-br from-white/95 to-yellow-50/50 backdrop-blur-sm rounded-3xl border border-yellow-100 shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="p-2 bg-yellow-100 rounded-xl mr-3">
                  <Sun className="w-6 h-6 text-yellow-600" />
                </div>
                Light Intensity
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ecologyData.sensors.light}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => formatTime(value)}
                    fontSize={12}
                    stroke="#6b7280"
                  />
                  <YAxis fontSize={12} stroke="#6b7280" />
                  <Tooltip 
                    labelFormatter={(value) => formatTime(Number(value))}
                    formatter={(value: number, name) => [formatValue(value, 'lux'), 'Light']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="url(#lightGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="lightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Soil Moisture Chart */}
            <div className="bg-gradient-to-br from-white/95 to-emerald-50/50 backdrop-blur-sm rounded-3xl border border-emerald-100 shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="p-2 bg-emerald-100 rounded-xl mr-3">
                  <Leaf className="w-6 h-6 text-emerald-600" />
                </div>
                Soil Moisture
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={ecologyData.sensors.soilMoisture}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => formatTime(value)}
                    fontSize={12}
                    stroke="#6b7280"
                  />
                  <YAxis fontSize={12} stroke="#6b7280" />
                  <Tooltip 
                    labelFormatter={(value) => formatTime(Number(value))}
                    formatter={(value: number, name) => [formatValue(value, '%'), 'Soil Moisture']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#059669" 
                    fill="url(#soilGradient)"
                    fillOpacity={0.4}
                    strokeWidth={3}
                  />
                  <defs>
                    <linearGradient id="soilGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BME680 Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* BME680 Temperature Chart */}
            <div className="bg-gradient-to-br from-white/95 to-orange-50/50 backdrop-blur-sm rounded-3xl border border-orange-100 shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="p-2 bg-orange-100 rounded-xl mr-3">
                  <Thermometer className="w-6 h-6 text-orange-600" />
                </div>
                BME680 Temperature
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ecologyData.sensors.bme680}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => formatTime(value)}
                    fontSize={12}
                    stroke="#6b7280"
                  />
                  <YAxis fontSize={12} stroke="#6b7280" />
                  <Tooltip 
                    labelFormatter={(value) => formatTime(Number(value))}
                    formatter={(value: number, name) => [formatValue(value, '°C'), 'BME680 Temperature']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#f97316" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, stroke: '#f97316', strokeWidth: 2, fill: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* BME680 Gas Resistance Chart */}
            <div className="bg-gradient-to-br from-white/95 to-pink-50/50 backdrop-blur-sm rounded-3xl border border-pink-100 shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="p-2 bg-pink-100 rounded-xl mr-3">
                  <Zap className="w-6 h-6 text-pink-600" />
                </div>
                Gas Resistance
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={ecologyData.sensors.bme680}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => formatTime(value)}
                    fontSize={12}
                    stroke="#6b7280"
                  />
                  <YAxis fontSize={12} stroke="#6b7280" />
                  <Tooltip 
                    labelFormatter={(value) => formatTime(Number(value))}
                    formatter={(value: number, name) => [formatValue(value, 'Ω'), 'Gas Resistance']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="gasResistance" 
                    stroke="#ec4899" 
                    fill="url(#gasResistanceGradient)"
                    fillOpacity={0.4}
                    strokeWidth={3}
                  />
                  <defs>
                    <linearGradient id="gasResistanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BME680 Humidity and Pressure Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* BME680 Humidity Chart */}
            <div className="bg-gradient-to-br from-white/95 to-cyan-50/50 backdrop-blur-sm rounded-3xl border border-cyan-100 shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="p-2 bg-cyan-100 rounded-xl mr-3">
                  <Droplets className="w-6 h-6 text-cyan-600" />
                </div>
                BME680 Humidity
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={ecologyData.sensors.bme680}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => formatTime(value)}
                    fontSize={12}
                    stroke="#6b7280"
                  />
                  <YAxis fontSize={12} stroke="#6b7280" />
                  <Tooltip 
                    labelFormatter={(value) => formatTime(Number(value))}
                    formatter={(value: number, name) => [formatValue(value, '%'), 'BME680 Humidity']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="humidity" 
                    stroke="#06b6d4" 
                    fill="url(#bme680HumidityGradient)"
                    fillOpacity={0.4}
                    strokeWidth={3}
                  />
                  <defs>
                    <linearGradient id="bme680HumidityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* BME680 Pressure Chart */}
            <div className="bg-gradient-to-br from-white/95 to-violet-50/50 backdrop-blur-sm rounded-3xl border border-violet-100 shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="p-2 bg-violet-100 rounded-xl mr-3">
                  <Gauge className="w-6 h-6 text-violet-600" />
                </div>
                BME680 Pressure
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ecologyData.sensors.bme680}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => formatTime(value)}
                    fontSize={12}
                    stroke="#6b7280"
                  />
                  <YAxis fontSize={12} stroke="#6b7280" />
                  <Tooltip 
                    labelFormatter={(value) => formatTime(Number(value))}
                    formatter={(value: number, name) => [formatValue(value, 'hPa'), 'BME680 Pressure']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pressure" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2, fill: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Educational Section */}
        <div className="bg-gradient-to-br from-white/95 to-blue-50/50 backdrop-blur-sm rounded-3xl border border-blue-100 shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="p-3 bg-blue-100 rounded-2xl mr-4 shadow-lg">
              <Info className="w-8 h-8 text-blue-600" />
            </div>
            🎓 What We're Learning
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-6 border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <h4 className="font-bold text-green-800 mb-3 text-lg">🌡️ Temperature</h4>
              <div className="bg-green-200/50 rounded-lg p-3 mb-3">
                <p className="text-sm font-semibold text-green-800">📊 Good Range: 18-24°C</p>
                <p className="text-xs text-green-700">❄️ Too cold: Below 15°C • 🔥 Too hot: Above 30°C</p>
              </div>
              <p className="text-green-700 leading-relaxed">
                Plants grow best between 18-24°C. Our garden temperature helps us understand 
                when to plant different vegetables and how weather affects our crops!
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <h4 className="font-bold text-blue-800 mb-3 text-lg">💧 Humidity</h4>
              <div className="bg-blue-200/50 rounded-lg p-3 mb-3">
                <p className="text-sm font-semibold text-blue-800">📊 Good Range: 40-60%</p>
                <p className="text-xs text-blue-700">🏜️ Too dry: Below 30% • 🌧️ Too wet: Above 70%</p>
              </div>
              <p className="text-blue-700 leading-relaxed">
                Humidity affects how much water plants need. Too dry and they wilt, 
                too wet and they can get sick! We learn to balance moisture for healthy plants.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-6 border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <h4 className="font-bold text-purple-800 mb-3 text-lg">🌬️ Air Quality</h4>
              <div className="bg-purple-200/50 rounded-lg p-3 mb-3">
                <p className="text-sm font-semibold text-purple-800">📊 Good Range: 0-50 AQI</p>
                <p className="text-xs text-purple-700">⚠️ Moderate: 51-100 • 🚨 Unhealthy: Above 100</p>
              </div>
              <p className="text-purple-700 leading-relaxed">
                Clean air helps plants grow better and keeps our garden healthy. 
                We monitor this to keep our environment safe for everyone!
              </p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-2xl p-6 border border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <h4 className="font-bold text-yellow-800 mb-3 text-lg">☀️ Light Levels</h4>
              <div className="bg-yellow-200/50 rounded-lg p-3 mb-3">
                <p className="text-sm font-semibold text-yellow-800">📊 Good Range: 200-1000 lux</p>
                <p className="text-xs text-yellow-700">🌑 Too dim: Below 200 lux • ☀️ Very bright: Above 1000 lux</p>
              </div>
              <p className="text-yellow-700 leading-relaxed">
                Plants need sunlight to make food through photosynthesis! We track light levels 
                to understand which areas get the most sun for our garden.
              </p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-6 border border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <h4 className="font-bold text-emerald-800 mb-3 text-lg">🌱 Soil Moisture</h4>
              <div className="bg-emerald-200/50 rounded-lg p-3 mb-3">
                <p className="text-sm font-semibold text-emerald-800">📊 Good Range: 40-70%</p>
                <p className="text-xs text-emerald-700">🏜️ Too dry: Below 30% • 🌊 Too wet: Above 80%</p>
              </div>
              <p className="text-emerald-700 leading-relaxed">
                Soil moisture tells us when to water our plants. Too dry and they can't grow, 
                too wet and the roots might rot. Perfect balance = healthy plants!
              </p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl p-6 border border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <h4 className="font-bold text-indigo-800 mb-3 text-lg">🌬️ Atmospheric Pressure</h4>
              <div className="bg-indigo-200/50 rounded-lg p-3 mb-3">
                <p className="text-sm font-semibold text-indigo-800">📊 Good Range: 1000-1030 hPa</p>
                <p className="text-xs text-indigo-700">⛈️ Low pressure: Below 1000 hPa • ☀️ High pressure: Above 1030 hPa</p>
              </div>
              <p className="text-indigo-700 leading-relaxed">
                Atmospheric pressure affects weather patterns and plant growth! High pressure brings 
                sunny weather, while low pressure often means rain is coming.
              </p>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <h4 className="font-bold text-gray-800 mb-3 text-lg">📊 Data Science</h4>
              <div className="bg-gray-200/50 rounded-lg p-3 mb-3">
                <p className="text-sm font-semibold text-gray-800">🎯 Learning Goals</p>
                <p className="text-xs text-gray-700">Patterns • Technology • Problem Solving</p>
              </div>
              <p className="text-gray-700 leading-relaxed">
                By tracking all these measurements over time, we learn about patterns in nature 
                and how to use technology to help our garden grow better!
              </p>
            </div>
          </div>

          {/* BME680 Educational Content */}
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="p-3 bg-orange-100 rounded-2xl mr-4 shadow-lg">
                <Zap className="w-8 h-8 text-orange-600" />
              </div>
              ⚡ BME680 Sensor Technology
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-6 border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <h4 className="font-bold text-orange-800 mb-3 text-lg">🌡️ BME680 Temperature</h4>
                <div className="bg-orange-200/50 rounded-lg p-3 mb-3">
                  <p className="text-sm font-semibold text-orange-800">📊 Good Range: 18-24°C</p>
                  <p className="text-xs text-orange-700">❄️ Too cold: Below 15°C • 🔥 Too hot: Above 30°C</p>
                </div>
                <p className="text-orange-700 leading-relaxed">
                  The BME680 provides precise temperature readings with ±1°C accuracy. This helps us understand 
                  microclimate conditions in different parts of our garden!
                </p>
              </div>
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-2xl p-6 border border-cyan-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <h4 className="font-bold text-cyan-800 mb-3 text-lg">💧 BME680 Humidity</h4>
                <div className="bg-cyan-200/50 rounded-lg p-3 mb-3">
                  <p className="text-sm font-semibold text-cyan-800">📊 Good Range: 40-60%</p>
                  <p className="text-xs text-cyan-700">🏜️ Too dry: Below 30% • 🌧️ Too wet: Above 70%</p>
                </div>
                <p className="text-cyan-700 leading-relaxed">
                  The BME680 humidity sensor has ±3% accuracy and helps us understand how moisture affects 
                  plant growth and soil conditions in real-time!
                </p>
              </div>
              <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-2xl p-6 border border-violet-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <h4 className="font-bold text-violet-800 mb-3 text-lg">🌬️ BME680 Pressure</h4>
                <div className="bg-violet-200/50 rounded-lg p-3 mb-3">
                  <p className="text-sm font-semibold text-violet-800">📊 Good Range: 1000-1030 hPa</p>
                  <p className="text-xs text-violet-700">⛈️ Low pressure: Below 1000 hPa • ☀️ High pressure: Above 1030 hPa</p>
                </div>
                <p className="text-violet-700 leading-relaxed">
                  Atmospheric pressure affects weather patterns! The BME680 measures pressure with ±1 hPa accuracy, 
                  helping us predict weather changes for our garden.
                </p>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-2xl p-6 border border-pink-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <h4 className="font-bold text-pink-800 mb-3 text-lg">⚡ Gas Resistance</h4>
                <div className="bg-pink-200/50 rounded-lg p-3 mb-3">
                  <p className="text-sm font-semibold text-pink-800">📊 Good Range: 30,000-80,000 Ω</p>
                  <p className="text-xs text-pink-700">🚨 Low resistance: Below 30kΩ • ✅ High resistance: Above 80kΩ</p>
                </div>
                <p className="text-pink-700 leading-relaxed">
                  Gas resistance measures air quality by detecting volatile organic compounds (VOCs). 
                  Higher resistance means cleaner air - perfect for healthy plants!
                </p>
              </div>
              <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-2xl p-6 border border-teal-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <h4 className="font-bold text-teal-800 mb-3 text-lg">🌪️ BME680 Air Quality</h4>
                <div className="bg-teal-200/50 rounded-lg p-3 mb-3">
                  <p className="text-sm font-semibold text-teal-800">📊 Good Range: 0-50 AQI</p>
                  <p className="text-xs text-teal-700">⚠️ Moderate: 51-100 • 🚨 Unhealthy: Above 100</p>
                </div>
                <p className="text-teal-700 leading-relaxed">
                  The BME680 calculates an Air Quality Index from gas resistance data. Clean air helps plants 
                  grow better and keeps our garden environment healthy!
                </p>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl p-6 border border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <h4 className="font-bold text-indigo-800 mb-3 text-lg">🔬 Sensor Technology</h4>
                <div className="bg-indigo-200/50 rounded-lg p-3 mb-3">
                  <p className="text-sm font-semibold text-indigo-800">🎯 Key Features</p>
                  <p className="text-xs text-indigo-700">Low Power • High Accuracy • Compact Size</p>
                </div>
                <p className="text-indigo-700 leading-relaxed">
                  The BME680 is an all-in-one environmental sensor that combines temperature, humidity, 
                  pressure, and gas sensing in one tiny chip!
                </p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-6 border border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <h4 className="font-bold text-amber-800 mb-3 text-lg">🌱 Plant Health</h4>
                <div className="bg-amber-200/50 rounded-lg p-3 mb-3">
                  <p className="text-sm font-semibold text-amber-800">🎯 Garden Benefits</p>
                  <p className="text-xs text-amber-700">Early Warning • Optimal Conditions • Data-Driven Care</p>
                </div>
                <p className="text-amber-700 leading-relaxed">
                  By monitoring all these environmental factors, we can detect problems early, 
                  optimize growing conditions, and help our plants thrive!
                </p>
              </div>
              <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-2xl p-6 border border-rose-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <h4 className="font-bold text-rose-800 mb-3 text-lg">📱 Smart Technology</h4>
                <div className="bg-rose-200/50 rounded-lg p-3 mb-3">
                  <p className="text-sm font-semibold text-rose-800">🎯 Learning Goals</p>
                  <p className="text-xs text-rose-700">IoT • Data Analysis • Environmental Science</p>
                </div>
                <p className="text-rose-700 leading-relaxed">
                  The BME680 teaches us about Internet of Things (IoT), data collection, and how technology 
                  can help us understand and protect our environment!
                </p>
              </div>
          </div>
        </div>

        {/* Raw Data Toggle */}
        <div className="bg-gradient-to-br from-white/95 to-gray-50/50 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <div className="p-3 bg-gray-100 rounded-2xl mr-4 shadow-lg">
                <Eye className="w-8 h-8 text-gray-600" />
              </div>
              📊 Raw Sensor Data
            </h3>
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="flex items-center px-6 py-3 rounded-2xl font-bold text-lg bg-gradient-to-r from-gray-400 to-gray-600 text-white border border-gray-300 hover:from-gray-500 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Eye className="w-5 h-5 mr-2" />
              {showRawData ? 'Hide' : 'Show'} Data
            </button>
          </div>
          
          {showRawData && (
            <div className="space-y-8">
              {/* Standard Sensors Raw Data */}
              <div>
                <h4 className="text-xl font-bold text-gray-800 mb-4">📊 Standard Sensors Data</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sensorCards.map(({ key, label, color }) => (
                    <div key={key} className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 ${color}`}>
                      <h5 className="font-bold text-gray-800 mb-4 text-lg">{label}</h5>
                      <div className="text-sm text-gray-600 space-y-2 max-h-40 overflow-y-auto">
                        {ecologyData.sensors[key as keyof SensorData].slice(-6).map((reading, index) => (
                          <div key={index} className="flex justify-between items-center bg-white/50 rounded-lg p-2">
                            <span className="font-medium">{formatTime(reading.timestamp)}</span>
                            <span className="font-mono font-bold text-lg">{formatValue((reading as SensorReading).value, (reading as SensorReading).unit)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BME680 Raw Data */}
              <div>
                <h4 className="text-xl font-bold text-gray-800 mb-4">⚡ BME680 Sensor Data</h4>
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 border-orange-200">
                  <div className="text-sm text-gray-600 space-y-2 max-h-60 overflow-y-auto">
                    {ecologyData.sensors.bme680.slice(-8).map((reading, index) => (
                      <div key={index} className="bg-white/50 rounded-lg p-3 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{formatTime(reading.timestamp)}</span>
                          <span className="text-xs text-gray-500">BME680 Reading</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span>🌡️ Temp:</span>
                            <span className="font-mono font-bold">{formatValue(reading.temperature, '°C')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>💧 Humid:</span>
                            <span className="font-mono font-bold">{formatValue(reading.humidity, '%')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>🌬️ Press:</span>
                            <span className="font-mono font-bold">{formatValue(reading.pressure, 'hPa')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>⚡ Gas:</span>
                            <span className="font-mono font-bold">{formatValue(reading.gasResistance, 'Ω')}</span>
                          </div>
                          <div className="flex justify-between col-span-2">
                            <span>🌪️ AQI:</span>
                            <span className="font-mono font-bold">{formatValue(reading.airQualityIndex, 'AQI')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EcologyDashboard;
