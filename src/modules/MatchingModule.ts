import type { ApiClient } from '@core/ApiClient';
import type { 
  RecommendationsResponse, 
  LikeResponse, 
  PassResponse, 
  SuperLikeResponse 
} from '../types';
import { ENDPOINTS } from '@utils/constants';

export class MatchingModule {
  constructor(private readonly client: ApiClient) {}

  async getRecommendations(): Promise<RecommendationsResponse> {
    return this.client.get<RecommendationsResponse>(ENDPOINTS.RECOMMENDATIONS);
  }

  async like(userId: string): Promise<LikeResponse> {
    return this.client.get<LikeResponse>(`${ENDPOINTS.LIKE}/${userId}`);
  }

  async pass(userId: string): Promise<PassResponse> {
    return this.client.get<PassResponse>(`${ENDPOINTS.PASS}/${userId}`);
  }

  async superLike(userId: string): Promise<SuperLikeResponse> {
    return this.client.post<SuperLikeResponse>(
      `${ENDPOINTS.SUPER_LIKE}/${userId}/super`,
      {}
    );
  }
}
