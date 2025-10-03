# Arduino BME680 Firestore Setup Guide

## Quick Setup Instructions

### 1. Install Required Libraries

Open Arduino IDE and install these libraries via **Tools > Manage Libraries**:

1. **Firebase ESP32 Client** by Mobizt
2. **Adafruit BME680** by Adafruit  
3. **Adafruit Unified Sensor** by Adafruit

### 2. Configure WiFi and Firebase

Edit the `BME680_Firestore_Sender.ino` file and update these values:

```cpp
// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";           // Your WiFi network name
const char* password = "YOUR_WIFI_PASSWORD";   // Your WiFi password

// Firebase Configuration  
#define FIREBASE_HOST "pack1703-portal-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "YOUR_FIREBASE_AUTH_TOKEN"  // Get from Firebase Console
```

### 3. Get Firebase Auth Token

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your `pack1703-portal` project
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Use the token from the downloaded JSON file

### 4. Hardware Connections

Connect your BME680 sensor to ESP32:

```
BME680    ESP32
------    -----
VCC   ->  3.3V
GND   ->  GND
SCL   ->  GPIO 22
SDA   ->  GPIO 21
```

### 5. Upload Code

1. Connect your ESP32 to computer via USB
2. Select **Tools > Board > ESP32 Arduino > ESP32 Dev Module**
3. Select the correct **Port** (should show `/dev/tty.usbserial-0001`)
4. Click **Upload**

### 6. Monitor Serial Output

1. Open **Tools > Serial Monitor**
2. Set baud rate to **115200**
3. You should see:
   - WiFi connection status
   - BME680 initialization
   - Data being sent every 5 minutes

## Expected Output

```
Pack 1703 BME680 Firestore Sender
=================================
Connecting to WiFi........
WiFi connected!
IP address: 192.168.1.100
BME680 Firestore Sender initialized successfully!
Sending data every 5 minutes...

Reading BME680 sensor data...
Sensor Readings:
  Temperature: 22.45 °C
  Humidity: 45.23 %
  Pressure: 1013.25 hPa
  Gas Resistance: 52000 ohms
  Air Quality Index: 50
Sending data to Firebase...
✅ BME680 data sent successfully to Firestore!
Document ID: -Nxxxxxxxxxxxxxxxxx
----------------------------------------
```

## Troubleshooting

### Common Issues

1. **"Could not find BME680 sensor"**
   - Check wiring connections
   - Verify sensor is powered (3.3V)
   - Try different I2C pins

2. **WiFi connection fails**
   - Double-check SSID and password
   - Ensure WiFi network is 2.4GHz (ESP32 doesn't support 5GHz)
   - Check signal strength

3. **Firebase connection fails**
   - Verify Firebase project name
   - Check auth token is correct
   - Ensure Firestore is enabled in Firebase Console

4. **No data in Firestore**
   - Check Firebase security rules
   - Verify collection name is `bme680_readings`
   - Check Serial Monitor for error messages

### Testing Without BME680

If you don't have a BME680 sensor yet, you can test with mock data by modifying the `sendBME680Data()` function:

```cpp
void sendBME680Data() {
  // Mock data for testing
  float temperature = 22.0 + random(-5, 5);
  float humidity = 45.0 + random(-10, 10);
  float pressure = 1013.0 + random(-10, 10);
  float gasResistance = 50000 + random(-10000, 10000);
  int airQualityIndex = calculateAQI(gasResistance);
  
  // ... rest of the function remains the same
}
```

## Data Structure

The Arduino sends data to Firestore in this format:

```json
{
  "timestamp": "2025-01-30T20:30:00.000Z",
  "temperature": 22.45,
  "humidity": 45.23,
  "pressure": 1013.25,
  "gasResistance": 52000,
  "airQualityIndex": 50,
  "deviceId": "esp32_garden_01",
  "location": "Pack 1703 Scout Garden"
}
```

## Next Steps

1. Upload the code to your ESP32
2. Monitor the Serial output for successful data transmission
3. Check the Pack 1703 portal Ecology Dashboard to see live data
4. Adjust the `sendInterval` if you want different update frequencies

The data will appear in the **Ecology Dashboard** of your Pack 1703 portal, replacing the mock data with real sensor readings!
