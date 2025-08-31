// GIPHY API Service for GIF search and trending GIFs
// You'll need to get a GIPHY API key from https://developers.giphy.com/

interface GiphyGif {
  id: string;
  title: string;
  images: {
    fixed_height: {
      url: string;
      width: string;
      height: string;
    };
    fixed_height_small: {
      url: string;
      width: string;
      height: string;
    };
    original: {
      url: string;
      width: string;
      height: string;
    };
  };
  url: string;
}

interface GiphySearchResponse {
  data: GiphyGif[];
  pagination: {
    total_count: number;
    count: number;
    offset: number;
  };
  meta: {
    status: number;
    msg: string;
    response_id: string;
  };
}

interface GiphyTrendingResponse {
  data: GiphyGif[];
  pagination: {
    total_count: number;
    count: number;
    offset: number;
  };
  meta: {
    status: number;
    msg: string;
    response_id: string;
  };
}

class GiphyService {
  private apiKey: string;
  private baseUrl: string = 'https://api.giphy.com/v1/gifs';

  constructor() {
    // You can get a free API key from https://developers.giphy.com/
    // For now, we'll use a placeholder. Replace with your actual API key
    this.apiKey = process.env.REACT_APP_GIPHY_API_KEY || 'YOUR_GIPHY_API_KEY';
  }

  // Get trending GIFs
  async getTrendingGifs(limit: number = 20, offset: number = 0): Promise<GiphyGif[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/trending?api_key=${this.apiKey}&limit=${limit}&offset=${offset}&rating=g`
      );
      
      if (!response.ok) {
        throw new Error(`GIPHY API error: ${response.status}`);
      }

      const data: GiphyTrendingResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching trending GIFs:', error);
      // Return fallback GIFs if API fails
      return this.getFallbackGifs();
    }
  }

  // Search for GIFs
  async searchGifs(query: string, limit: number = 20, offset: number = 0): Promise<GiphyGif[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `${this.baseUrl}/search?api_key=${this.apiKey}&q=${encodedQuery}&limit=${limit}&offset=${offset}&rating=g&lang=en`
      );
      
      if (!response.ok) {
        throw new Error(`GIPHY API error: ${response.status}`);
      }

      const data: GiphySearchResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error searching GIFs:', error);
      // Return fallback GIFs if API fails
      return this.getFallbackGifs();
    }
  }

  // Get scout-themed GIFs (curated selection)
  async getScoutGifs(): Promise<GiphyGif[]> {
    const scoutTerms = [
      'scout salute',
      'camping',
      'nature',
      'adventure',
      'friendship',
      'outdoor activities',
      'hiking',
      'campfire',
      'wilderness',
      'teamwork'
    ];

    try {
      // Try to get scout-themed GIFs
      const randomTerm = scoutTerms[Math.floor(Math.random() * scoutTerms.length)];
      return await this.searchGifs(randomTerm, 10);
    } catch (error) {
      console.error('Error fetching scout GIFs:', error);
      return this.getFallbackGifs();
    }
  }

  // Fallback GIFs when API is not available
  private getFallbackGifs(): GiphyGif[] {
    return [
      {
        id: 'fallback-1',
        title: 'Scout Salute',
        images: {
          fixed_height: {
            url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
            width: '200',
            height: '200'
          },
          fixed_height_small: {
            url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
            width: '100',
            height: '100'
          },
          original: {
            url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
            width: '480',
            height: '480'
          }
        },
        url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif'
      },
      {
        id: 'fallback-2',
        title: 'Camping',
        images: {
          fixed_height: {
            url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
            width: '200',
            height: '200'
          },
          fixed_height_small: {
            url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
            width: '100',
            height: '100'
          },
          original: {
            url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
            width: '480',
            height: '480'
          }
        },
        url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif'
      },
      {
        id: 'fallback-3',
        title: 'Nature',
        images: {
          fixed_height: {
            url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
            width: '200',
            height: '200'
          },
          fixed_height_small: {
            url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
            width: '100',
            height: '100'
          },
          original: {
            url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
            width: '480',
            height: '480'
          }
        },
        url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif'
      },
      {
        id: 'fallback-4',
        title: 'Adventure',
        images: {
          fixed_height: {
            url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
            width: '200',
            height: '200'
          },
          fixed_height_small: {
            url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
            width: '100',
            height: '100'
          },
          original: {
            url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
            width: '480',
            height: '480'
          }
        },
        url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif'
      },
      {
        id: 'fallback-5',
        title: 'Friendship',
        images: {
          fixed_height: {
            url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
            width: '200',
            height: '200'
          },
          fixed_height_small: {
            url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
            width: '100',
            height: '100'
          },
          original: {
            url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
            width: '480',
            height: '480'
          }
        },
        url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif'
      }
    ];
  }

  // Check if API key is configured
  isApiConfigured(): boolean {
    return this.apiKey !== 'YOUR_GIPHY_API_KEY' && this.apiKey !== '';
  }

  // Get API key status for UI
  getApiStatus(): { configured: boolean; message: string } {
    if (this.isApiConfigured()) {
      return {
        configured: true,
        message: 'GIPHY API configured - Full GIF search available'
      };
    } else {
      return {
        configured: false,
        message: 'GIPHY API not configured - Using fallback GIFs. Get API key at https://developers.giphy.com/'
      };
    }
  }
}

// Export singleton instance
const giphyService = new GiphyService();
export default giphyService;
export type { GiphyGif, GiphySearchResponse, GiphyTrendingResponse };
