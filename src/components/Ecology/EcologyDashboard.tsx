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
  Zap,
  Camera,
  Wifi,
  WifiOff,
  Download,
  Maximize2
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

interface SensorData {
  temperature: SensorReading[];
  humidity: SensorReading[];
  pressure: SensorReading[];
  airQuality: SensorReading[];
  light: SensorReading[];
  soilMoisture: SensorReading[];
}

interface CameraImage {
  id: string;
  timestamp: number;
  imageUrl: string;
  thumbnailUrl?: string;
  metadata?: {
    resolution: string;
    fileSize: number;
    format: string;
  };
}

interface EcologyData {
  sensors: SensorData;
  camera: {
    latestImage?: CameraImage;
    isOnline: boolean;
    lastCapture: number;
  };
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

  return {
    sensors: {
      temperature: generateSensorData(22, 4, '°C'),
      humidity: generateSensorData(45, 15, '%'),
      pressure: generateSensorData(1013, 10, 'hPa'),
      airQuality: generateSensorData(50, 20, 'AQI'),
      light: generateSensorData(800, 200, 'lux'),
      soilMoisture: generateSensorData(60, 20, '%')
    },
    camera: {
      latestImage: {
        id: 'mock-image-1',
        timestamp: now - 120000, // 2 minutes ago
        imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop&crop=center',
        thumbnailUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=150&fit=crop&crop=center',
        metadata: {
          resolution: '800x600',
          fileSize: 245760,
          format: 'JPEG'
        }
      },
      isOnline: true,
      lastCapture: now - 120000
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
  const [showFullImage, setShowFullImage] = useState(false);
  const [useRealData, setUseRealData] = useState(true);

  // Function to fetch real data from Firebase
  const fetchRealData = async () => {
    if (!useRealData) return;
    
    try {
      const { ecologyService } = await import('../../services/ecologyService');
      const realData = await ecologyService.getEcologyData();
      
      console.log('🔍 Ecology data fetched:', realData);
      console.log('📸 Camera data:', realData?.camera);
      console.log('🌡️ Temperature readings:', realData?.sensors?.temperature?.length);
      
      if (realData) {
        setEcologyData(realData);
        console.log('✅ Loaded real ecology data from Firebase');
        if (realData.camera?.latestImage) {
          console.log('📸 Latest image URL:', realData.camera.latestImage.imageUrl);
        } else {
          console.log('⚠️ No camera image available yet');
        }
      } else {
        console.log('⚠️ No real data available, using mock data');
      }
    } catch (error) {
      console.error('Error fetching real ecology data:', error);
    }
  };

  // Fetch real data from Firebase on mount and every 30 seconds
  useEffect(() => {
    fetchRealData();
    
    // Refresh real data every 30 seconds
    const interval = setInterval(fetchRealData, 30000);
    return () => clearInterval(interval);
  }, [useRealData]);

  // Simulate real-time data updates (only for mock data)
  useEffect(() => {
    if (!isLiveMode || useRealData) return;

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
            soilMoisture: [...prevData.sensors.soilMoisture.slice(1), newData.sensors.soilMoisture[23]]
          }
        };
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isLiveMode, useRealData]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatValue = (value: number, unit: string) => {
    return `${value.toFixed(1)}${unit}`;
  };

  // Convert metric to imperial units
  const celsiusToFahrenheit = (celsius: number) => (celsius * 9/5) + 32;
  const hPaToInHg = (hPa: number) => hPa * 0.02953;

  const formatValueWithBothUnits = (value: number, unit: string) => {
    if (unit === '°C') {
      const fahrenheit = celsiusToFahrenheit(value);
      return `${value.toFixed(1)}°C (${fahrenheit.toFixed(1)}°F)`;
    } else if (unit === 'hPa') {
      const inHg = hPaToInHg(value);
      return `${value.toFixed(1)} hPa (${inHg.toFixed(2)} inHg)`;
    }
    return `${value.toFixed(1)}${unit}`;
  };

  const getCurrentReading = (readings: SensorReading[]): SensorReading | null => {
    if (!readings || readings.length === 0) return null;
    return readings[readings.length - 1];
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
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  // Function to determine image freshness for children
  const getImageFreshness = (imageTimestamp: number) => {
    const now = Date.now();
    const ageInMinutes = (now - imageTimestamp) / (1000 * 60);
    
    if (ageInMinutes <= 5) {
      return {
        status: 'Fresh',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '🟢',
        description: 'Very fresh! Just taken!'
      };
    } else if (ageInMinutes <= 30) {
      return {
        status: 'Recent',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '🟡',
        description: 'Pretty fresh! Taken recently!'
      };
    } else {
      return {
        status: 'Old',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: '🔴',
        description: 'Getting old! Need a new picture!'
      };
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
                  onClick={() => fetchRealData()}
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

        {/* Camera Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-white/95 to-indigo-50/50 backdrop-blur-sm rounded-3xl border border-indigo-100 shadow-lg p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="p-3 bg-indigo-100 rounded-2xl mr-4 shadow-lg">
                  <Camera className="w-8 h-8 text-indigo-600" />
                </div>
                📸 Garden Camera Feed
              </h3>
              <div className="flex items-center space-x-3">
                {ecologyData.camera.latestImage ? (
                  <div className={`flex items-center px-3 py-2 rounded-full text-sm font-medium border ${
                    getImageFreshness(ecologyData.camera.latestImage.timestamp).color
                  }`}>
                    <span className="mr-2 text-lg">
                      {getImageFreshness(ecologyData.camera.latestImage.timestamp).icon}
                    </span>
                    {getImageFreshness(ecologyData.camera.latestImage.timestamp).status}
                  </div>
                ) : (
                  <div className="flex items-center px-3 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                    <WifiOff className="w-4 h-4 mr-2" />
                    No Image
                  </div>
                )}
                {ecologyData.camera.latestImage && (
                  <button
                    onClick={() => setShowFullImage(true)}
                    className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition-colors duration-200"
                  >
                    <Maximize2 className="w-4 h-4 mr-2" />
                    Full View
                  </button>
                )}
              </div>
            </div>

            {ecologyData.camera.latestImage ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image Display */}
                <div className="relative">
                  <div className="relative rounded-2xl overflow-hidden shadow-lg bg-gray-100">
                    <img
                      src={ecologyData.camera.latestImage.imageUrl}
                      alt="Garden camera view"
                      className="w-full h-64 lg:h-80 object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNTAgMjUwSDQ1MFYzNTBIMzUwVjI1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTM3NSAyNzVIMzUwVjI1MEgzNzVWMjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNDI1IDI3NUg0NTBWMjUwSDQyNVYyNzVaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0zNzUgMzI1SDM1MFYzNTBIMzc1VjMyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTQyNSAzMjVINDUwVjM1MEg0MjVWMzI1WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMzUwIDI3NUg0NTBWMTUwSDM1MFYyNzVaIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNzUgMjAwSDQyNVYyNTBIMzc1VjIwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTM1MCAzNTBINDAwVjQ1MEgzNTBWMzUwWiIgZmlsbD0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNMzUwIDM1MEg0MDBWNDUwSDM1MFYzNTBaIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjQwMCIgeT0iNTAwIiBmaWxsPSIjNkI3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkdhcmRlbiBDYW1lcmE8L3RleHQ+Cjx0ZXh0IHg9IjQwMCIgeT0iNTMwIiBmaWxsPSIjNkI3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVzcGVyYSB0byBzZWUgbGl2ZSBmZWVkIGZyb20gRVNQMzI8L3RleHQ+Cjwvc3ZnPgo=';
                      }}
                    />
                    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-medium">
                      📸 Garden Camera
                    </div>
                  </div>
                </div>

                {/* Image Info */}
                <div className="space-y-4">
                  <div className="bg-white/80 rounded-2xl p-6 border border-indigo-100">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <Camera className="w-5 h-5 mr-2 text-indigo-600" />
                      Image Details
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">📅 Captured:</span>
                        <span className="text-gray-900 font-bold">{formatTime(ecologyData.camera.latestImage.timestamp)}</span>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-yellow-50 rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">🕒 Image Age:</span>
                          <span className={`text-sm font-bold ${
                            getImageFreshness(ecologyData.camera.latestImage.timestamp).status === 'Fresh' ? 'text-green-800' :
                            getImageFreshness(ecologyData.camera.latestImage.timestamp).status === 'Recent' ? 'text-yellow-800' : 'text-red-800'
                          }`}>
                            {getImageFreshness(ecologyData.camera.latestImage.timestamp).icon} {getImageFreshness(ecologyData.camera.latestImage.timestamp).status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {getImageFreshness(ecologyData.camera.latestImage.timestamp).description}
                        </p>
                      </div>
                      {ecologyData.camera.latestImage.metadata && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">📐 Resolution:</span>
                            <span className="text-gray-900 font-bold">{ecologyData.camera.latestImage.metadata.resolution}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">📁 Format:</span>
                            <span className="text-gray-900 font-bold">{ecologyData.camera.latestImage.metadata.format}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">💾 Size:</span>
                            <span className="text-gray-900 font-bold">{(ecologyData.camera.latestImage.metadata.fileSize / 1024).toFixed(1)} KB</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                    <h4 className="text-lg font-bold text-green-800 mb-3 flex items-center">
                      <Leaf className="w-5 h-5 mr-2 text-green-600" />
                      Garden Status
                    </h4>
                    <div className="space-y-2 text-green-700">
                      {(() => {
                        const temp = getCurrentReading(ecologyData.sensors.temperature);
                        const humidity = getCurrentReading(ecologyData.sensors.humidity);
                        const airQuality = getCurrentReading(ecologyData.sensors.airQuality);
                        const pressure = getCurrentReading(ecologyData.sensors.pressure);
                        
                        // Temperature status
                        const tempStatus = !temp ? 'No data' :
                          temp.value < 15 ? '❄️ Too cold for most plants' :
                          temp.value > 30 ? '🔥 Too hot - plants may be stressed' :
                          temp.value >= 18 && temp.value <= 24 ? '✅ Perfect growing temperature!' :
                          '🌡️ Acceptable temperature range';
                        
                        // Humidity status
                        const humidityStatus = !humidity ? 'No data' :
                          humidity.value < 30 ? '🏜️ Very dry - increase watering' :
                          humidity.value > 70 ? '🌧️ Very humid - watch for mold' :
                          humidity.value >= 40 && humidity.value <= 60 ? '✅ Ideal humidity for plants!' :
                          '💧 Humidity within acceptable range';
                        
                        // Air quality status
                        const airStatus = !airQuality ? 'No data' :
                          airQuality.value <= 50 ? '🟢 Excellent air quality' :
                          airQuality.value <= 100 ? '🟡 Moderate - acceptable for plants' :
                          '🔴 Poor air quality - may affect growth';
                        
                        // Pressure status (affects weather)
                        const pressureStatus = !pressure ? 'No data' :
                          pressure.value < 1000 ? '⛈️ Low pressure - rain likely coming' :
                          pressure.value > 1030 ? '☀️ High pressure - sunny weather ahead' :
                          '🌤️ Stable atmospheric conditions';
                        
                        return (
                          <>
                            <p className="text-sm">🌡️ <strong>Temperature:</strong> {tempStatus}</p>
                            <p className="text-sm">💧 <strong>Humidity:</strong> {humidityStatus}</p>
                            <p className="text-sm">🌬️ <strong>Air Quality:</strong> {airStatus}</p>
                            <p className="text-sm">🌍 <strong>Pressure:</strong> {pressureStatus}</p>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => ecologyData.camera.latestImage && window.open(ecologyData.camera.latestImage.imageUrl, '_blank')}
                      className="flex-1 flex items-center justify-center px-4 py-3 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition-colors duration-200 font-medium"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </button>
                    <button
                      onClick={() => setShowFullImage(true)}
                      className="flex-1 flex items-center justify-center px-4 py-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors duration-200 font-medium"
                    >
                      <Maximize2 className="w-4 h-4 mr-2" />
                      Full Screen
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-12 h-12 text-gray-400" />
                </div>
                <h4 className="text-xl font-bold text-gray-600 mb-2">Camera Offline</h4>
                <p className="text-gray-500 mb-4">The ESP32 camera is currently not available</p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 max-w-md mx-auto">
                  <p className="text-yellow-800 text-sm">
                    🔧 <strong>Setup in Progress:</strong> We're working on connecting the ESP32 camera to provide live garden monitoring!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sensor Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {sensorCards.map(({ key, label, icon: Icon, color, iconBg, iconColor }) => {
            const currentReading = getCurrentReading(ecologyData.sensors[key as keyof SensorData]);
            
            // Skip rendering if no data available
            if (!currentReading) {
              return null;
            }
            
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
                {(currentReading.unit === '°C' || currentReading.unit === 'hPa') && (
                  <div className="text-sm text-gray-500 font-medium">
                    {formatValueWithBothUnits(currentReading.value, currentReading.unit)}
                  </div>
                )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sensorCards.map(({ key, label, color }) => (
                <div key={key} className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 ${color}`}>
                  <h4 className="font-bold text-gray-800 mb-4 text-lg">{label}</h4>
                  <div className="text-sm text-gray-600 space-y-2 max-h-40 overflow-y-auto">
                    {ecologyData.sensors[key as keyof SensorData].slice(-6).map((reading, index) => (
                      <div key={index} className="flex justify-between items-center bg-white/50 rounded-lg p-2">
                        <span className="font-medium">{formatTime(reading.timestamp)}</span>
                        <span className="font-mono font-bold text-lg">{formatValue(reading.value, reading.unit)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Image Modal */}
      {showFullImage && ecologyData.camera.latestImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-6xl max-h-full">
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={ecologyData.camera.latestImage.imageUrl}
              alt="Garden camera view - full screen"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNTAgMjUwSDQ1MFYzNTBIMzUwVjI1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTM3NSAyNzVIMzUwVjI1MEgzNzVWMjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNDI1IDI3NUg0NTBWMjUwSDQyNVYyNzVaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0zNzUgMzI1SDM1MFYzNTBIMzc1VjMyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTQyNSAzMjVINDUwVjM1MEg0MjVWMzI1WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMzUwIDI3NUg0NTBWMTUwSDM1MFYyNzVaIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNzUgMjAwSDQyNVYyNTBIMzc1VjIwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTM1MCAzNTBINDAwVjQ1MEgzNTBWMzUwWiIgZmlsbD0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNMzUwIDM1MEg0MDBWNDUwSDM1MFYzNTBaIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjQwMCIgeT0iNTAwIiBmaWxsPSIjNkI3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkdhcmRlbiBDYW1lcmE8L3RleHQ+Cjx0ZXh0IHg9IjQwMCIgeT0iNTMwIiBmaWxsPSIjNkI3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVzcGVyYSB0byBzZWUgbGl2ZSBmZWVkIGZyb20gRVNQMzI8L3RleHQ+Cjwvc3ZnPgo=';
              }}
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">📸 Garden Camera Feed</p>
                  <p className="text-sm opacity-80">Captured: {formatTime(ecologyData.camera.latestImage.timestamp)}</p>
                </div>
                <button
                  onClick={() => ecologyData.camera.latestImage && window.open(ecologyData.camera.latestImage.imageUrl, '_blank')}
                  className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EcologyDashboard;
