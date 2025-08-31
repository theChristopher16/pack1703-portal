import { getFirestore } from 'firebase/firestore';
import { API_KEYS, API_CONFIG, FEATURE_FLAGS, FALLBACK_BEHAVIOR, isValidApiKey, setApiStatus } from '../config/apiKeys';

interface LocationData {
  verified: boolean;
  coordinates?: { lat: number; lng: number };
  formattedAddress?: string;
  placeId?: string;
  businessInfo?: BusinessInfo | null;
  parkingInfo?: ParkingInfo;
}

interface BusinessInfo {
  name: string;
  phone: string;
  website?: string;
  hours?: any;
  rating?: number;
  reviews?: number;
}

interface ParkingInfo {
  available: boolean;
  type: string[];
  details?: string;
}

interface PhoneValidationResult {
  valid: boolean;
  formatted: string;
  carrier?: string;
  country?: string;
  type?: string;
}

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
}

class ExternalApiService {
  private db: any;
  private googleMapsApiKey: string;
  private phoneApiKey: string;
  private yelpApiKey: string;
  private weatherApiKey: string;

  constructor() {
    this.db = getFirestore();
    this.googleMapsApiKey = API_KEYS.GOOGLE_MAPS;
    this.phoneApiKey = API_KEYS.PHONE_VALIDATION;
    this.yelpApiKey = API_KEYS.YELP;
    this.weatherApiKey = API_KEYS.WEATHER;
  }

