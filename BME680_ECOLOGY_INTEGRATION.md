# BME680 Ecology Dashboard Integration

## Overview

The Pack 1703 Ecology Dashboard has been enhanced to include comprehensive BME680 environmental sensor data alongside existing sensor readings. The system is structured to easily transition from mock data to Firebase integration when your ESP32 is ready to send real data.

## 🚀 Features Added

### BME680 Sensor Integration
- **Temperature**: Precise temperature readings with ±1°C accuracy
- **Humidity**: Relative humidity measurements with ±3% accuracy  
- **Pressure**: Atmospheric pressure monitoring with ±1 hPa accuracy
- **Gas Resistance**: VOC detection for air quality assessment
- **Air Quality Index**: Calculated AQI from gas resistance data

### Enhanced Dashboard Components
- **Dedicated BME680 Sensor Cards**: Real-time display of all BME680 readings
- **Specialized Charts**: Temperature, humidity, pressure, and gas resistance trends
- **Educational Content**: Comprehensive explanations of BME680 capabilities and normal ranges
- **Raw Data View**: Detailed BME680 readings with all sensor values
- **Firebase-Ready Architecture**: Easy transition from mock to real data

## 📊 BME680 Sensor Specifications

### Temperature
- **Range**: -40°C to +85°C
- **Accuracy**: ±1°C
- **Resolution**: 0.01°C
- **Normal Range for Plants**: 18-24°C
- **Status Indicators**: 
  - 🔵 Too Cold: Below 15°C
  - 🟢 Good: 18-24°C  
  - 🔴 Too Hot: Above 30°C

### Humidity
- **Range**: 0-100% RH
- **Accuracy**: ±3% RH
- **Resolution**: 0.01% RH
- **Normal Range for Plants**: 40-60%
- **Status Indicators**:
  - 🟡 Too Dry: Below 30%
  - 🟢 Good: 40-60%
  - 🔵 Too Humid: Above 70%

### Pressure
- **Range**: 300-1100 hPa
- **Accuracy**: ±1 hPa
- **Resolution**: 0.18 Pa
- **Normal Range**: 1000-1030 hPa
- **Status Indicators**:
  - 🔴 Low Pressure: Below 1000 hPa (Stormy weather)
  - 🟢 Good: 1000-1030 hPa
  - 🔵 High Pressure: Above 1030 hPa (Clear weather)

### Gas Resistance
- **Range**: 10-1000 kΩ
- **Sensitivity**: Detects VOCs, CO2, and other gases
- **Normal Range**: 30,000-80,000 Ω
- **Status Indicators**:
  - 🔴 Low Resistance: Below 30kΩ (Poor air quality)
  - 🟡 Moderate: 30,000-80,000 Ω
  - 🟢 High Resistance: Above 80kΩ (Excellent air quality)

### Air Quality Index
- **Calculation**: Derived from gas resistance data
- **Range**: 0-500 AQI
- **Normal Range**: 0-50 AQI
- **Status Indicators**:
  - 🟢 Good: 0-50 AQI
  - 🟡 Moderate: 51-100 AQI
  - 🔴 Unhealthy: Above 100 AQI

## 🏗️ Architecture & Firebase Integration

### Current Structure (Mock Data)
The dashboard currently uses mock data generators to simulate real sensor readings:

```typescript
// Mock data generator creates realistic BME680 readings
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
```

### Firebase Integration Ready
The system is structured for easy Firebase integration:

#### Service Layer (`src/services/ecologyService.ts`)
- **Complete Firebase integration** for all sensor types
- **Error handling** and graceful fallbacks
- **Type-safe** operations with TypeScript
- **Optimized queries** with proper indexing

#### Key Firebase Methods:
```typescript
// Fetch BME680 readings
await ecologyService.getBME680Readings(24);

// Add new BME680 reading
await ecologyService.addBME680Reading({
  temperature: 22.5,
  humidity: 45.2,
  pressure: 1013.2,
  gasResistance: 52000,
  airQualityIndex: 35
});

// Fetch complete ecology data
await ecologyService.getEcologyData();
```

### Firebase Collections Structure

#### BME680 Readings Collection (`bme680_readings`)
```javascript
{
  timestamp: Timestamp,
  temperature: number,      // °C
  humidity: number,         // %
  pressure: number,         // hPa
  gasResistance: number,    // ohms
  airQualityIndex: number   // AQI
}
```

#### Sensor Readings Collection (`sensor_readings`)
```javascript
{
  timestamp: Timestamp,
  sensorType: string,       // 'temperature', 'humidity', etc.
  value: number,
  unit: string              // '°C', '%', 'hPa', etc.
}
```

## 🔧 ESP32 Integration Guide

### Data Format for ESP32 to Firebase
Your ESP32 should send data in this format:

