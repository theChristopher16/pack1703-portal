/*
 * ESP32-CAM Garden Monitor with Camera + BME680 Sensor
 * Pack 1703 Scout Garden Environmental Monitoring
 * 
 * Note: Due to library conflicts between esp_camera and Adafruit_Sensor,
 * this version uses camera-only functionality. BME680 sensor data is handled
 * by a separate sketch running on a different ESP32.
 * 
 * Features:
 * - Camera capture every hour
 * - Upload images to Firebase Storage
 * - Store metadata in Firestore
 * - WiFi reconnection
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include "esp_camera.h"
#include "esp_eap_client.h"

// WiFi Configuration
const char* ssid = "SmithStation";
const char* password = "Heidi@214";

// Firebase Configuration
const char* firebaseApiKey = "AIzaSyBIBpkVqhPAJNYjymD-eK1n3ZuLwn9rf8g";
const char* firebaseProjectId = "pack1703-portal";
const char* firestoreEndpoint = "https://firestore.googleapis.com/v1/projects/pack1703-portal/databases/(default)/documents";
const char* storageEndpoint = "https://firebasestorage.googleapis.com/v0/b/pack1703-portal.firebasestorage.app/o";

// Camera pins for ESP32-CAM (AI-Thinker model)
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
const int cameraInterval = 3600000; // 1 hour
unsigned long lastCameraTime = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n📸 Pack 1703 Garden Camera");
  Serial.println("===========================");
  
  // Initialize camera
  if (initCamera()) {
    Serial.println("✅ Camera initialized!");
  } else {
    Serial.println("❌ Camera initialization failed!");
    Serial.println("Restarting in 5 seconds...");
    delay(5000);
    ESP.restart();
  }
  
  // Connect to WiFi
  connectToWiFi();
  
  Serial.println("\n✅ Garden Camera initialized!");
  Serial.println("📸 Capturing images every hour");
  Serial.println();
  
  // Take first photo immediately
  delay(2000);
  captureAndUploadImage();
  lastCameraTime = millis();
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
  
  // Frame size and quality
  config.frame_size = FRAMESIZE_SVGA; // 800x600
  config.jpeg_quality = 10; // 0-63, lower is higher quality
  config.fb_count = 1;
  config.grab_mode = CAMERA_GRAB_LATEST;
  
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    return false;
  }
  
  // Camera settings
  sensor_t* s = esp_camera_sensor_get();
  s->set_brightness(s, 0);     // -2 to 2
  s->set_contrast(s, 0);       // -2 to 2
  s->set_saturation(s, 0);     // -2 to 2
  s->set_special_effect(s, 0); // 0-6 (0 = No Effect)
  s->set_whitebal(s, 1);       // 0 = disable, 1 = enable
  s->set_awb_gain(s, 1);       // 0 = disable, 1 = enable
  s->set_wb_mode(s, 0);        // 0-4
  s->set_exposure_ctrl(s, 1);  // 0 = disable, 1 = enable
  s->set_aec2(s, 0);           // 0 = disable, 1 = enable
  s->set_gain_ctrl(s, 1);      // 0 = disable, 1 = enable
  s->set_agc_gain(s, 0);       // 0-30
  s->set_gainceiling(s, (gainceiling_t)0); // 0-6
  s->set_bpc(s, 0);            // 0 = disable, 1 = enable
  s->set_wpc(s, 1);            // 0 = disable, 1 = enable
  s->set_raw_gma(s, 1);        // 0 = disable, 1 = enable
  s->set_lenc(s, 1);           // 0 = disable, 1 = enable
  s->set_hmirror(s, 0);        // 0 = disable, 1 = enable
  s->set_vflip(s, 0);          // 0 = disable, 1 = enable
  s->set_dcw(s, 1);            // 0 = disable, 1 = enable
  s->set_colorbar(s, 0);       // 0 = disable, 1 = enable
  
  return true;
}

void connectToWiFi() {
  Serial.println("\n🌐 Connecting to WiFi...");
  Serial.print("Network: ");
  Serial.println(ssid);
  
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
    Serial.print("📍 IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("📶 Signal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n❌ WiFi connection failed!");
  }
}

void loop() {
  unsigned long currentTime = millis();
  
  // Check WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi disconnected, reconnecting...");
    connectToWiFi();
  }
  
  // Capture image every hour
  if (currentTime - lastCameraTime >= cameraInterval) {
    captureAndUploadImage();
    lastCameraTime = currentTime;
  }
  
  delay(1000);
}

void captureAndUploadImage() {
  Serial.println("\n===========================================");
  Serial.println("📸 Capturing image...");
  
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("❌ Camera capture failed");
    return;
  }
  
  Serial.printf("✅ Image captured!\n");
  Serial.printf("   Size: %d bytes (%.1f KB)\n", fb->len, fb->len / 1024.0);
  Serial.printf("   Resolution: %dx%d\n", fb->width, fb->height);
  Serial.printf("   Format: %s\n", fb->format == PIXFORMAT_JPEG ? "JPEG" : "Other");
  
  // Upload to Firebase Storage
  uploadImageToStorage(fb);
  
  esp_camera_fb_return(fb);
}

void uploadImageToStorage(camera_fb_t* fb) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected!");
    return;
  }
  
  HTTPClient http;
  
  // Generate filename with timestamp
  String filename = "garden_" + String(millis()) + ".jpg";
  String encodedFilename = urlEncode(filename);
  String url = String(storageEndpoint) + "/" + encodedFilename + "?uploadType=media&name=" + encodedFilename;
  
  Serial.println("📤 Uploading to Firebase Storage...");
  
  http.begin(url);
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("Authorization", "Bearer " + String(firebaseApiKey));
  
  int code = http.POST(fb->buf, fb->len);
  
  if (code == 200 || code == 201) {
    Serial.println("✅ Image uploaded to Storage!");
    
    // Store metadata in Firestore
    storeImageMetadata(filename, fb->len, fb->width, fb->height);
  } else {
    Serial.printf("❌ Upload failed: HTTP %d\n", code);
    String response = http.getString();
    Serial.println("Response: " + response);
  }
  
  http.end();
}

void storeImageMetadata(String filename, size_t fileSize, int width, int height) {
  HTTPClient http;
  String url = String(firestoreEndpoint) + "/camera_images?key=" + String(firebaseApiKey);
  
  // Get current time string
  String timestamp = getCurrentTimestamp();
  String downloadUrl = "https://firebasestorage.googleapis.com/v0/b/pack1703-portal.firebasestorage.app/o/" + urlEncode(filename) + "?alt=media";
  
  String payload = "{\"fields\":{";
  payload += "\"filename\":{\"stringValue\":\"" + filename + "\"},";
  payload += "\"url\":{\"stringValue\":\"" + downloadUrl + "\"},";
  payload += "\"deviceId\":{\"stringValue\":\"" + deviceId + "\"},";
  payload += "\"location\":{\"stringValue\":\"" + location + "\"},";
  payload += "\"width\":{\"integerValue\":\"" + String(width) + "\"},";
  payload += "\"height\":{\"integerValue\":\"" + String(height) + "\"},";
  payload += "\"size\":{\"integerValue\":\"" + String(fileSize) + "\"},";
  payload += "\"timestamp\":{\"timestampValue\":\"" + timestamp + "\"}";
  payload += "}}";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  int code = http.POST(payload);
  if (code == 200) {
    Serial.println("✅ Metadata stored in Firestore!");
    Serial.println("🌐 View at: https://sfpack1703.web.app/ecology");
  } else {
    Serial.printf("❌ Metadata upload failed: HTTP %d\n", code);
  }
  http.end();
}

String urlEncode(String str) {
  String encoded = "";
  char c;
  for (int i = 0; i < str.length(); i++) {
    c = str.charAt(i);
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

String getCurrentTimestamp() {
  // Simple ISO 8601 timestamp
  // In production, sync with NTP server
  unsigned long ms = millis();
  unsigned long seconds = ms / 1000;
  unsigned long minutes = seconds / 60;
  unsigned long hours = minutes / 60;
  unsigned long days = hours / 24;
  
  String timestamp = "2025-10-";
  timestamp += String(1 + (days % 30));
  timestamp += "T";
  timestamp += String(hours % 24) + ":";
  timestamp += String(minutes % 60) + ":";
  timestamp += String(seconds % 60) + ".000Z";
  
  return timestamp;
}
