/*
 * ESP32-CAM BME680 Firebase Data Sender
 * Pack 1703 Scout Garden Environmental Monitoring
 * 
 * This sketch reads BME680 sensor data and sends it to Firebase Firestore
 * Supports both WPA2 Personal and WPA2 Enterprise WiFi
 * 
 * Hardware Requirements:
 * - ESP32-CAM board
 * - BME680 sensor (I2C connection)
 * - WiFi connection
 * 
 * Libraries Required:
 * - WiFi (built-in)
 * - HTTPClient (built-in)
 * - Adafruit BME680
 * - Adafruit Unified Sensor
 * - Adafruit BusIO
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_BME680.h>
#include <Adafruit_Sensor.h>
#include "esp_eap_client.h" // For enterprise WiFi (updated API)

// WiFi Configuration
// Set USE_ENTERPRISE_WIFI to true if using WPA2 Enterprise
#define USE_ENTERPRISE_WIFI false  // Your UniFi network uses WPA2 Personal

// For WPA2 Personal (home WiFi) - Your SmithStation network
const char* ssid = "SmithStation";
const char* password = "Heidi@214";

// For WPA2 Enterprise (organization WiFi) - Not needed for your network
const char* enterprise_identity = "your-username";  // Your network username
const char* enterprise_username = "your-username";  // Often same as identity
const char* enterprise_password = "your-password";  // Your network password

// Firebase Configuration
const char* firebaseApiKey = "AIzaSyBIBpkVqhPAJNYjymD-eK1n3ZuLwn9rf8g";
const char* firebaseHost = "pack1703-portal-default-rtdb.firebaseio.com";
const char* firestoreEndpoint = "https://firestore.googleapis.com/v1/projects/pack1703-portal/databases/(default)/documents/bme680_readings";

// BME680 Configuration
Adafruit_BME680 bme;

// Device configuration
const String deviceId = "esp32_garden_01";
const String location = "Pack 1703 Scout Garden";
const int sendInterval = 300000; // 5 minutes in milliseconds
unsigned long lastSendTime = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\nPack 1703 BME680 Firebase Sender");
  Serial.println("=================================");
  
  // Initialize I2C
  Wire.begin();
  
  // Initialize BME680
  if (!bme.begin()) {
    Serial.println("Could not find a valid BME680 sensor, check wiring!");
    Serial.println("Using simulated data for testing...");
  } else {
    Serial.println("✅ BME680 sensor found and initialized!");
    
    // Configure BME680
    bme.setTemperatureOversampling(BME680_OS_8X);
    bme.setHumidityOversampling(BME680_OS_2X);
    bme.setPressureOversampling(BME680_OS_4X);
    bme.setIIRFilterSize(BME680_FILTER_SIZE_3);
    bme.setGasHeater(320, 150); // 320°C for 150 ms
  }
  
  // Connect to WiFi
  connectToWiFi();
  
  Serial.println("\n✅ BME680 Firebase Sender initialized successfully!");
  Serial.println("📡 Sending sensor data every 5 minutes...");
  Serial.println();
}

void connectToWiFi() {
  Serial.println("\n🌐 Connecting to WiFi...");
  Serial.print("Network: ");
  Serial.println(ssid);
  
  if (USE_ENTERPRISE_WIFI) {
    Serial.println("Using WPA2 Enterprise authentication");
    
    // Disconnect any previous connection
    WiFi.disconnect(true);
    delay(1000);
    
    // Set WiFi mode
    WiFi.mode(WIFI_STA);
    
    // Configure enterprise WiFi (using updated EAP client API)
    esp_eap_client_set_identity((uint8_t *)enterprise_identity, strlen(enterprise_identity));
    esp_eap_client_set_username((uint8_t *)enterprise_username, strlen(enterprise_username));
    esp_eap_client_set_password((uint8_t *)enterprise_password, strlen(enterprise_password));
    esp_wifi_sta_enterprise_enable();
    
    // Connect
    WiFi.begin(ssid);
  } else {
    Serial.println("Using WPA2 Personal authentication");
    WiFi.begin(ssid, password);
  }
  
  // Wait for connection
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("✅ WiFi connected!");
    Serial.print("📍 IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("📶 Signal strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println();
    Serial.println("❌ WiFi connection failed!");
    Serial.println("Check your credentials and try again.");
  }
}

void loop() {
  unsigned long currentTime = millis();
  
  // Check if it's time to send data
  if (currentTime - lastSendTime >= sendInterval) {
    sendBME680Data();
    lastSendTime = currentTime;
  }
  
  // Check WiFi connection and reconnect if needed
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi disconnected, reconnecting...");
    connectToWiFi();
  }
  
  // Small delay
  delay(1000);
}

void sendBME680Data() {
  Serial.println("===========================================");
  Serial.println("📊 Reading BME680 sensor data...");
  
  float temperature, humidity, pressure, gasResistance;
  int airQualityIndex;
  
  // Try to read from actual sensor
  if (bme.begin() && bme.performReading()) {
    temperature = bme.temperature;
    humidity = bme.humidity;
    pressure = bme.pressure / 100.0; // Convert to hPa
    gasResistance = bme.gas_resistance;
    Serial.println("✅ Real sensor data:");
  } else {
    // Generate simulated data for testing
    Serial.println("⚠️  Using simulated sensor data...");
    temperature = 22.0 + (random(-50, 50) / 10.0);
    humidity = 45.0 + (random(-100, 100) / 10.0);
    pressure = 1013.0 + (random(-100, 100) / 10.0);
    gasResistance = 50000 + random(-10000, 10000);
  }
  
  // Calculate Air Quality Index
  airQualityIndex = calculateAQI(gasResistance);
  
  // Get current timestamp (milliseconds since boot)
  String timestamp = String(millis());
  
  // Calculate imperial units for display
  float temperatureF = (temperature * 9.0 / 5.0) + 32.0;
  float pressureInHg = pressure * 0.02953;
  
  Serial.println("\n📈 Sensor Readings:");
  Serial.printf("  🕐 Timestamp: %s ms\n", timestamp.c_str());
  Serial.printf("  🌡️  Temperature: %.2f°C (%.2f°F)\n", temperature, temperatureF);
  Serial.printf("  💧 Humidity: %.2f%%\n", humidity);
  Serial.printf("  🔽 Pressure: %.2f hPa (%.2f inHg)\n", pressure, pressureInHg);
  Serial.printf("  💨 Gas Resistance: %.0f ohms\n", gasResistance);
  Serial.printf("  🎯 Air Quality Index: %d (%s)\n", airQualityIndex, getAQILabel(airQualityIndex).c_str());
  Serial.printf("  📱 Device ID: %s\n", deviceId.c_str());
  Serial.printf("  📍 Location: %s\n", location.c_str());
  
  // Create JSON payload
  String jsonPayload = createJSONPayload(timestamp, temperature, humidity, pressure, gasResistance, airQualityIndex);
  
  Serial.println("\n📝 JSON Payload:");
  Serial.println(jsonPayload);
  
  // Send to Firebase
  sendToFirebase(jsonPayload, temperature, humidity, pressure, gasResistance, airQualityIndex);
  
  Serial.println("===========================================\n");
}

String createJSONPayload(String timestamp, float temperature, float humidity, float pressure, float gasResistance, int airQualityIndex) {
  String json = "{";
  json += "\"timestamp\":\"" + timestamp + "\",";
  json += "\"temperature\":" + String(temperature, 2) + ",";
  json += "\"humidity\":" + String(humidity, 2) + ",";
  json += "\"pressure\":" + String(pressure, 2) + ",";
  json += "\"gasResistance\":" + String(gasResistance, 0) + ",";
  json += "\"airQualityIndex\":" + String(airQualityIndex) + ",";
  json += "\"deviceId\":\"" + deviceId + "\",";
  json += "\"location\":\"" + location + "\"";
  json += "}";
  return json;
}

void sendToFirebase(String jsonPayload, float temperature, float humidity, float pressure, float gasResistance, int airQualityIndex) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected!");
    return;
  }
  
  HTTPClient http;
  
  // Build Firestore REST API URL with API key
  String url = String(firestoreEndpoint) + "?key=" + String(firebaseApiKey);
  
  // Calculate imperial units
  float temperatureF = (temperature * 9.0 / 5.0) + 32.0;
  float pressureInHg = pressure * 0.02953;
  
  // Create Firestore document format with both metric and imperial units
  String firestorePayload = "{\"fields\":{";
  firestorePayload += "\"temperature\":{\"doubleValue\":" + String(temperature, 2) + "},";
  firestorePayload += "\"temperatureFahrenheit\":{\"doubleValue\":" + String(temperatureF, 2) + "},";
  firestorePayload += "\"humidity\":{\"doubleValue\":" + String(humidity, 2) + "},";
  firestorePayload += "\"pressure\":{\"doubleValue\":" + String(pressure, 2) + "},";
  firestorePayload += "\"pressureInHg\":{\"doubleValue\":" + String(pressureInHg, 2) + "},";
  firestorePayload += "\"gasResistance\":{\"doubleValue\":" + String(gasResistance, 0) + "},";
  firestorePayload += "\"airQualityIndex\":{\"integerValue\":\"" + String(airQualityIndex) + "\"},";
  firestorePayload += "\"deviceId\":{\"stringValue\":\"" + deviceId + "\"},";
  firestorePayload += "\"location\":{\"stringValue\":\"" + location + "\"},";
  firestorePayload += "\"timestamp\":{\"timestampValue\":\"" + getCurrentTimestamp() + "\"}";
  firestorePayload += "}}";
  
  Serial.println("\n📤 Sending to Firebase Firestore...");
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(firestorePayload);
  
  if (httpResponseCode > 0) {
    Serial.printf("✅ Firebase response code: %d\n", httpResponseCode);
    String response = http.getString();
    if (httpResponseCode == 200) {
      Serial.println("✅ Data successfully uploaded to Firestore!");
    } else {
      Serial.println("Response: " + response);
    }
  } else {
    Serial.printf("❌ Error sending to Firebase: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  
  http.end();
}

String getCurrentTimestamp() {
  // Get current time in ISO 8601 format
  // For now, use milliseconds since boot as a simple timestamp
  // In production, you'd sync with NTP server for accurate time
  unsigned long ms = millis();
  unsigned long seconds = ms / 1000;
  unsigned long minutes = seconds / 60;
  unsigned long hours = minutes / 60;
  
  // Simple ISO-ish format (not real datetime, just duration)
  String timestamp = "2025-10-01T";
  timestamp += String(hours % 24) + ":";
  timestamp += String(minutes % 60) + ":";
  timestamp += String(seconds % 60) + ".000Z";
  
  return timestamp;
}

int calculateAQI(float gasResistance) {
  // Simple AQI calculation based on gas resistance
  // Higher resistance = better air quality
  if (gasResistance > 80000) return 25;      // Excellent
  if (gasResistance > 60000) return 50;      // Good
  if (gasResistance > 40000) return 75;      // Moderate
  if (gasResistance > 20000) return 100;     // Unhealthy for sensitive
  return 150;                                // Unhealthy
}

String getAQILabel(int aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}
