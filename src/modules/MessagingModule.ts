import type { ApiClient } from '@core/ApiClient';
import type { Match, MatchesResponse, SendMessageResponse } from '../types';
import { ENDPOINTS } from '@utils/constants';

type GetMatchesParams = {
  readonly count?: number;
  readonly page_token?: string;
};

export class MessagingModule {
  constructor(private readonly client: ApiClient) {}

  async getMatches(params: GetMatchesParams = {}): Promise<ReadonlyArray<Match>> {
    const response = await this.client.get<MatchesResponse>(
      ENDPOINTS.MATCHES,
      params
    );
    return response.matches;
  }

  async getMatch(matchId: string): Promise<Match> {
    return this.client.get<Match>(`${ENDPOINTS.MATCH}/${matchId}`);
  }

  async sendMessage(matchId: string, message: string): Promise<SendMessageResponse> {
    return this.client.post<SendMessageResponse>(
      `${ENDPOINTS.SEND_MESSAGE}/${matchId}`,
      { message }
    );
  }

  async unmatch(matchId: string): Promise<void> {
    await this.client.delete(`${ENDPOINTS.MATCH}/${matchId}`);
  }
}
