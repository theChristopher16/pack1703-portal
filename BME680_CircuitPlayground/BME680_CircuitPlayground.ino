/*
 * BME680 Sensor Reader for Circuit Playground Express
 * Pack 1703 Scout Garden
 * 
 * This sketch reads BME680 sensor data and outputs JSON for manual Firebase upload
 * 
 * Hardware Requirements:
 * - Adafruit Circuit Playground Express
 * - BME680 sensor (I2C connection)
 * 
 * Libraries Required:
 * - Adafruit BME680 (by Adafruit)
 * - Adafruit Unified Sensor (by Adafruit)
 */

#include <Wire.h>
#include <Adafruit_BME680.h>
#include <Adafruit_Sensor.h>

// BME680 Configuration
Adafruit_BME680 bme;

// Device configuration
const String deviceId = "arduino_garden_01";
const String location = "Pack 1703 Scout Garden";
const int readInterval = 300000; // 5 minutes in milliseconds
unsigned long lastReadTime = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("Pack 1703 BME680 Sensor Reader");
  Serial.println("==============================");
  
  // Initialize I2C
  Wire.begin();
  
  // Initialize BME680
  if (!bme.begin()) {
    Serial.println("Could not find a valid BME680 sensor, check wiring!");
    Serial.println("Using simulated data for testing...");
  } else {
    Serial.println("BME680 sensor found and initialized!");
    
    // Configure BME680
    bme.setTemperatureOversampling(BME680_OS_8X);
    bme.setHumidityOversampling(BME680_OS_2X);
    bme.setPressureOversampling(BME680_OS_4X);
    bme.setIIRFilterSize(BME680_FILTER_SIZE_3);
    bme.setGasHeater(320, 150); // 320°C for 150 ms
  }
  
  Serial.println("BME680 Sensor Reader initialized successfully!");
  Serial.println("Reading sensor data every 5 minutes...");
  Serial.println("Data will be printed to Serial Monitor");
  Serial.println("Copy JSON data to Firebase manually");
  Serial.println();
}

void loop() {
  unsigned long currentTime = millis();
  
  // Check if it's time to read data
  if (currentTime - lastReadTime >= readInterval) {
    readAndDisplayBME680Data();
    lastReadTime = currentTime;
  }
  
  // Small delay to prevent watchdog reset
  delay(1000);
}

void readAndDisplayBME680Data() {
  Serial.println("Reading BME680 sensor data...");
  
  float temperature, humidity, pressure, gasResistance;
  int airQualityIndex;
  
  // Try to read from actual sensor
  if (bme.begin() && bme.performReading()) {
    temperature = bme.temperature;
    humidity = bme.humidity;
    pressure = bme.pressure / 100.0; // Convert to hPa
    gasResistance = bme.gas_resistance;
    Serial.println("Real sensor data:");
  } else {
    // Generate simulated data for testing
    Serial.println("Using simulated sensor data...");
    temperature = 22.0 + random(-5, 5);
    humidity = 45.0 + random(-10, 10);
    pressure = 1013.0 + random(-10, 10);
    gasResistance = 50000 + random(-10000, 10000);
  }
  
  // Calculate Air Quality Index
  airQualityIndex = calculateAQI(gasResistance);
  
  // Get current timestamp
  String timestamp = String(millis());
  
  Serial.println("Sensor Readings:");
  Serial.printf("  Timestamp: %s\n", timestamp.c_str());
  Serial.printf("  Temperature: %.2f °C\n", temperature);
  Serial.printf("  Humidity: %.2f %%\n", humidity);
  Serial.printf("  Pressure: %.2f hPa\n", pressure);
  Serial.printf("  Gas Resistance: %.0f ohms\n", gasResistance);
  Serial.printf("  Air Quality Index: %d\n", airQualityIndex);
  Serial.printf("  Device ID: %s\n", deviceId.c_str());
  Serial.printf("  Location: %s\n", location.c_str());
  
  // Print JSON format for easy copying to Firebase
  Serial.println("\nJSON Data (copy this to Firebase manually):");
  Serial.println("{");
  Serial.printf("  \"timestamp\": \"%s\",\n", timestamp.c_str());
  Serial.printf("  \"temperature\": %.2f,\n", temperature);
  Serial.printf("  \"humidity\": %.2f,\n", humidity);
  Serial.printf("  \"pressure\": %.2f,\n", pressure);
  Serial.printf("  \"gasResistance\": %.0f,\n", gasResistance);
  Serial.printf("  \"airQualityIndex\": %d,\n", airQualityIndex);
  Serial.printf("  \"deviceId\": \"%s\",\n", deviceId.c_str());
  Serial.printf("  \"location\": \"%s\"\n", location.c_str());
  Serial.println("}");
  
  Serial.println("----------------------------------------");
  Serial.println("To upload to Firebase:");
  Serial.println("1. Copy the JSON data above");
  Serial.println("2. Go to Firebase Console > Firestore");
  Serial.println("3. Add document to 'bme680_readings' collection");
  Serial.println("4. Paste the JSON data");
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
