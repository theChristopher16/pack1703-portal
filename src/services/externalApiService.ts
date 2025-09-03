import { API_KEYS, API_CONFIG, FEATURE_FLAGS, FALLBACK_BEHAVIOR } from '../config/apiKeys';
import { apiKeyService } from './apiKeyService';

// Interfaces for API responses
export interface LocationData {
  verified: boolean;
  coordinates?: { lat: number; lng: number };
  formattedAddress?: string;
  confidence: 'high' | 'medium' | 'low';
  businessInfo?: BusinessInfo | null;
  parkingInfo?: ParkingInfo | null;
  source: string;
}

export interface BusinessInfo {
  name?: string;
  rating?: number;
  phone?: string;
  website?: string;
  hours?: string;
  types?: string[];
  priceLevel?: number;
  userRatingsTotal?: number;
}

export interface ParkingInfo {
  available: boolean;
  type?: 'free' | 'paid' | 'street' | 'lot';
  details?: string;
  accessibility?: boolean;
}

export interface PhoneValidationResult {
  valid: boolean;
  country?: string;
  carrier?: string;
  lineType?: string;
  confidence: 'high' | 'medium' | 'low';
  source?: string;
}

export interface WeatherData {
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

class ExternalApiService {
  private googleMapsKey: string;
  private phoneValidationKey: string;
  private openWeatherKey: string;

  constructor() {
    // Use admin keys for external API service (this service is used by admin functions)
    this.googleMapsKey = API_KEYS.ADMIN.GOOGLE_MAPS;
    this.phoneValidationKey = API_KEYS.PHONE_VALIDATION;
    this.openWeatherKey = API_KEYS.ADMIN.OPENWEATHER;
  }

