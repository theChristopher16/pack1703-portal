/*
 * BME680 Firestore Data Sender for Pack 1703 Scout Garden
 * 
 * This Arduino sketch reads environmental data from a BME680 sensor
 * and sends it to Firebase Firestore for the Pack 1703 portal.
 * 
 * Hardware Requirements:
 * - ESP32 or ESP8266 board
 * - BME680 sensor (I2C connection)
 * - WiFi connection
 * 
 * Libraries Required:
 * - WiFi (built-in)
 * - Firebase ESP32 Client (by Mobizt)
 * - Adafruit BME680 (by Adafruit)
 * - Adafruit Unified Sensor (by Adafruit)
 * 
 * Installation:
 * 1. Install libraries via Arduino IDE Library Manager
 * 2. Update WiFi credentials below
 * 3. Update Firebase configuration
 * 4. Upload to your ESP32/ESP8266
 */

#include <WiFi.h>
#include <FirebaseESP32.h>
#include <Adafruit_BME680.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Firebase Configuration
#define FIREBASE_HOST "pack1703-portal-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "YOUR_FIREBASE_AUTH_TOKEN"

// BME680 Configuration
#define BME_SCK 13
#define BME_MISO 12
#define BME_MOSI 11
#define BME_CS 10

// Create objects
FirebaseData firebaseData;
Adafruit_BME680 bme;

// Device configuration
const String deviceId = "esp32_garden_01";
const String location = "Pack 1703 Scout Garden";
const int sendInterval = 300000; // 5 minutes in milliseconds
unsigned long lastSendTime = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("Pack 1703 BME680 Firestore Sender");
  Serial.println("=================================");
  
  // Initialize WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  // Initialize BME680
  if (!bme.begin()) {
    Serial.println("Could not find a valid BME680 sensor, check wiring!");
    while (1);
  }
  
  // Configure BME680
  bme.setTemperatureOversampling(BME680_OS_8X);
  bme.setHumidityOversampling(BME680_OS_2X);
  bme.setPressureOversampling(BME680_OS_4X);
  bme.setIIRFilterSize(BME680_FILTER_SIZE_3);
  bme.setGasHeater(320, 150); // 320°C for 150 ms
  
  // Initialize Firebase
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);
  
  Serial.println("BME680 Firestore Sender initialized successfully!");
  Serial.println("Sending data every 5 minutes...");
  Serial.println();
}

void loop() {
  unsigned long currentTime = millis();
  
  // Check if it's time to send data
  if (currentTime - lastSendTime >= sendInterval) {
    sendBME680Data();
    lastSendTime = currentTime;
  }
  
  // Small delay to prevent watchdog reset
  delay(1000);
}

void sendBME680Data() {
  Serial.println("Reading BME680 sensor data...");
  
  // Perform a reading
  if (!bme.performReading()) {
    Serial.println("Failed to perform BME680 reading");
    return;
  }
  
  // Read sensor data
  float temperature = bme.temperature;
  float humidity = bme.humidity;
  float pressure = bme.pressure / 100.0; // Convert to hPa
  float gasResistance = bme.gas_resistance;
  
  // Calculate Air Quality Index
  int airQualityIndex = calculateAQI(gasResistance);
  
  // Get current timestamp
  String timestamp = Firebase.getCurrentTime();
  
  Serial.println("Sensor Readings:");
  Serial.printf("  Temperature: %.2f °C\n", temperature);
  Serial.printf("  Humidity: %.2f %%\n", humidity);
  Serial.printf("  Pressure: %.2f hPa\n", pressure);
  Serial.printf("  Gas Resistance: %.0f ohms\n", gasResistance);
  Serial.printf("  Air Quality Index: %d\n", airQualityIndex);
  
  // Create JSON document for Firestore
  FirebaseJson json;
  json.set("timestamp", timestamp);
  json.set("temperature", temperature);
  json.set("humidity", humidity);
  json.set("pressure", pressure);
  json.set("gasResistance", gasResistance);
  json.set("airQualityIndex", airQualityIndex);
  json.set("deviceId", deviceId);
  json.set("location", location);
  
  // Send to Firebase Firestore
  String path = "/bme680_readings";
  Serial.println("Sending data to Firebase...");
  
  if (Firebase.pushJSON(firebaseData, path, json)) {
    Serial.println("✅ BME680 data sent successfully to Firestore!");
    Serial.printf("Document ID: %s\n", firebaseData.pushName().c_str());
  } else {
    Serial.println("❌ Error sending data to Firestore:");
    Serial.println(firebaseData.errorReason());
    
    // Try to reconnect if connection lost
    if (firebaseData.httpCode() == HTTPC_ERROR_CONNECTION_LOST) {
      Serial.println("Connection lost, attempting to reconnect...");
      Firebase.reconnectWiFi(true);
    }
  }
  
  Serial.println("----------------------------------------");
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

// Function to print sensor status
void printSensorStatus() {
  Serial.println("BME680 Sensor Status:");
  Serial.printf("  Temperature Oversampling: %d\n", bme.getTemperatureOversampling());
  Serial.printf("  Humidity Oversampling: %d\n", bme.getHumidityOversampling());
  Serial.printf("  Pressure Oversampling: %d\n", bme.getPressureOversampling());
  Serial.printf("  IIR Filter Size: %d\n", bme.getIIRFilterSize());
  Serial.printf("  Gas Heater Temperature: %d°C\n", bme.getGasHeaterTemperature());
  Serial.printf("  Gas Heater Duration: %d ms\n", bme.getGasHeaterDuration());
  Serial.println();
}