  // Google Maps API Integration
  async verifyLocation(locationName: string, address?: string): Promise<LocationData> {
    // Check if Google Maps API is enabled and has valid key
    if (!FEATURE_FLAGS.ENABLE_GOOGLE_MAPS || !isValidApiKey(this.googleMapsApiKey)) {
      setApiStatus('GOOGLE_MAPS', 'disabled');
      return this.fallbackLocationVerification(locationName, address);
    }

    try {
      setApiStatus('GOOGLE_MAPS', 'active');
      const searchQuery = address || locationName;
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${this.googleMapsApiKey}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUTS.GOOGLE_MAPS);
      
      const geocodeResponse = await fetch(geocodeUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.status !== 'OK' || geocodeData.results.length === 0) {
        setApiStatus('GOOGLE_MAPS', 'error');
        return this.fallbackLocationVerification(locationName, address);
      }

      const result = geocodeData.results[0];
      const coordinates = result.geometry.location;
      const placeId = result.place_id;

      // Get detailed place information
      const placeDetails = await this.getPlaceDetails(placeId);
      
      // Get business information from Yelp
      const businessInfo = await this.getBusinessInfo(locationName, coordinates);
      
      // Get parking information
      const parkingInfo = await this.getParkingInfo(placeId);

      return {
        verified: true,
        coordinates,
        formattedAddress: result.formatted_address,
        placeId,
        businessInfo,
        parkingInfo
      };
    } catch (error) {
      console.error('Error verifying location:', error);
      setApiStatus('GOOGLE_MAPS', 'error');
      return this.fallbackLocationVerification(locationName, address);
    }
  }

  private fallbackLocationVerification(locationName: string, address?: string): LocationData {
    // Basic fallback validation
    const hasLocation = !!(locationName || address);
    return {
      verified: hasLocation,
      formattedAddress: address || locationName
    };
  }

  private async getPlaceDetails(placeId: string): Promise<any> {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,website,opening_hours,rating,user_ratings_total&key=${this.googleMapsApiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }

  // Yelp Business API Integration
  private async getBusinessInfo(businessName: string, coordinates: { lat: number; lng: number }): Promise<BusinessInfo | null> {
    try {
      const url = `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(businessName)}&latitude=${coordinates.lat}&longitude=${coordinates.lng}&limit=1`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.yelpApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.businesses && data.businesses.length > 0) {
        const business = data.businesses[0];
        return {
          name: business.name,
          phone: business.phone,
          website: business.url,
          hours: business.hours,
          rating: business.rating,
          reviews: business.review_count
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting business info:', error);
      return null;
    }
  }

  // Parking Information
  private async getParkingInfo(placeId: string): Promise<ParkingInfo> {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,parking&key=${this.googleMapsApiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.result && data.result.parking) {
        return {
          available: true,
          type: Object.keys(data.result.parking),
          details: JSON.stringify(data.result.parking)
        };
      }
      
      return { available: false, type: [] };
    } catch (error) {
      console.error('Error getting parking info:', error);
      return { available: false, type: [] };
    }
  }

  // Phone Number Validation
  async validatePhoneNumber(phone: string): Promise<PhoneValidationResult> {
    // Check if phone validation is enabled and has valid key
    if (!FEATURE_FLAGS.ENABLE_PHONE_VALIDATION || !isValidApiKey(this.phoneApiKey)) {
      setApiStatus('PHONE_VALIDATION', 'disabled');
      return this.fallbackPhoneValidation(phone);
    }

    try {
      setApiStatus('PHONE_VALIDATION', 'active');
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
      const url = `https://api.numlookupapi.com/v1/validate/${cleanPhone}?apikey=${this.phoneApiKey}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUTS.PHONE_VALIDATION);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await response.json();
      
      return {
        valid: data.valid,
        formatted: data.format?.international || phone,
        carrier: data.carrier,
        country: data.country_name,
        type: data.line_type
      };
    } catch (error) {
      console.error('Error validating phone number:', error);
      setApiStatus('PHONE_VALIDATION', 'error');
      return this.fallbackPhoneValidation(phone);
    }
  }

  private fallbackPhoneValidation(phone: string): PhoneValidationResult {
    // Basic regex validation as fallback
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return {
      valid: phoneRegex.test(phone.replace(/[\s\-\(\)]/g, '')),
      formatted: phone
    };
  }

  // Weather API Integration
  async getWeatherForecast(location: { lat: number; lng: number }, date: Date): Promise<WeatherData | null> {
    try {
      const dateString = date.toISOString().split('T')[0];
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lng}&appid=${this.weatherApiKey}&units=imperial`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      // Find the forecast for the specific date
      const targetForecast = data.list.find((item: any) => 
        item.dt_txt.startsWith(dateString)
      );
      
      if (targetForecast) {
        return {
          temperature: targetForecast.main.temp,
          condition: targetForecast.weather[0].main,
          humidity: targetForecast.main.humidity,
          windSpeed: targetForecast.wind.speed,
          precipitation: targetForecast.pop * 100 // Probability of precipitation
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting weather forecast:', error);
      return null;
    }
  }

  // Address Autocomplete
  async getAddressSuggestions(query: string): Promise<string[]> {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=establishment&key=${this.googleMapsApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      return data.predictions?.map((prediction: any) => prediction.description) || [];
    } catch (error) {
      console.error('Error getting address suggestions:', error);
      return [];
    }
  }

  // Business Hours Validation
  async validateBusinessHours(locationName: string, eventDate: Date): Promise<{ open: boolean; hours?: string }> {
    try {
      // First get the location details
      const locationData = await this.verifyLocation(locationName);
      
      if (!locationData.verified || !locationData.placeId) {
        return { open: false };
      }

      // Get place details with hours
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${locationData.placeId}&fields=opening_hours&key=${this.googleMapsApiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.result && data.result.opening_hours) {
        const dayOfWeek = eventDate.getDay();
        const timeString = eventDate.toTimeString().substring(0, 5);
        
        // Check if the business is open on that day and time
        const periods = data.result.opening_hours.periods;
        const dayPeriod = periods.find((period: any) => period.open.day === dayOfWeek);
        
        if (dayPeriod) {
          const openTime = dayPeriod.open.time;
          const closeTime = dayPeriod.close.time;
          
          // Simple time comparison (you might want more sophisticated logic)
          const isOpen = timeString >= openTime && timeString <= closeTime;
          
          return {
            open: isOpen,
            hours: `${openTime} - ${closeTime}`
          };
        }
      }
      
      return { open: false };
    } catch (error) {
      console.error('Error validating business hours:', error);
      return { open: false };
    }
  }

  // Cost Estimation for Venues
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

  // Log API usage for monitoring
  private async logApiUsage(service: string, success: boolean, error?: string): Promise<void> {
    try {
      // This would log to your database for monitoring API usage and costs
      console.log(`API Usage: ${service} - ${success ? 'Success' : 'Failed'}${error ? ` - ${error}` : ''}`);
    } catch (error) {
      console.error('Error logging API usage:', error);
    }
  }
}

export default new ExternalApiService();
