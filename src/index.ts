import type { TinderConfig } from './types';
import { ApiClient } from '@core/ApiClient';
import { AuthModule, ProfileModule, MatchingModule, MessagingModule } from './modules';

export class TinderClient {
  private readonly apiClient: ApiClient;
  
  public readonly auth: AuthModule;
  public readonly profile: ProfileModule;
  public readonly matching: MatchingModule;
  public readonly messaging: MessagingModule;

  constructor(config?: TinderConfig) {
    this.apiClient = new ApiClient(config);
    
    this.auth = new AuthModule(this.apiClient);
    this.profile = new ProfileModule(this.apiClient);
    this.matching = new MatchingModule(this.apiClient);
    this.messaging = new MessagingModule(this.apiClient);
  }

  setAuthToken(token: string): void {
    this.apiClient.setAuthToken(token);
  }
}

export * from './types';
export * from './utils';
export { ApiClient } from './core';
export { AuthModule, ProfileModule, MatchingModule, MessagingModule } from './modules';
