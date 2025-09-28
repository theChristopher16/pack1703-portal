import { getFirestore } from 'firebase/firestore';
import { collection, getDocs, addDoc, query, orderBy, limit, Timestamp } from 'firebase/firestore';

// Initialize Firestore
const db = getFirestore();

// Types for BME680 and ecology data
export interface BME680Reading {
  timestamp: number;
  temperature: number;
  humidity: number;
  pressure: number;
  gasResistance: number;
  airQualityIndex: number;
}

export interface SensorReading {
  timestamp: number;
  value: number;
  unit: string;
}

export interface SensorData {
  temperature: SensorReading[];
  humidity: SensorReading[];
  pressure: SensorReading[];
  airQuality: SensorReading[];
  light: SensorReading[];
  soilMoisture: SensorReading[];
  bme680: BME680Reading[];
}

export interface CameraImage {
  id: string;
  timestamp: number;
  imageUrl: string;
  thumbnailUrl?: string;
  metadata?: {
    resolution: string;
    fileSize: number;
    format: string;
  };
}

export interface EcologyData {
  sensors: SensorData;
  camera: {
    latestImage?: CameraImage;
    isOnline: boolean;
    lastCapture: number;
  };
  lastUpdated: number;
  isLive: boolean;
  location: string;
}

// Firebase collection names
const BME680_COLLECTION = 'bme680_readings';
const SENSOR_READINGS_COLLECTION = 'sensor_readings';
const CAMERA_IMAGES_COLLECTION = 'camera_images';

class EcologyService {
  /**
   * Fetch recent BME680 readings from Firebase
   * @param limitCount Number of recent readings to fetch (default: 24)
   * @returns Promise<BME680Reading[]>
   */
  async getBME680Readings(limitCount: number = 24): Promise<BME680Reading[]> {
    try {
      const q = query(
        collection(db, BME680_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const readings: BME680Reading[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        readings.push({
          timestamp: data.timestamp?.toMillis() || Date.now(),
          temperature: data.temperature || 0,
          humidity: data.humidity || 0,
          pressure: data.pressure || 0,
          gasResistance: data.gasResistance || 0,
          airQualityIndex: data.airQualityIndex || 0
        });
      });
      
      // Reverse to get chronological order (oldest first)
      return readings.reverse();
    } catch (error) {
      console.error('Error fetching BME680 readings:', error);
      return [];
    }
  }

  /**
   * Fetch recent sensor readings from Firebase
   * @param sensorType Type of sensor (temperature, humidity, etc.)
   * @param limitCount Number of recent readings to fetch (default: 24)
   * @returns Promise<SensorReading[]>
   */
  async getSensorReadings(sensorType: string, limitCount: number = 24): Promise<SensorReading[]> {
    try {
      const q = query(
        collection(db, SENSOR_READINGS_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const readings: SensorReading[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.sensorType === sensorType) {
          readings.push({
            timestamp: data.timestamp?.toMillis() || Date.now(),
            value: data.value || 0,
            unit: data.unit || ''
          });
        }
      });
      
      // Reverse to get chronological order (oldest first)
      return readings.reverse();
    } catch (error) {
      console.error(`Error fetching ${sensorType} readings:`, error);
      return [];
    }
  }

  /**
   * Add a new BME680 reading to Firebase
   * @param reading BME680 reading data
   * @returns Promise<string> Document ID
   */
  async addBME680Reading(reading: Omit<BME680Reading, 'timestamp'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, BME680_COLLECTION), {
        ...reading,
        timestamp: Timestamp.fromDate(new Date())
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding BME680 reading:', error);
      throw error;
    }
  }

