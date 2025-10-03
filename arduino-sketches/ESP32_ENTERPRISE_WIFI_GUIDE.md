# ESP32-CAM WPA2 Enterprise WiFi Setup

## Overview
The ESP32-CAM sketch has been configured to support WPA2 Enterprise WiFi (eduroam, corporate networks, etc.) which requires username/password authentication instead of just a WiFi password.

## Configuration

### 1. Edit the Sketch

Open `ESP32_BME680/ESP32_BME680.ino` and update these settings:

```cpp
// WiFi Configuration
#define USE_ENTERPRISE_WIFI true  // Set to true for enterprise WiFi

// Network SSID (same for both personal and enterprise)
const char* ssid = "YOUR_NETWORK_NAME";

// For WPA2 Enterprise
const char* enterprise_identity = "your-username";  // Your network username
const char* enterprise_username = "your-username";  // Often same as identity
const char* enterprise_password = "your-password";  // Your network password
```

### 2. For Personal WiFi (Home Networks)

If you want to use a regular home WiFi instead:

```cpp
#define USE_ENTERPRISE_WIFI false  // Set to false

const char* ssid = "YOUR_HOME_WIFI";
const char* password = "YOUR_WIFI_PASSWORD";
```

## Upload to ESP32-CAM

### Step 1: Configure WiFi Credentials
Edit the sketch with your network credentials first!

### Step 2: Put in Programming Mode
**Connect GPIO 0 to GND** on your ESP32-CAM

### Step 3: Compile
```bash
arduino-cli compile --fqbn esp32:esp32:esp32cam ESP32_BME680
```

### Step 4: Upload
```bash
arduino-cli upload -p /dev/cu.usbserial-0001 --fqbn esp32:esp32:esp32cam ESP32_BME680
```

### Step 5: Return to Normal Mode
1. Disconnect GPIO 0 from GND
2. Press RESET button on ESP32-CAM

### Step 6: Monitor Output
```bash
arduino-cli monitor -p /dev/cu.usbserial-0001 -c baudrate=115200
```

## Expected Output

### With WPA2 Enterprise:
```
Pack 1703 BME680 Firebase Sender
=================================
✅ BME680 sensor found and initialized!

🌐 Connecting to WiFi...
Network: YourNetworkName
Using WPA2 Enterprise authentication
..................
✅ WiFi connected!
📍 IP address: 192.168.1.100
📶 Signal strength: -45 dBm

✅ BME680 Firebase Sender initialized successfully!
📡 Sending sensor data every 5 minutes...

===========================================
📊 Reading BME680 sensor data...
✅ Real sensor data:

📈 Sensor Readings:
  🕐 Timestamp: 12345 ms
  🌡️  Temperature: 22.45 °C
  💧 Humidity: 45.23 %
  🔽 Pressure: 1013.25 hPa
  💨 Gas Resistance: 52000 ohms
  🎯 Air Quality Index: 50 (Good)
  📱 Device ID: esp32_garden_01
  📍 Location: Pack 1703 Scout Garden

📝 JSON Payload:
{"timestamp":"12345","temperature":22.45,"humidity":45.23,"pressure":1013.25,"gasResistance":52000,"airQualityIndex":50,"deviceId":"esp32_garden_01","location":"Pack 1703 Scout Garden"}

✅ Data ready to send to Firebase!
💡 To enable automatic Firebase uploads, configure your Firebase API key
===========================================
```

## Troubleshooting

### WiFi Connection Fails with Enterprise
- **Check username/password**: Ensure they're correct
- **Try with identity = username**: Some networks require both to be the same
- **Check network requirements**: Some enterprise WiFi may require certificates (beyond username/password)

### "Failed to connect to ESP32" During Upload
- **Solution**: Make sure GPIO 0 is connected to GND before uploading
- Press RESET button while GPIO 0 is grounded
- Try upload immediately after pressing RESET

### Certificate-Based Enterprise WiFi
If your network requires certificates (in addition to username/password), you'll need to add:

```cpp
// Add certificate support
const char* ca_cert = \
"-----BEGIN CERTIFICATE-----\n" \
"YOUR_CA_CERTIFICATE_HERE\n" \
"-----END CERTIFICATE-----\n";

// In setup, add:
esp_eap_client_set_ca_cert((uint8_t *)ca_cert, strlen(ca_cert));
```

## Air Quality Index (AQI) Levels

The sketch calculates AQI from gas resistance:
- **0-50** (Good) - Air quality is satisfactory
- **51-100** (Moderate) - Acceptable air quality
- **101-150** (Unhealthy for Sensitive) - Sensitive groups may be affected
- **151-200** (Unhealthy) - Everyone may begin to experience health effects
- **201-300** (Very Unhealthy) - Health alert
- **301+** (Hazardous) - Health warning

## What This Enables

With the ESP32-CAM and enterprise WiFi support, you can:
1. ✅ Connect to your school/organization WiFi
2. ✅ Read BME680 sensor data automatically
3. ✅ Output JSON every 5 minutes
4. ✅ (Future) Send data directly to Firebase
5. ✅ Monitor air quality in real-time

The data will be ready to view in the Pack 1703 portal Ecology Dashboard!