  /**
   * Verify location using Google Maps Geocoding API
   */
  async verifyLocation(address: string): Promise<LocationData> {
    if (!FEATURE_FLAGS.LOCATION_VERIFICATION || !this.googleMapsKey) {
      return this.getFallbackLocationData();
    }

    try {
      const response = await fetch(
        `${API_CONFIG.ADMIN.GOOGLE_MAPS.baseUrl}${API_CONFIG.ADMIN.GOOGLE_MAPS.geocodingEndpoint}?address=${encodeURIComponent(address)}&key=${this.googleMapsKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;
        
        // Get additional business information using Google Places
        const businessInfo = await this.getBusinessInfo(location.lat, location.lng, address);
        const parkingInfo = await this.getParkingInfo(location.lat, location.lng);

        return {
          verified: true,
          coordinates: { lat: location.lat, lng: location.lng },
          formattedAddress: result.formatted_address,
          confidence: 'high',
          businessInfo,
          parkingInfo,
          source: 'google_maps',
        };
      }

      return {
        verified: false,
        confidence: 'low',
        source: 'google_maps_no_results',
      };
    } catch (error) {
      console.error('Location verification failed:', error);
      return this.getFallbackLocationData();
    }
  }

  /**
   * Get place details using Google Places API
   */
  async getPlaceDetails(placeId: string): Promise<BusinessInfo | null> {
    if (!FEATURE_FLAGS.BUSINESS_INFO_ENRICHMENT || !this.googleMapsKey) {
      return null;
    }

    try {
      const response = await fetch(
        `${API_CONFIG.ADMIN.GOOGLE_PLACES.baseUrl}${API_CONFIG.ADMIN.GOOGLE_PLACES.detailsEndpoint}?place_id=${placeId}&fields=name,rating,formatted_phone_number,website,opening_hours,types,price_level,user_ratings_total&key=${this.googleMapsKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        return {
          name: data.result.name,
          rating: data.result.rating,
          phone: data.result.formatted_phone_number,
          website: data.result.website,
          hours: data.result.opening_hours?.weekday_text?.join(', '),
          types: data.result.types,
          priceLevel: data.result.price_level,
          userRatingsTotal: data.result.user_ratings_total,
        };
      }

      return null;
    } catch (error) {
      console.error('Place details fetch failed:', error);
      return null;
    }
  }

  /**
   * Get business information using Google Places Nearby Search
   */
  async getBusinessInfo(lat: number, lng: number, query?: string): Promise<BusinessInfo | null> {
    if (!FEATURE_FLAGS.BUSINESS_INFO_ENRICHMENT || !this.googleMapsKey) {
      return null;
    }

    try {
      let url: string;
      
      if (query) {
        // Use text search for better results with business names
        url = `${API_CONFIG.ADMIN.GOOGLE_PLACES.baseUrl}${API_CONFIG.ADMIN.GOOGLE_PLACES.textSearchEndpoint}?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=1000&key=${this.googleMapsKey}`;
      } else {
        // Use nearby search
        url = `${API_CONFIG.ADMIN.GOOGLE_PLACES.baseUrl}${API_CONFIG.ADMIN.GOOGLE_PLACES.nearbySearchEndpoint}?location=${lat},${lng}&radius=1000&key=${this.googleMapsKey}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const place = data.results[0];
        
        // Get detailed information
        if (place.place_id) {
          return await this.getPlaceDetails(place.place_id);
        }

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
      console.error('Business info fetch failed:', error);
      return null;
    }
  }

  /**
   * Get parking information using Google Places API
   */
  async getParkingInfo(lat: number, lng: number): Promise<ParkingInfo | null> {
    if (!FEATURE_FLAGS.PARKING_INFO || !this.googleMapsKey) {
      return null;
    }

    try {
      const response = await fetch(
        `${API_CONFIG.ADMIN.GOOGLE_PLACES.baseUrl}${API_CONFIG.ADMIN.GOOGLE_PLACES.nearbySearchEndpoint}?location=${lat},${lng}&radius=500&type=parking&key=${this.googleMapsKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const parkingPlace = data.results[0];
        
        return {
          available: true,
          type: this.determineParkingType(parkingPlace.name),
          details: parkingPlace.name,
          accessibility: parkingPlace.name?.toLowerCase().includes('accessible') || false,
        };
      }

      // Check for street parking indicators
      const streetParkingResponse = await fetch(
        `${API_CONFIG.ADMIN.GOOGLE_PLACES.baseUrl}${API_CONFIG.ADMIN.GOOGLE_PLACES.nearbySearchEndpoint}?location=${lat},${lng}&radius=200&keyword=parking&key=${this.googleMapsKey}`
      );

      if (streetParkingResponse.ok) {
        const streetData = await streetParkingResponse.json();
        if (streetData.status === 'OK' && streetData.results.length > 0) {
          return {
            available: true,
            type: 'street',
            details: 'Street parking available',
            accessibility: false,
          };
        }
      }

      return {
        available: false,
        type: undefined,
        details: 'No parking information available',
        accessibility: false,
      };
    } catch (error) {
      console.error('Parking info fetch failed:', error);
      return null;
    }
  }

  /**
   * Determine parking type from place name
   */
  private determineParkingType(placeName: string): 'free' | 'paid' | 'street' | 'lot' {
    const name = placeName.toLowerCase();
    
    if (name.includes('free') || name.includes('no charge')) {
      return 'free';
    } else if (name.includes('paid') || name.includes('meter')) {
      return 'paid';
    } else if (name.includes('street')) {
      return 'street';
    } else {
      return 'lot';
    }
  }

  /**
   * Validate phone number using NumLookupAPI
   */
  async validatePhoneNumber(phone: string): Promise<PhoneValidationResult> {
    if (!FEATURE_FLAGS.PHONE_VALIDATION || !this.phoneValidationKey || this.phoneValidationKey === 'demo_key') {
      return this.getFallbackPhoneValidation();
    }

    try {
      const response = await fetch(
        `${API_CONFIG.PHONE_VALIDATION.baseUrl}${API_CONFIG.PHONE_VALIDATION.endpoint}?apikey=${this.phoneValidationKey}&number=${phone}`
      );

      if (!response.ok) {
        throw new Error(`Phone validation API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.valid) {
        return {
          valid: true,
          country: data.country_name,
          carrier: data.carrier,
          lineType: data.line_type,
          confidence: 'high',
        };
      }

      return {
        valid: false,
        confidence: 'high',
      };
    } catch (error) {
      console.error('Phone validation failed:', error);
      return this.getFallbackPhoneValidation();
    }
  }

  /**
   * Get weather forecast using OpenWeather API
   */
  async getWeatherForecast(lat: number, lng: number): Promise<WeatherData | null> {
    if (!FEATURE_FLAGS.WEATHER_INTEGRATION || !this.openWeatherKey || this.openWeatherKey === 'demo_key') {
      return null;
    }

    try {
      const response = await fetch(
        `${API_CONFIG.ADMIN.OPENWEATHER.baseUrl}${API_CONFIG.ADMIN.OPENWEATHER.currentEndpoint}?lat=${lat}&lon=${lng}&appid=${this.openWeatherKey}&units=imperial`
      );

      if (!response.ok) {
        throw new Error(`OpenWeather API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        temperature: data.main.temp,
        conditions: data.weather[0].main,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
      };
    } catch (error) {
      console.error('Weather forecast failed:', error);
      return null;
    }
  }

  /**
   * Fallback methods for when APIs are not available
   */
  private getFallbackLocationData(): LocationData {
    const fallback = FALLBACK_BEHAVIOR.LOCATION_VERIFICATION;
    return {
      verified: fallback.fallbackData.verified,
      confidence: fallback.fallbackData.confidence as 'high' | 'medium' | 'low',
      source: fallback.fallbackData.source,
    };
  }

  private getFallbackPhoneValidation(): PhoneValidationResult {
    const fallback = FALLBACK_BEHAVIOR.PHONE_VALIDATION;
    return {
      valid: fallback.fallbackData.valid,
      confidence: fallback.fallbackData.confidence as 'high' | 'medium' | 'low',
      source: fallback.fallbackData.source,
    };
  }

  /**
   * Get API usage statistics
   */
  getApiUsageStats() {
    return {
      googleMaps: {
        requestsToday: 0, // Would be tracked in a real implementation
        costEstimate: 0,
        status: 'active',
      },
      phoneValidation: {
        requestsToday: 0,
        costEstimate: 0,
        status: this.phoneValidationKey === 'demo_key' ? 'inactive' : 'active',
      },
      openWeather: {
        requestsToday: 0,
        costEstimate: 0,
        status: this.openWeatherKey === 'demo_key' ? 'inactive' : 'active',
      },
      googlePlaces: {
        requestsToday: 0,
        costEstimate: 0,
        status: 'active',
      },
    };
  }

  /**
   * Validate business hours for a location
   */
  async validateBusinessHours(locationName: string, eventDate: Date): Promise<{ open: boolean; hours?: string }> {
    try {
      // First get the location details
      const locationData = await this.verifyLocation(locationName);
      
      if (!locationData.verified || !locationData.coordinates) {
        return { open: false };
      }

      // Get place details with hours using Google Places
      const businessInfo = await this.getBusinessInfo(
        locationData.coordinates.lat, 
        locationData.coordinates.lng, 
        locationName
      );
      
      if (businessInfo?.hours) {
        // Simple check - if we have hours, assume it's open during business hours
        // In a real implementation, you'd parse the hours and check specific times
        return {
          open: true,
          hours: businessInfo.hours
        };
      }
      
      return { open: false };
    } catch (error) {
      console.error('Error validating business hours:', error);
      return { open: false };
    }
  }

  /**
   * Get address suggestions for autocomplete
   */
  async getAddressSuggestions(query: string): Promise<string[]> {
    if (!this.googleMapsKey) {
      return [];
    }

    try {
      const response = await fetch(
        `${API_CONFIG.ADMIN.GOOGLE_PLACES.baseUrl}/place/autocomplete/json?input=${encodeURIComponent(query)}&types=establishment&key=${this.googleMapsKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const data = await response.json();
      return data.predictions?.map((prediction: any) => prediction.description) || [];
    } catch (error) {
      console.error('Error getting address suggestions:', error);
      return [];
    }
  }

  /**
   * Estimate venue cost based on location data
   */
  async estimateVenueCost(locationName: string): Promise<{ estimatedCost: string; factors: string[] }> {
    try {
      const locationData = await this.verifyLocation(locationName);
      
      if (!locationData.businessInfo) {
        return { estimatedCost: 'Unknown', factors: ['No business information available'] };
      }

      // This is a simplified estimation - in a real implementation, you might use
      // more sophisticated algorithms or external pricing APIs
      const factors = [];
      let estimatedCost = 'Free';

      if (locationData.businessInfo.rating && locationData.businessInfo.rating > 4) {
        factors.push('High-rated venue');
        estimatedCost = '$50-100 per person';
      } else if (locationData.businessInfo.rating && locationData.businessInfo.rating > 3) {
        factors.push('Moderately-rated venue');
        estimatedCost = '$25-50 per person';
      } else {
        factors.push('Standard venue');
        estimatedCost = '$10-25 per person';
      }

      if (locationData.parkingInfo?.available) {
        factors.push('Parking available');
      } else {
        factors.push('Limited parking');
      }

      return { estimatedCost, factors };
    } catch (error) {
      console.error('Error estimating venue cost:', error);
      return { estimatedCost: 'Unknown', factors: ['Error estimating cost'] };
    }
  }
}

// Export singleton instance
export const externalApiService = new ExternalApiService();
