import { MindMapData } from '../components/MindMap/types';
import { getAccessToken } from './supabase';

const SUPABASE_FUNCTION_URL = 'https://mgmpmqvoyosvydaeeabq.supabase.co/functions/v1/mindmap';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ApiService {
  private static readonly ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nbXBtcXZveW9zdnlkYWVlYWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3NjU5NTEsImV4cCI6MjA1MjM0MTk1MX0.0t2gXTjMHP71BKEpc8w5a5ECXq87fMScBRD1PURWEbk';

  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${SUPABASE_FUNCTION_URL}/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.ANON_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.status === 'pong';
    } catch (error) {
      console.error('Error testing connection:', error);
      return false;
    }
  }

  private static async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  static async generateMindMap(topic: string): Promise<MindMapData> {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      console.log('Using access token:', accessToken);
      const response = await fetch(`${SUPABASE_FUNCTION_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        mode: 'cors',
        body: JSON.stringify({ topic }),
      });

      if (response.status === 404) {
        throw new Error('Edge Function not found. Please make sure it is properly deployed.');
      }

      const result = await this.handleResponse<MindMapData>(response);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate mind map');
      }

      return result.data;
    } catch (error) {
      console.error('Error generating mind map:', error);
      throw error;
    }
  }

  static async refineMindMap(topic: string, feedback: string): Promise<MindMapData> {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${SUPABASE_FUNCTION_URL}/refine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        mode: 'cors',
        body: JSON.stringify({ topic, feedback }),
      });

      const result = await this.handleResponse<MindMapData>(response);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to refine mind map');
      }

      return result.data;
    } catch (error) {
      console.error('Error refining mind map:', error);
      throw error;
    }
  }

  static async ping(): Promise<string> {
    try {
      const response = await fetch(`${SUPABASE_FUNCTION_URL}/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.ANON_KEY
        },
        mode: 'cors',
      });

      const result = await this.handleResponse<{ status: string; timestamp: string }>(response);
      return result.data?.status || 'Error';
    } catch (error) {
      console.error('Ping failed:', error);
      throw error;
    }
  }

  static async test(): Promise<string> {
    try {
      const response = await fetch(`${SUPABASE_FUNCTION_URL}/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.ANON_KEY
        },
        mode: 'cors',
      });

      const result = await this.handleResponse<{ status: string }>(response);
      return result.data?.status || 'Error';
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  }
}
