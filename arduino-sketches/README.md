# Arduino Sketches for Pack 1703 Portal

This directory contains Arduino sketches and documentation for IoT devices that send environmental sensor data to the Pack 1703 portal.

## 📁 Directory Contents

### Arduino Sketches

#### ESP32_BME680/
**Main sketch for ESP32-CAM with BME680 sensor**
- Connects to WiFi (WPA2 Personal or Enterprise)
- Reads BME680 environmental sensor data
- Outputs JSON data for Firebase
- Automatic reconnection if WiFi drops
- Supports both real sensor data and simulated data

**Use this for**: ESP32-CAM boards with WiFi capability

#### BME680_Sketch/
**Simplified sketch for Circuit Playground Express**
- No WiFi required
- Reads BME680 sensor data
- Outputs JSON to Serial Monitor
- Manual Firebase upload

**Use this for**: Circuit Playground Express or other boards without WiFi

#### BME680_Firestore_Sender.ino
**Legacy sketch** - Early version, use ESP32_BME680 or BME680_Sketch instead

### Documentation

#### ESP32_CAM_UPLOAD_GUIDE.md
Complete guide for uploading code to ESP32-CAM:
- Hardware setup requirements
- GPIO 0 to GND procedure
- Command-line upload instructions
- Serial monitoring
- Troubleshooting

#### ESP32_ENTERPRISE_WIFI_GUIDE.md
Guide for WPA2 Enterprise WiFi (eduroam, corporate networks):
- Username/password configuration
- Certificate support
- Enterprise authentication setup

#### arduino_setup_guide.md
General Arduino setup guide:
- Library installation
- WiFi configuration
- Firebase integration

#### arduino_library_install_guide.md & arduino_library_install_fix.md
Library installation troubleshooting guides

#### arduino_upload_instructions.md
General Arduino upload instructions

## 🚀 Quick Start

### For ESP32-CAM (Recommended)

1. **Edit WiFi credentials**:
   ```bash
   nano arduino-sketches/ESP32_BME680/ESP32_BME680.ino
   # Update line 34 with your WiFi password
   ```

2. **Compile**:
   ```bash
   cd /Users/christophersmith/Documents/GitHub/pack1703-portal
   arduino-cli compile --fqbn esp32:esp32:esp32cam arduino-sketches/ESP32_BME680
   ```

3. **Upload** (connect GPIO 0 to GND first):
   ```bash
   arduino-cli upload -p /dev/cu.usbserial-0001 --fqbn esp32:esp32:esp32cam arduino-sketches/ESP32_BME680
   ```

4. **Monitor** (disconnect GPIO 0 from GND and press RESET):
   ```bash
   arduino-cli monitor -p /dev/cu.usbserial-0001 -c baudrate=115200
   ```

### For Circuit Playground Express

1. **Compile**:
   ```bash
   arduino-cli compile --fqbn adafruit:samd:adafruit_circuitplayground_m0 arduino-sketches/BME680_Sketch
   ```

2. **Upload** (double-click reset button first):
   ```bash
   arduino-cli upload -p /dev/cu.usbmodem1101 --fqbn adafruit:samd:adafruit_circuitplayground_m0 arduino-sketches/BME680_Sketch
   ```

## 📊 Data Format

All sketches output environmental data in this JSON format:

```json
{
  "timestamp": "12345",
  "temperature": 22.45,
  "humidity": 45.23,
  "pressure": 1013.25,
  "gasResistance": 52000,
  "airQualityIndex": 50,
  "deviceId": "esp32_garden_01",
  "location": "Pack 1703 Scout Garden"
}
```

This data can be:
- Copied manually to Firebase Console
- Sent automatically via HTTP (ESP32 only, requires API key configuration)
- Viewed in the Pack 1703 portal Ecology Dashboard

## 🔧 Required Libraries

All sketches require these libraries (install via Arduino IDE or arduino-cli):

- **Adafruit BusIO**
- **Adafruit Unified Sensor**
- **Adafruit BME680 Library**

### Install via Command Line:
```bash
arduino-cli lib install "Adafruit BusIO"
arduino-cli lib install "Adafruit Unified Sensor"
arduino-cli lib install "Adafruit BME680 Library"
```

## 🌐 WiFi Networks Supported

### WPA2 Personal (Home/Small Business)
- Standard WiFi password
- Most home routers (including UniFi)
- Set `USE_ENTERPRISE_WIFI false`

### WPA2 Enterprise (Organization/School)
- Username and password required
- May require certificates
- Set `USE_ENTERPRISE_WIFI true`

## 📈 Integration with Pack 1703 Portal

The sensor data integrates with the Pack 1703 portal Ecology Dashboard:

- **Real-time monitoring**: See live environmental data
- **Historical charts**: Track trends over time
- **Educational content**: Learn about environmental science
- **Scout-appropriate**: Age-appropriate explanations and visuals

## 🆘 Need Help?

See the individual guide files for detailed instructions:
- ESP32-CAM issues → `ESP32_CAM_UPLOAD_GUIDE.md`
- Enterprise WiFi → `ESP32_ENTERPRISE_WIFI_GUIDE.md`
- Library problems → `arduino_library_install_fix.md`

---

**Last Updated**: October 1, 2025
**Compatible with**: Arduino CLI 1.3.1, ESP32 Core 3.3.1, Adafruit SAMD 1.7.16







