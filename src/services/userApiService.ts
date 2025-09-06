import { 
  API_KEYS, 
  API_CONFIG, 
  FEATURE_FLAGS
} from '../config/apiKeys';
import { apiKeyService } from './apiKeyService';
import { authService } from './authService';

export interface UserLocationData {
  verified: boolean;
  coordinates?: { lat: number; lng: number };
  formattedAddress?: string;
  confidence: 'high' | 'medium' | 'low';
  source: string;
}

export interface UserWeatherData {
  temperature: number;
  conditions: string;
  humidity: number;
  windSpeed: number;
  forecast?: Array<{
    date: string;
    high: number;
    low: number;
    conditions: string;
  }>;
}

export interface UserBusinessInfo {
  name?: string;
  rating?: number;
  phone?: string;
  website?: string;
  hours?: string;
  types?: string[];
  priceLevel?: number;
  userRatingsTotal?: number;
}

class UserApiService {
  private userGoogleMapsKey: string | null = null;
  private userOpenWeatherKey: string | null = null;

  constructor() {
    // Keys will be loaded lazily when needed
  }

  /**
   * Get User Google Maps API key (lazy loading)
   */
  private getUserGoogleMapsKey(): string {
    if (this.userGoogleMapsKey === null) {
      this.userGoogleMapsKey = API_KEYS.USER?.GOOGLE_MAPS || '';
    }
    return this.userGoogleMapsKey || '';
  }

  /**
   * Get User OpenWeather API key (lazy loading)
   */
  private getUserOpenWeatherKey(): string {
    if (this.userOpenWeatherKey === null) {
      this.userOpenWeatherKey = API_KEYS.USER?.OPENWEATHER || '';
    }
    return this.userOpenWeatherKey || '';
  }

  /**
   * Verify location using Google Maps Geocoding API (User version)
   */
  async verifyLocation(address: string): Promise<UserLocationData> {
    const userGoogleMapsKey = this.getUserGoogleMapsKey();
    if (!FEATURE_FLAGS.LOCATION_VERIFICATION || !userGoogleMapsKey) {
      return this.getFallbackLocationData();
    }

    try {
      const response = await fetch(
        `${API_CONFIG.USER.GOOGLE_MAPS.baseUrl}${API_CONFIG.USER.GOOGLE_MAPS.geocodingEndpoint}?address=${encodeURIComponent(address)}&key=${userGoogleMapsKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;
        
        // Track usage for cost monitoring
        apiKeyService.trackUsage('GOOGLE_MAPS', 'user');

        return {
          verified: true,
          coordinates: { lat: location.lat, lng: location.lng },
          formattedAddress: result.formatted_address,
          confidence: 'high',
          source: 'google_maps_user',
        };
      }

      return {
        verified: false,
        confidence: 'low',
        source: 'google_maps_user_no_results',
      };
    } catch (error) {
      console.error('User location verification failed:', error);
      return this.getFallbackLocationData();
    }
  }

  /**
   * Get weather forecast using OpenWeather API (User version)
   */
  async getWeatherForecast(lat: number, lng: number): Promise<UserWeatherData | null> {
    const userOpenWeatherKey = this.getUserOpenWeatherKey();
    if (!FEATURE_FLAGS.WEATHER_INTEGRATION || !userOpenWeatherKey) {
      return null;
    }

    try {
      const response = await fetch(
        `${API_CONFIG.USER.OPENWEATHER.baseUrl}${API_CONFIG.USER.OPENWEATHER.currentEndpoint}?lat=${lat}&lon=${lng}&appid=${userOpenWeatherKey}&units=imperial`
      );

      if (!response.ok) {
        throw new Error(`OpenWeather API error: ${response.status}`);
      }

      const data = await response.json();

      // Track usage for cost monitoring
      apiKeyService.trackUsage('OPENWEATHER', 'user');

      return {
        temperature: data.main.temp,
        conditions: data.weather[0].main,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        forecast: [], // User version has limited forecast data
      };
    } catch (error) {
      console.error('User weather forecast failed:', error);
      return null;
    }
  }

  /**
   * Get business information using Google Places API (User version)
   */
  async getBusinessInfo(lat: number, lng: number, query?: string): Promise<UserBusinessInfo | null> {
    const userGoogleMapsKey = this.getUserGoogleMapsKey();
    if (!FEATURE_FLAGS.BUSINESS_INFO_ENRICHMENT || !userGoogleMapsKey) {
      return null;
    }

    try {
      let url: string;
      
      if (query) {
        // Use text search for better results with business names
        url = `${API_CONFIG.USER.GOOGLE_PLACES.baseUrl}${API_CONFIG.USER.GOOGLE_PLACES.textSearchEndpoint}?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=1000&key=${userGoogleMapsKey}`;
      } else {
        // Use nearby search
        url = `${API_CONFIG.USER.GOOGLE_PLACES.baseUrl}${API_CONFIG.USER.GOOGLE_PLACES.nearbySearchEndpoint}?location=${lat},${lng}&radius=1000&key=${userGoogleMapsKey}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const data = await response.json();

      // Track usage for cost monitoring
      apiKeyService.trackUsage('GOOGLE_PLACES', 'user');

      if (data.status === 'OK' && data.results.length > 0) {
        const place = data.results[0];
        
        return {
          name: place.name,
          rating: place.rating,
          phone: place.formatted_phone_number,
          website: place.website,
          hours: place.opening_hours?.weekday_text?.join(', '),
          types: place.types,
          priceLevel: place.price_level,
          userRatingsTotal: place.user_ratings_total,
        };
      }

      return null;
    } catch (error) {
      console.error('User business info fetch failed:', error);
      return null;
    }
  }

  /**
   * Get address suggestions for autocomplete (User version)
   */
  async getAddressSuggestions(query: string): Promise<string[]> {
    const userGoogleMapsKey = this.getUserGoogleMapsKey();
    if (!userGoogleMapsKey) {
      return [];
    }

    try {
      const response = await fetch(
        `${API_CONFIG.USER.GOOGLE_PLACES.baseUrl}/place/autocomplete/json?input=${encodeURIComponent(query)}&types=establishment&key=${userGoogleMapsKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Track usage for cost monitoring
      apiKeyService.trackUsage('GOOGLE_PLACES', 'user');
      
      return data.predictions?.map((prediction: any) => prediction.description) || [];
    } catch (error) {
      console.error('Error getting address suggestions:', error);
      return [];
    }
  }

  /**
   * Get user's current role for API access
   */
  private getUserRole(): string {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      // This would need to be implemented in authService
      // For now, we'll assume root users are admin
      if (currentUser.email === 'christophersmithm16@gmail.com') {
        return 'root';
      }
    }
    return 'user';
  }

  /**
   * Check if user has access to a specific API service
   */
  hasAccess(service: string): boolean {
    return apiKeyService.hasAccess(service, this.getUserRole());
  }

  /**
   * Get service limits for current user
   */
  getServiceLimits(service: string) {
    return apiKeyService.getServiceLimits(service, this.getUserRole());
  }

  /**
   * Check if service is within limits
   */
  isWithinLimits(service: string): boolean {
    return apiKeyService.isWithinLimits(service, this.getUserRole());
  }

  /**
   * Get usage statistics for current user
   */
  getUsageStats() {
    return apiKeyService.getUsageStats(this.getUserRole());
  }

  /**
   * Fallback location data when API fails
   */
  private getFallbackLocationData(): UserLocationData {
    return {
      verified: false,
      confidence: 'low',
      source: 'fallback_user',
    };
  }
}

// Export singleton instance
export const userApiService = new UserApiService();
