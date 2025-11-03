# ESP32-CAM Deployment Guide

## Overview

Due to library conflicts between ESP32 Camera and Adafruit BME680 libraries, we use **two separate sketches**:

1. **ESP32_BME680** - Environmental sensor data (temperature, humidity, pressure, AQI)
2. **ESP32_CAM_Full** - Camera captures

## 🔧 Hardware Setup

### Option 1: Single ESP32-CAM (Camera Only)
Upload `ESP32_CAM_Full` to capture images every hour

### Option 2: Two Devices (Recommended)
- **Device 1**: ESP32-CAM with `ESP32_CAM_Full` (camera only)
- **Device 2**: ESP32 (without camera) with `ESP32_BME680` (sensors only)

### Option 3: Current ESP32-CAM (Sensors Only)
Keep the current `ESP32_BME680` sketch for sensor data

## 📸 To Add Camera Functionality

### Upload Camera Sketch:

1. **Put in programming mode** (GPIO 0 to GND + RESET)

2. **Compile**:
```bash
arduino-cli compile --fqbn esp32:esp32:esp32cam arduino-sketches/ESP32_CAM_Full
```

3. **Upload**:
```bash
arduino-cli upload -p /dev/cu.usbserial-0001 --fqbn esp32:esp32:esp32cam arduino-sketches/ESP32_CAM_Full
```

4. **Return to normal mode** (disconnect GPIO 0 from GND + RESET)

5. **Monitor**:
```bash
arduino-cli monitor -p /dev/cu.usbserial-0001 -c baudrate=115200
```

## 📊 Current Configuration

Your ESP32-CAM currently has **ESP32_BME680** uploaded, which:
- ✅ Reads BME680 sensor data
- ✅ Uploads to Firestore every 5 minutes
- ✅ Includes both metric and imperial units
- ✅ WiFi connected to SmithStation
- ❌ No camera functionality (due to library conflicts)

## 🎯 What Each Sketch Does

### ESP32_BME680 (Currently Running)
- **Interval**: Every 5 minutes
- **Data**: Temperature, Humidity, Pressure, Gas Resistance, AQI
- **Units**: Metric (°C, hPa) + Imperial (°F, inHg)
- **Collection**: `bme680_readings`
- **Size**: 1,102,843 bytes

### ESP32_CAM_Full (Camera Version)
- **Interval**: Every 1 hour
- **Data**: Camera images (800x600 JPEG)
- **Storage**: Firebase Storage
- **Metadata**: `camera_images` collection
- **Size**: 1,149,171 bytes

## 📈 Viewing Data

### Ecology Dashboard
Go to: https://sfpack1703.web.app/ecology

Will display:
- BME680 sensor readings with metric/imperial units
- Camera images (if camera sketch is uploaded)
- Real-time charts
- Historical trends

### Firebase Console
- **Firestore**: https://console.firebase.google.com/project/pack1703-portal/firestore
  - `bme680_readings` - Sensor data
  - `camera_images` - Image metadata
- **Storage**: https://console.firebase.google.com/project/pack1703-portal/storage
  - Garden photos

## ⚙️ Configuration

Both sketches are pre-configured with:
- **WiFi**: SmithStation / Heidi@214
- **Firebase API Key**: Configured
- **Device ID**: esp32_garden_01
- **Location**: Pack 1703 Scout Garden

## 🔄 Switching Between Sketches

To switch from sensors to camera (or vice versa):
1. Connect GPIO 0 to GND
2. Press RESET
3. Upload the desired sketch
4. Disconnect GPIO 0 from GND
5. Press RESET

## 💡 Recommendation

For full functionality, consider getting a second ESP32 board (without camera) dedicated to BME680 sensors, allowing your ESP32-CAM to focus on image capture.

---

**Last Updated**: October 1, 2025

















