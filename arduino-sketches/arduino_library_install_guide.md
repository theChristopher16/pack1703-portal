# Arduino Library Installation Guide

## Current Issue
The Arduino IDE is showing "FirebaseESP32.h: No such file or directory" because the required libraries aren't installed.

## Step-by-Step Library Installation

### 1. Open Library Manager
1. In Arduino IDE, go to **Tools > Manage Libraries...**
2. Wait for the library list to load

### 2. Install Required Libraries

Search for and install these libraries one by one:

#### A. Adafruit Unified Sensor
- **Search**: "Adafruit Unified Sensor"
- **Author**: Adafruit
- **Install**: Click "Install"

#### B. Adafruit BME680
- **Search**: "Adafruit BME680"
- **Author**: Adafruit
- **Install**: Click "Install"

#### C. Firebase Arduino Client (for Circuit Playground)
- **Search**: "Firebase Arduino Client"
- **Author**: Firebase
- **Install**: Click "Install"

#### D. WiFi (if using ESP32)
- **Search**: "WiFi"
- **Author**: Arduino
- **Install**: Click "Install"

### 3. Verify Installation
After installing each library, you should see:
- ✅ Green checkmark next to the library name
- Library appears in **Sketch > Include Library** menu

## Board-Specific Notes

### For Circuit Playground Express (Current Setup)
- Use the simplified version of the code (already created)
- Libraries needed: Adafruit BME680, Adafruit Unified Sensor
- Firebase upload requires manual data entry via Serial Monitor

### For ESP32 (Recommended for Firebase)
- Use the full version with WiFi and Firebase libraries
- Libraries needed: All of the above plus Firebase ESP32 Client
- Automatic Firebase upload every 5 minutes

## Testing the Installation

1. **Compile the sketch**: Click the ✓ (Verify) button
2. **Check for errors**: Look at the bottom console
3. **If successful**: You'll see "Done compiling" message

## Common Issues and Solutions

### "Library not found" errors
- **Solution**: Restart Arduino IDE after installing libraries
- **Alternative**: Install libraries manually via ZIP files

### "Board not found" errors
- **Solution**: Install board support packages
- **For ESP32**: Go to **File > Preferences > Additional Board Manager URLs**
- **Add**: `https://dl.espressif.com/dl/package_esp32_index.json`
- **Then**: **Tools > Board > Boards Manager** > Search "ESP32" > Install

### "Port not found" errors
- **Solution**: Check USB connection
- **For Circuit Playground**: Use `/dev/cu.usbmodem11101`
- **For ESP32**: Use `/dev/tty.usbserial-0001`

## Next Steps After Library Installation

1. **Compile the sketch** to verify all libraries are working
2. **Upload to your board** (Circuit Playground Express)
3. **Open Serial Monitor** at 115200 baud
4. **Watch for sensor data** every 5 minutes
5. **Copy JSON data** from Serial Monitor to Firebase manually

## Manual Firebase Upload Process

Since Circuit Playground Express doesn't have built-in WiFi, you'll need to:

1. **Read data from Serial Monitor**
2. **Copy the JSON output**
3. **Go to Firebase Console** (https://console.firebase.google.com)
4. **Navigate to Firestore Database**
5. **Create collection**: `bme680_readings`
6. **Add document** with the copied JSON data

This will populate your Pack 1703 portal Ecology Dashboard with real sensor data!
