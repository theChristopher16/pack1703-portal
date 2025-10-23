# Quick Upload Instructions

## Current Status
✅ Sketch compiled with correct I2C pins:
- SDA (SDI) = GPIO 14
- SCL (SCK) = GPIO 13

## To Upload:

### 1. Put ESP32-CAM in Programming Mode
- Connect **GPIO 0** to **GND**
- Press **RESET** button

### 2. Run Upload Command
```bash
arduino-cli upload -p /dev/cu.usbserial-0001 --fqbn esp32:esp32:esp32cam arduino-sketches/ESP32_CAM_Combined
```

### 3. Return to Normal Mode
- Disconnect GPIO 0 from GND
- Press RESET button

### 4. Monitor Output
```bash
arduino-cli monitor -p /dev/cu.usbserial-0001 -c baudrate=115200
```

## Expected Output After Fix:

```
🔍 Scanning I2C bus...
   Found device at 0x76 (or 0x77)
✅ BME680 found at address 0x76!
✅ Camera initialized!
```

Then real sensor data instead of simulated!












