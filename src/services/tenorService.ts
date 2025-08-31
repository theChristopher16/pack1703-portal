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
  private baseUrl = 'https://tenor.googleapis.com/v2';

  constructor() {
    // Get API key from environment or use a default one for testing
    this.apiKey = process.env.REACT_APP_TENOR_API_KEY || 'AIzaSyCbPAw3QOuuzRJjUx1_jC0wgJPtVLYxLqY';
  }

  async getTrendingGifs(limit: number = 20): Promise<TenorGif[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/trending?key=${this.apiKey}&limit=${limit}&media_filter=gif`
      );
      
      if (!response.ok) {
        throw new Error(`Tenor API error: ${response.status}`);
      }

      const data: TenorTrendingResponse = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching trending GIFs from Tenor:', error);
      return this.getFallbackGifs();
    }
  }

  async searchGifs(query: string, limit: number = 20): Promise<TenorGif[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/search?q=${encodeURIComponent(query)}&key=${this.apiKey}&limit=${limit}&media_filter=gif`
      );
      
      if (!response.ok) {
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
            url: 'https://media.tenor.com/example1.gif',
            width: 480,
            height: 270
          },
          tinygif: {
            url: 'https://media.tenor.com/example1.gif',
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
            url: 'https://media.tenor.com/example2.gif',
            width: 480,
            height: 270
          },
          tinygif: {
            url: 'https://media.tenor.com/example2.gif',
            width: 220,
            height: 124
          }
        },
        created: Date.now(),
        content_description: 'Camping fun GIF'
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
