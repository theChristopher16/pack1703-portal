# Arduino Upload Instructions via Command Line

## Current Status
- ✅ `arduino-cli` installed
- ✅ Adafruit SAMD boards installed
- ✅ All required libraries installed (Adafruit BusIO, Unified Sensor, BME680)
- ✅ Sketch compiled successfully

## Upload to Circuit Playground Express

### Step 1: Put the board in bootloader mode

1. **Double-click the reset button** on your Circuit Playground Express
2. The board should show a **pulsing red/green LED** 
3. A new port will appear (usually `/dev/cu.usbmodem*` instead of `/dev/cu.usbserial-0001`)

### Step 2: Check for the new port

```bash
arduino-cli board list
```

Look for a port like `/dev/cu.usbmodem1101` or similar.

### Step 3: Upload the sketch

```bash
arduino-cli upload -p /dev/cu.usbmodem1101 --fqbn adafruit:samd:adafruit_circuitplayground_m0 BME680_Sketch
```

(Replace `/dev/cu.usbmodem1101` with the actual port from step 2)

### Step 4: Monitor serial output

```bash
arduino-cli monitor -p /dev/cu.usbmodem1101 -c baudrate=115200
```

(Replace `/dev/cu.usbmodem1101` with your actual port)

## Alternative: Quick Commands

### Compile
```bash
arduino-cli compile --fqbn adafruit:samd:adafruit_circuitplayground_m0 BME680_Sketch
```

### Upload (after double-clicking reset)
```bash
# First, find the port
arduino-cli board list

# Then upload (replace PORT with actual port)
arduino-cli upload -p PORT --fqbn adafruit:samd:adafruit_circuitplayground_m0 BME680_Sketch
```

### Monitor Serial
```bash
arduino-cli monitor -p PORT -c baudrate=115200
```

## Expected Output

Once uploaded and running, you should see:

```
Pack 1703 BME680 Firestore Sender
=================================
BME680 sensor found and initialized!
BME680 Firestore Sender initialized successfully!
Reading sensor data every 5 minutes...
Data will be printed to Serial Monitor
For Firebase upload, use ESP32 board with WiFi libraries

Reading BME680 sensor data...
Using simulated sensor data...
Sensor Readings:
  Timestamp: 12345
  Temperature: 22.45 °C
  Humidity: 45.23 %
  Pressure: 1013.25 hPa
  Gas Resistance: 52000 ohms
  Air Quality Index: 50
  Device ID: arduino_garden_01
  Location: Pack 1703 Scout Garden

JSON Data (copy this to Firebase manually):
{
  "timestamp": "12345",
  "temperature": 22.45,
  "humidity": 45.23,
  "pressure": 1013.25,
  "gasResistance": 52000,
  "airQualityIndex": 50,
  "deviceId": "arduino_garden_01",
  "location": "Pack 1703 Scout Garden"
}
```

## Troubleshooting

### "No device found" error
- Make sure you **double-clicked the reset button** to enter bootloader mode
- Look for the pulsing red/green LED on the board
- The port will change to `/dev/cu.usbmodem*` when in bootloader mode

### Board not detected
- Try a different USB cable (some cables are charge-only)
- Try a different USB port
- Restart the board by unplugging and replugging

### Upload fails
- Double-click reset again to re-enter bootloader mode
- Upload within 5-10 seconds of double-clicking reset
- If it times out, just double-click reset and try again

## Exit Serial Monitor
Press `Ctrl+C` to exit the serial monitor.

