import axios, { AxiosInstance, AxiosError } from 'axios';
import type { TinderConfig } from '../types';
import { DEFAULT_CONFIG } from '@utils/constants';
import { TinderError, AuthenticationError, RateLimitError, NotFoundError } from '@utils/errors';

export class ApiClient {
  private readonly axiosInstance: AxiosInstance;
  private authToken: string | null = null;

  constructor(config: TinderConfig = {}) {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };

    this.axiosInstance = axios.create({
      baseURL: mergedConfig.apiBaseUrl,
      timeout: mergedConfig.timeout,
      headers: {
        'User-Agent': mergedConfig.userAgent,
        'Content-Type': 'application/json',
        'platform': 'ios',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use((config) => {
      if (this.authToken && config.headers) {
        config.headers['X-Auth-Token'] = this.authToken;
      }
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const { status, data } = error.response;
          
          switch (status) {
            case 401:
              throw new AuthenticationError('Invalid or expired authentication token');
            case 404:
              throw new NotFoundError('The requested resource was not found');
            case 429:
              throw new RateLimitError('Too many requests. Please try again later.');
            default:
              throw new TinderError(
                `API request failed: ${error.message}`,
                status,
                data
              );
          }
        }
        
        throw new TinderError(`Network error: ${error.message}`);
      }
    );
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  clearAuthToken(): void {
    this.authToken = null;
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url);
    return response.data;
  }
}
