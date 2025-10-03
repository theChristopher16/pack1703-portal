# ESP32-CAM Upload Guide

## ESP32-CAM Special Requirements

The ESP32-CAM requires a special procedure to upload code because it doesn't have a built-in USB-to-Serial converter with auto-reset.

## Hardware Setup

### ESP32-CAM Connections
Your ESP32-CAM is connected via a USB-to-Serial adapter (detected at `/dev/cu.usbserial-0001`).

For uploading, you need to:

1. **Connect GPIO 0 to GND** (put ESP32 in programming mode)
2. **Press the RESET button** on the ESP32-CAM
3. **Upload the code**
4. **Disconnect GPIO 0 from GND** (return to normal mode)
5. **Press RESET again** to run the uploaded code

## Upload Steps via Command Line

### 1. Configure WiFi Settings

Before uploading, edit the sketch and add your WiFi credentials:

```bash
# Edit the sketch
nano ESP32_BME680/ESP32_BME680.ino

# Update these lines:
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

### 2. Put ESP32-CAM in Programming Mode

**IMPORTANT**: Connect GPIO 0 to GND on your ESP32-CAM before uploading!

### 3. Upload the Code

```bash
# Compile
arduino-cli compile --fqbn esp32:esp32:esp32cam ESP32_BME680

# Upload (with GPIO 0 connected to GND)
arduino-cli upload -p /dev/cu.usbserial-0001 --fqbn esp32:esp32:esp32cam ESP32_BME680
```

### 4. Return to Normal Mode

After upload completes:
1. **Disconnect GPIO 0 from GND**
2. **Press RESET button**

### 5. Monitor Serial Output

```bash
arduino-cli monitor -p /dev/cu.usbserial-0001 -c baudrate=115200
```

## Expected Output

Once running, you should see:

```
Pack 1703 BME680 Firebase Sender
=================================
BME680 sensor found and initialized!
Connecting to WiFi.........
WiFi connected!
IP address: 192.168.1.100
Signal strength: -45 dBm

BME680 Firebase Sender initialized successfully!
Sending sensor data every 5 minutes...

===========================================
Reading BME680 sensor data...
Real sensor data:

Sensor Readings:
  Timestamp: 12345 ms
  Temperature: 22.45 °C
  Humidity: 45.23 %
  Pressure: 1013.25 hPa
  Gas Resistance: 52000 ohms
  Air Quality Index: 50
  Device ID: esp32_garden_01
  Location: Pack 1703 Scout Garden

JSON Payload:
{"timestamp":"12345","temperature":22.45,"humidity":45.23,"pressure":1013.25,"gasResistance":52000,"airQualityIndex":50,"deviceId":"esp32_garden_01","location":"Pack 1703 Scout Garden"}

✅ Data ready to send to Firebase!
(Firebase sending requires API key configuration)
===========================================
```

## Quick Commands Reference

### Compile Only
```bash
arduino-cli compile --fqbn esp32:esp32:esp32cam ESP32_BME680
```

### Upload (GPIO 0 to GND required)
```bash
arduino-cli upload -p /dev/cu.usbserial-0001 --fqbn esp32:esp32:esp32cam ESP32_BME680
```

### Monitor Serial
```bash
arduino-cli monitor -p /dev/cu.usbserial-0001 -c baudrate=115200
```

### Exit Monitor
Press `Ctrl+C`

## Troubleshooting

### "Failed to connect to ESP32"
- **Solution**: Make sure GPIO 0 is connected to GND
- Press the RESET button while GPIO 0 is grounded
- Try the upload command immediately after pressing RESET

### "No serial data received"
- **Solution**: Check your USB-to-Serial connections
- Ensure TX → RX and RX → TX are correctly connected
- Try a different USB cable

### WiFi Not Connecting
- **Solution**: Double-check your SSID and password
- Make sure your WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
- Check WiFi signal strength

### BME680 Sensor Not Found
- **Solution**: Check I2C connections (SDA, SCL)
- The sketch will use simulated data if sensor is not connected
- Verify BME680 is powered (3.3V)

## ESP32-CAM GPIO Pinout

For connecting BME680 sensor:
- **3.3V** → BME680 VCC
- **GND** → BME680 GND
- **GPIO 14** → BME680 SCL (or use default I2C pins)
- **GPIO 15** → BME680 SDA (or use default I2C pins)

For programming mode:
- **GPIO 0** → GND (only during upload)

## Next Steps

1. Edit the sketch with your WiFi credentials
2. Connect GPIO 0 to GND
3. Upload the sketch
4. Disconnect GPIO 0 from GND and press RESET
5. Monitor the serial output
6. Configure Firebase API key for automatic uploads (optional)

The sketch will output sensor data every 5 minutes in JSON format, ready to be sent to Firebase!