```json
{
  "timestamp": "2025-01-XX T XX:XX:XX.XXXZ",
  "temperature": 22.5,
  "humidity": 45.2,
  "pressure": 1013.2,
  "gasResistance": 52000,
  "airQualityIndex": 35,
  "deviceId": "esp32_garden_01",
  "location": "Pack 1703 Scout Garden"
}
```

### ESP32 Code Example (Arduino)
```cpp
#include <WiFi.h>
#include <FirebaseESP32.h>

// Firebase configuration
#define FIREBASE_HOST "your-project.firebaseio.com"
#define FIREBASE_AUTH "your-auth-token"

FirebaseData firebaseData;

void sendBME680Data() {
  // Read BME680 sensor data
  float temperature = bme.readTemperature();
  float humidity = bme.readHumidity();
  float pressure = bme.readPressure() / 100.0; // Convert to hPa
  float gasResistance = bme.gas_resistance;
  
  // Calculate AQI from gas resistance
  int airQualityIndex = calculateAQI(gasResistance);
  
  // Create JSON document
  FirebaseJson json;
  json.set("timestamp", Firebase.getCurrentTime());
  json.set("temperature", temperature);
  json.set("humidity", humidity);
  json.set("pressure", pressure);
  json.set("gasResistance", gasResistance);
  json.set("airQualityIndex", airQualityIndex);
  json.set("deviceId", "esp32_garden_01");
  json.set("location", "Pack 1703 Scout Garden");
  
  // Send to Firebase
  String path = "/bme680_readings";
  if (Firebase.pushJSON(firebaseData, path, json)) {
    Serial.println("BME680 data sent successfully");
  } else {
    Serial.println("Error sending data: " + firebaseData.errorReason());
  }
}

int calculateAQI(float gasResistance) {
  // Simple AQI calculation based on gas resistance
  if (gasResistance > 80000) return 25;      // Excellent
  if (gasResistance > 60000) return 50;      // Good
  if (gasResistance > 40000) return 75;      // Moderate
  if (gasResistance > 20000) return 100;     // Unhealthy for sensitive
  return 150;                                // Unhealthy
}
```

## 🎓 Educational Value

### Learning Objectives
1. **Environmental Science**: Understanding how temperature, humidity, pressure, and air quality affect plant growth
2. **Data Science**: Learning to interpret sensor data and identify patterns
3. **Technology**: Exploring IoT sensors and real-time data collection
4. **Problem Solving**: Using data to make informed decisions about garden care

### Scout-Appropriate Content
- **Age-appropriate explanations** for all sensor readings
- **Visual indicators** with colors and emojis for easy understanding
- **Normal ranges** clearly defined for each sensor
- **Practical applications** for garden management

### Interactive Features
- **Live data updates** every 5 seconds
- **Historical charts** showing trends over time
- **Status indicators** with color-coded warnings
- **Raw data view** for advanced users
- **Educational tooltips** explaining sensor technology

## 🚀 Deployment Checklist

### Before ESP32 Integration
- [ ] Verify Firebase project configuration
- [ ] Test ecology dashboard with mock data
- [ ] Review sensor normal ranges and status indicators
- [ ] Ensure proper Firebase security rules

### ESP32 Setup
- [ ] Install BME680 library and dependencies
- [ ] Configure WiFi and Firebase credentials
- [ ] Test sensor readings and data transmission
- [ ] Implement error handling and retry logic
- [ ] Set up data transmission intervals (recommended: every 5 minutes)

### Firebase Configuration
- [ ] Create Firestore collections: `bme680_readings` and `sensor_readings`
- [ ] Set up proper security rules for data access
- [ ] Configure indexes for timestamp-based queries
- [ ] Test data insertion and retrieval

### Dashboard Integration
- [ ] Replace mock data with Firebase service calls
- [ ] Test real-time data updates
- [ ] Verify error handling and fallback behavior
- [ ] Optimize query performance and caching

## 🔍 Troubleshooting

### Common Issues
1. **No data displaying**: Check Firebase connection and security rules
2. **Incorrect readings**: Verify sensor calibration and ESP32 code
3. **Slow updates**: Optimize Firebase queries and reduce update frequency
4. **Missing historical data**: Ensure proper timestamp formatting

### Debug Tools
- Browser developer console for JavaScript errors
- Firebase console for data verification
- ESP32 serial monitor for sensor readings
- Network tab for API call monitoring

## 📈 Future Enhancements

### Potential Additions
- **Data export** functionality for analysis
- **Alert system** for out-of-range readings
- **Historical comparisons** (day/week/month views)
- **Mobile notifications** for critical readings
- **Integration with weather APIs** for comparison
- **Machine learning** for predictive analysis

### Advanced Features
- **Multi-location support** for different garden areas
- **Sensor calibration** tools
- **Data visualization** improvements
- **Automated reporting** for scout meetings

---

*This integration provides a comprehensive environmental monitoring solution that combines cutting-edge sensor technology with educational value, perfect for teaching scouts about environmental science, data analysis, and technology integration.*