  /**
   * Add a new sensor reading to Firebase
   * @param sensorType Type of sensor
   * @param value Reading value
   * @param unit Unit of measurement
   * @returns Promise<string> Document ID
   */
  async addSensorReading(sensorType: string, value: number, unit: string): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, SENSOR_READINGS_COLLECTION), {
        sensorType,
        value,
        unit,
        timestamp: Timestamp.fromDate(new Date())
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding sensor reading:', error);
      throw error;
    }
  }

  /**
   * Fetch latest camera image from Firebase
   * @returns Promise<CameraImage | null>
   */
  async getLatestCameraImage(): Promise<CameraImage | null> {
    try {
      const q = query(
        collection(db, CAMERA_IMAGES_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        timestamp: data.timestamp?.toMillis() || Date.now(),
        imageUrl: data.imageUrl || '',
        thumbnailUrl: data.thumbnailUrl,
        metadata: data.metadata
      };
    } catch (error) {
      console.error('Error fetching latest camera image:', error);
      return null;
    }
  }

  /**
   * Add a new camera image to Firebase
   * @param imageData Camera image data
   * @returns Promise<string> Document ID
   */
  async addCameraImage(imageData: Omit<CameraImage, 'id' | 'timestamp'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, CAMERA_IMAGES_COLLECTION), {
        ...imageData,
        timestamp: Timestamp.fromDate(new Date())
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding camera image:', error);
      throw error;
    }
  }

  /**
   * Fetch complete ecology data from Firebase
   * @returns Promise<EcologyData>
   */
  async getEcologyData(): Promise<EcologyData> {
    try {
      // Fetch all sensor types and camera data in parallel
      const [
        temperature,
        humidity,
        pressure,
        airQuality,
        light,
        soilMoisture,
        bme680,
        latestImage
      ] = await Promise.all([
        this.getSensorReadings('temperature'),
        this.getSensorReadings('humidity'),
        this.getSensorReadings('pressure'),
        this.getSensorReadings('airQuality'),
        this.getSensorReadings('light'),
        this.getSensorReadings('soilMoisture'),
        this.getBME680Readings(),
        this.getLatestCameraImage()
      ]);

      return {
        sensors: {
          temperature,
          humidity,
          pressure,
          airQuality,
          light,
          soilMoisture,
          bme680
        },
        camera: {
          latestImage: latestImage || undefined,
          isOnline: latestImage ? (Date.now() - latestImage.timestamp) < 300000 : false, // Online if image is less than 5 minutes old
          lastCapture: latestImage?.timestamp || 0
        },
        lastUpdated: Date.now(),
        isLive: true,
        location: 'Pack 1703 Scout Garden'
      };
    } catch (error) {
      console.error('Error fetching ecology data:', error);
      // Return empty data structure on error
      return {
        sensors: {
          temperature: [],
          humidity: [],
          pressure: [],
          airQuality: [],
          light: [],
          soilMoisture: [],
          bme680: []
        },
        camera: {
          latestImage: undefined,
          isOnline: false,
          lastCapture: 0
        },
        lastUpdated: Date.now(),
        isLive: false,
        location: 'Pack 1703 Scout Garden'
      };
    }
  }

  /**
   * Get sensor status based on value and sensor type
   * @param sensorType Type of sensor
   * @param value Reading value
   * @returns Status color class
   */
  getSensorStatus(sensorType: string, value: number): string {
    switch (sensorType) {
      case 'temperature':
      case 'bme680Temperature':
        return value < 15 ? 'text-blue-600' : value > 30 ? 'text-red-600' : 'text-green-600';
      case 'humidity':
      case 'bme680Humidity':
        return value < 30 ? 'text-yellow-600' : value > 70 ? 'text-blue-600' : 'text-green-600';
      case 'pressure':
      case 'bme680Pressure':
        return value < 1000 ? 'text-red-600' : value > 1030 ? 'text-blue-600' : 'text-green-600';
      case 'airQuality':
      case 'bme680AirQuality':
        return value < 50 ? 'text-green-600' : value > 100 ? 'text-red-600' : 'text-yellow-600';
      case 'light':
        return value < 200 ? 'text-gray-600' : value > 1000 ? 'text-yellow-600' : 'text-green-600';
      case 'soilMoisture':
        return value < 30 ? 'text-red-600' : value > 80 ? 'text-blue-600' : 'text-green-600';
      case 'gasResistance':
        return value < 30000 ? 'text-red-600' : value > 80000 ? 'text-green-600' : 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  }

  /**
   * Get normal range for a sensor type
   * @param sensorType Type of sensor
   * @returns Object with good range and descriptions
   */
  getSensorNormalRange(sensorType: string): { good: string; tooLow: string; tooHigh: string } {
    switch (sensorType) {
      case 'temperature':
      case 'bme680Temperature':
        return {
          good: '18-24°C',
          tooLow: 'Below 15°C',
          tooHigh: 'Above 30°C'
        };
      case 'humidity':
      case 'bme680Humidity':
        return {
          good: '40-60%',
          tooLow: 'Below 30%',
          tooHigh: 'Above 70%'
        };
      case 'pressure':
      case 'bme680Pressure':
        return {
          good: '1000-1030 hPa',
          tooLow: 'Below 1000 hPa',
          tooHigh: 'Above 1030 hPa'
        };
      case 'airQuality':
      case 'bme680AirQuality':
        return {
          good: '0-50 AQI',
          tooLow: 'N/A',
          tooHigh: 'Above 100 AQI'
        };
      case 'light':
        return {
          good: '200-1000 lux',
          tooLow: 'Below 200 lux',
          tooHigh: 'Above 1000 lux'
        };
      case 'soilMoisture':
        return {
          good: '40-70%',
          tooLow: 'Below 30%',
          tooHigh: 'Above 80%'
        };
      case 'gasResistance':
        return {
          good: '30,000-80,000 Ω',
          tooLow: 'Below 30,000 Ω',
          tooHigh: 'Above 80,000 Ω'
        };
      default:
        return {
          good: 'N/A',
          tooLow: 'N/A',
          tooHigh: 'N/A'
        };
    }
  }
}

export const ecologyService = new EcologyService();
export default ecologyService;
