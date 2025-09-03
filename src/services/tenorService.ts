import { API_KEYS, API_CONFIG, API_STATUS } from '../config/apiKeys';

export interface TenorGif {
  id: string;
  title: string;
  media_formats: {
    gif?: {
      url: string;
      width: number;
      height: number;
    };
    tinygif?: {
      url: string;
      width: number;
      height: number;
    };
    nanogif?: {
      url: string;
      width: number;
      height: number;
    };
  };
  created: number;
  content_description: string;
}

export interface TenorSearchResponse {
  results: TenorGif[];
  next: string;
}

export interface TenorTrendingResponse {
  results: TenorGif[];
  next: string;
}

class TenorService {
  private apiKey: string;
  private baseUrl: string;
  private config: any;

  constructor() {
    // Get API key from centralized configuration
    this.apiKey = API_KEYS.TENOR;
    this.config = API_CONFIG.TENOR;
    this.baseUrl = this.config.baseUrl;
  }

  async getTrendingGifs(limit: number = 20): Promise<TenorGif[]> {
    try {
      // Track API usage
      API_STATUS.TENOR.requestsToday++;
      
      // Track API usage for cost monitoring
      try {
        const { costManagementService } = await import('./costManagementService');
        await costManagementService.instance.trackApiUsage('tenor', 'user', 0.001);
      } catch (costError) {
        console.warn('Cost tracking not available:', costError);
      }
      
      // Try using the search endpoint with a popular term instead
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(
        `${this.baseUrl}/search?q=funny&key=${this.apiKey}&limit=${limit}&media_filter=gif`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        API_STATUS.TENOR.errorsToday++;
        throw new Error(`Tenor API error: ${response.status}`);
      }

      const data: TenorSearchResponse = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching trending GIFs from Tenor:', error);
      return this.getFallbackGifs();
    }
  }

  async searchGifs(query: string, limit: number = 20): Promise<TenorGif[]> {
    try {
      // Track API usage
      API_STATUS.TENOR.requestsToday++;
      
      // Track API usage for cost monitoring
      try {
        const { costManagementService } = await import('./costManagementService');
        await costManagementService.instance.trackApiUsage('tenor', 'user', 0.001);
      } catch (costError) {
        console.warn('Cost tracking not available:', costError);
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(
        `${this.baseUrl}/search?q=${encodeURIComponent(query)}&key=${this.apiKey}&limit=${limit}&media_filter=gif`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        API_STATUS.TENOR.errorsToday++;
        throw new Error(`Tenor API error: ${response.status}`);
      }

      const data: TenorSearchResponse = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching GIFs from Tenor:', error);
      return this.getFallbackGifs();
    }
  }

  async getScoutGifs(limit: number = 20): Promise<TenorGif[]> {
    const scoutTerms = ['scout', 'camping', 'nature', 'outdoors', 'adventure', 'hiking'];
    const randomTerm = scoutTerms[Math.floor(Math.random() * scoutTerms.length)];
    return this.searchGifs(randomTerm, limit);
  }

  getFallbackGifs(): TenorGif[] {
    return [
      {
        id: 'fallback1',
        title: 'Scout Salute',
        media_formats: {
          gif: {
            url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
            width: 480,
            height: 270
          },
          tinygif: {
            url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
            width: 220,
            height: 124
          }
        },
        created: Date.now(),
        content_description: 'Scout salute GIF'
      },
      {
        id: 'fallback2',
        title: 'Camping Fun',
        media_formats: {
          gif: {
            url: 'https://media.giphy.com/media/26ufcVAuSJbqgFfIs/giphy.gif',
            width: 480,
            height: 270
          },
          tinygif: {
            url: 'https://media.giphy.com/media/26ufcVAuSJbqgFfIs/giphy.gif',
            width: 220,
            height: 124
          }
        },
        created: Date.now(),
        content_description: 'Camping fun GIF'
      },
      {
        id: 'fallback3',
        title: 'Nature Adventure',
        media_formats: {
          gif: {
            url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
            width: 480,
            height: 270
          },
          tinygif: {
            url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
            width: 220,
            height: 124
          }
        },
        created: Date.now(),
        content_description: 'Nature adventure GIF'
      },
      {
        id: 'fallback4',
        title: 'Outdoor Fun',
        media_formats: {
          gif: {
            url: 'https://media.giphy.com/media/26ufcVAuSJbqgFfIs/giphy.gif',
            width: 480,
            height: 270
          },
          tinygif: {
            url: 'https://media.giphy.com/media/26ufcVAuSJbqgFfIs/giphy.gif',
            width: 220,
            height: 124
          }
        },
        created: Date.now(),
        content_description: 'Outdoor fun GIF'
      }
    ];
  }

  isApiConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey !== 'AIzaSyCJqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXq');
  }

  getApiStatus(): string {
    return this.isApiConfigured() ? 'Configured' : 'Using fallback GIFs';
  }
}

const tenorService = new TenorService();
export default tenorService;
