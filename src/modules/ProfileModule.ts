import type { ApiClient } from '@core/ApiClient';
import type { Profile, ProfileUpdate } from '../types';
import { ENDPOINTS } from '@utils/constants';

type ProfileResponse = {
  readonly data: Profile;
};

export class ProfileModule {
  constructor(private readonly client: ApiClient) {}

  async getProfile(): Promise<Profile> {
    const response = await this.client.get<ProfileResponse>(ENDPOINTS.PROFILE);
    return response.data;
  }

  async updateProfile(updates: ProfileUpdate): Promise<Profile> {
    const response = await this.client.post<ProfileResponse>(
      ENDPOINTS.PROFILE,
      updates
    );
    return response.data;
  }

  async getMeta(): Promise<unknown> {
    return this.client.get(ENDPOINTS.META);
  }
}
