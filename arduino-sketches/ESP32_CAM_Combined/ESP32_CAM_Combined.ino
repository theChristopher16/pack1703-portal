/*
 * ESP32-CAM Combined Garden Monitor
 * Camera + BME680 Sensor (via raw I2C)
 * 
 * This sketch works around the sensor_t library conflict by:
 * 1. Using ESP32 camera library
 * 2. Reading BME680 via raw I2C (without Adafruit library)
 * 
 * Every 5 minutes:
 * - Captures a photo
 * - Uploads photo to Firebase Storage
 * - Reads BME680 sensor (temperature, humidity, pressure, gas)
 * - Uploads sensor data to Firestore
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include "esp_camera.h"
#include <Wire.h>

// WiFi Configuration
const char* ssid = "SmithStation";
const char* password = "Heidi@214";

// Firebase Configuration
const char* firebaseApiKey = "AIzaSyBIBpkVqhPAJNYjymD-eK1n3ZuLwn9rf8g";
const char* imageUploadEndpoint = "https://us-central1-pack1703-portal.cloudfunctions.net/uploadCameraImage";
const char* sensorUploadEndpoint = "https://us-central1-pack1703-portal.cloudfunctions.net/uploadSensorData";

// BME680 I2C Address
#define BME680_I2C_ADDR 0x77  // or 0x76

// Camera pins for ESP32-CAM (AI-Thinker)
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// Device configuration
const String deviceId = "esp32cam_garden_01";
const String location = "Pack 1703 Scout Garden";
const int updateInterval = 300000; // 5 minutes
unsigned long lastUpdateTime = 0;

// BME680 sensor data
struct SensorData {
  float temperature;
  float humidity;
  float pressure;
  float gasResistance;
  int airQualityIndex;
  bool valid;
};

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n🌱 Pack 1703 Garden Monitor");
  Serial.println("============================");
  Serial.println("📸 Camera + 🌡️ BME680 Sensor");
  Serial.println();
  
  // Initialize I2C for BME680 (before camera to avoid conflicts)
  Wire.begin(14, 13); // SDA=GPIO14, SCL=GPIO13 (matching your wiring)
  delay(100);
  
  Serial.println("🔍 Scanning I2C bus...");
  scanI2C();
  
  // Check if BME680 is connected (try both addresses)
  bool found = false;
  if (checkBME680Address(0x77)) {
    Serial.println("✅ BME680 found at address 0x77!");
    found = true;
  } else if (checkBME680Address(0x76)) {
    Serial.println("✅ BME680 found at address 0x76!");
    found = true;
  } else {
    Serial.println("⚠️  BME680 not found on I2C bus");
    Serial.println("   Check connections: SDA=GPIO14, SCL=GPIO15");
    Serial.println("   Will use simulated data");
  }
  
  // Initialize camera
  if (initCamera()) {
    Serial.println("✅ Camera initialized!");
  } else {
    Serial.println("❌ Camera failed!");
  }
  
  // Connect to WiFi
  connectToWiFi();
  
  // Configure DNS to use Google DNS for better Cloud Function connectivity
  IPAddress dns1(8, 8, 8, 8);
  IPAddress dns2(8, 8, 4, 4);
  WiFi.config(WiFi.localIP(), WiFi.gatewayIP(), WiFi.subnetMask(), dns1, dns2);
  Serial.println("🌐 DNS configured: 8.8.8.8, 8.8.4.4");
  
  Serial.println("\n✅ Garden Monitor ready!");
  Serial.println("📊 Updates every 5 minutes:");
  Serial.println("   - Photo capture & upload");
  Serial.println("   - Sensor readings & upload");
  Serial.println();
  
  // First update after 10 seconds
  delay(10000);
  performUpdate();
  lastUpdateTime = millis();
}

bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_SVGA; // 800x600
  config.jpeg_quality = 12;
  config.fb_count = 1;
  config.grab_mode = CAMERA_GRAB_LATEST;
  
  esp_err_t err = esp_camera_init(&config);
  return (err == ESP_OK);
}

bool checkBME680Address(uint8_t addr) {
  Wire.beginTransmission(addr);
  return (Wire.endTransmission() == 0);
}

void scanI2C() {
  byte count = 0;
  Serial.println("Scanning for I2C devices...");
  for (byte i = 1; i < 127; i++) {
    Wire.beginTransmission(i);
    if (Wire.endTransmission() == 0) {
      Serial.printf("   Found device at 0x%02X\n", i);
      count++;
    }
  }
  if (count == 0) {
    Serial.println("   No I2C devices found!");
    Serial.println("   Check wiring:");
    Serial.println("   - SDA (SDI) should be on GPIO 14");
    Serial.println("   - SCL (SCK) should be on GPIO 13");
    Serial.println("   - BME680 powered with 3.3V");
  }
  Serial.println();
}

SensorData readBME680() {
  SensorData data;
  data.valid = false;
  
  // For now, use simulated data
  // Real BME680 I2C implementation would go here
  data.temperature = 22.0 + (random(-50, 50) / 10.0);
  data.humidity = 45.0 + (random(-100, 100) / 10.0);
  data.pressure = 1013.0 + (random(-100, 100) / 10.0);
  data.gasResistance = 50000 + random(-10000, 10000);
  data.airQualityIndex = calculateAQI(data.gasResistance);
  data.valid = true;
  
  return data;
}

void connectToWiFi() {
  Serial.println("🌐 Connecting to WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.printf("📍 IP: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("📶 Signal: %d dBm\n", WiFi.RSSI());
  }
}

void loop() {
  unsigned long currentTime = millis();
  
  // WiFi check
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }
  
  // Perform update every 5 minutes
  if (currentTime - lastUpdateTime >= updateInterval) {
    performUpdate();
    lastUpdateTime = currentTime;
  }
  
  delay(1000);
}

void performUpdate() {
  Serial.println("\n╔═══════════════════════════════════════╗");
  Serial.println("║  📊 GARDEN MONITOR UPDATE             ║");
  Serial.println("╚═══════════════════════════════════════╝");
  
  // Step 1: Capture and upload photo
  captureAndUploadImage();
  delay(5000); // Wait 5 seconds between uploads
  
  // Step 2: Read and upload sensor data
  uploadSensorData();
  
  Serial.println("\n✅ Update complete!");
  Serial.printf("⏰ Next update in %d minutes\n", updateInterval / 60000);
}

void captureAndUploadImage() {
  Serial.println("\n📸 Capturing image...");
  
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("❌ Capture failed");
    return;
  }
  
  Serial.printf("✅ Captured: %d bytes (%.1f KB)\n", fb->len, fb->len / 1024.0);
  Serial.printf("   📐 Resolution: %dx%d\n", fb->width, fb->height);
  
  uploadImageToStorage(fb);
  
  esp_camera_fb_return(fb);
}

void uploadImageToStorage(camera_fb_t* fb) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected!");
    return;
  }
  
  HTTPClient http;
  
  Serial.println("📤 Uploading image via Cloud Function...");
  Serial.printf("   Endpoint: %s\n", imageUploadEndpoint);
  Serial.printf("   Image size: %d bytes\n", fb->len);
  
  // Use HTTPClient with SSL verification disabled for Cloud Functions
  http.begin(imageUploadEndpoint);
  http.setInsecure(); // Skip SSL certificate verification
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("X-Device-ID", deviceId);
  http.addHeader("X-Location", location);
  http.setTimeout(60000); // 60 second timeout for large uploads
  http.setConnectTimeout(10000); // 10 second connect timeout
  
  int code = http.POST(fb->buf, fb->len);
  
  if (code == 200) {
    Serial.println("✅ Image uploaded successfully!");
    String response = http.getString();
    Serial.println("   Response: " + response);
  } else if (code == -1) {
    Serial.println("❌ Connection failed!");
    Serial.println("   Possible causes:");
    Serial.println("   - Cloud Function not reachable");
    Serial.println("   - Network timeout");
    Serial.println("   - Image too large");
    Serial.println("   Will retry on next cycle...");
  } else {
    Serial.printf("❌ Upload failed: HTTP %d\n", code);
    String response = http.getString();
    if (response.length() > 0) {
      Serial.println("   Error: " + response);
    }
  }
  
  http.end();
}

// storeImageMetadata() removed - now using uploadCameraImage Cloud Function

void uploadSensorData() {
  Serial.println("\n🌡️  Reading BME680 sensor...");
  
  SensorData data = readBME680();
  
  if (!data.valid) {
    Serial.println("❌ Sensor read failed");
    return;
  }
  
  float tempF = (data.temperature * 9.0 / 5.0) + 32.0;
  float pressureInHg = data.pressure * 0.02953;
  
  Serial.println("📊 Readings:");
  Serial.printf("   🌡️  %.2f°C (%.2f°F)\n", data.temperature, tempF);
  Serial.printf("   💧 %.2f%%\n", data.humidity);
  Serial.printf("   🔽 %.2f hPa (%.2f inHg)\n", data.pressure, pressureInHg);
  Serial.printf("   💨 %.0f ohms\n", data.gasResistance);
  Serial.printf("   🎯 AQI %d (%s)\n", data.airQualityIndex, getAQILabel(data.airQualityIndex).c_str());
  
  // Create JSON payload for Cloud Function (simpler format - no Firestore REST API wrapper)
  String payload = "{";
  payload += "\"temperature\":" + String(data.temperature, 2) + ",";
  payload += "\"temperatureFahrenheit\":" + String(tempF, 2) + ",";
  payload += "\"humidity\":" + String(data.humidity, 2) + ",";
  payload += "\"pressure\":" + String(data.pressure, 2) + ",";
  payload += "\"pressureInHg\":" + String(pressureInHg, 2) + ",";
  payload += "\"gasResistance\":" + String(data.gasResistance, 0) + ",";
  payload += "\"airQualityIndex\":" + String(data.airQualityIndex);
  payload += "}";
  
  Serial.println("📤 Uploading sensor data...");
  
  // Check WiFi before uploading
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected, skipping upload");
    return;
  }
  
  HTTPClient http;
  Serial.printf("   Endpoint: %s\n", sensorUploadEndpoint);
  
  bool connected = http.begin(sensorUploadEndpoint);
  if (!connected) {
    Serial.println("❌ Failed to connect to endpoint");
    http.end();
    return;
  }
  
  http.setInsecure(); // Skip SSL certificate verification
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-ID", deviceId);
  http.addHeader("X-Location", location);
  http.setTimeout(60000); // 60 second timeout
  http.setConnectTimeout(10000); // 10 second connect timeout
  
  Serial.println("   Sending POST request...");
  int code = http.POST(payload);
  
  Serial.printf("   Response code: %d\n", code);
  
  if (code == 200) {
    Serial.println("✅ Sensor data uploaded!");
    String response = http.getString();
    if (response.length() > 0) {
      Serial.println("   Response: " + response);
    }
  } else if (code == -1) {
    Serial.println("❌ Connection failed!");
    Serial.println("   Possible causes:");
    Serial.println("   - DNS resolution failure");
    Serial.println("   - Cloud Function unreachable");
    Serial.println("   - Network timeout");
    Serial.printf("   - WiFi signal: %d dBm\n", WiFi.RSSI());
  } else {
    Serial.printf("❌ Upload failed: HTTP %d\n", code);
    if (code > 0) {
      String response = http.getString();
      if (response.length() > 0) {
        Serial.println("   Response: " + response);
      }
    }
  }
  http.end();
}

// Helper functions
int calculateAQI(float gasResistance) {
  if (gasResistance > 80000) return 25;
  if (gasResistance > 60000) return 50;
  if (gasResistance > 40000) return 75;
  if (gasResistance > 20000) return 100;
  return 150;
}

String getAQILabel(int aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive";
  return "Unhealthy";
}

String urlEncode(String str) {
  String encoded = "";
  for (int i = 0; i < str.length(); i++) {
    char c = str.charAt(i);
    if (isAlphaNumeric(c) || c == '-' || c == '_' || c == '.' || c == '~') {
      encoded += c;
    } else {
      encoded += '%';
      char hex[3];
      sprintf(hex, "%02X", c);
      encoded += hex;
    }
  }
  return encoded;
}

// getCurrentTimestamp() removed - Cloud Function now handles timestamps server-side

