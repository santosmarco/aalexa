import type { ApiClient } from '@core/ApiClient';
import type { AuthToken } from '../types';
import { ENDPOINTS } from '@utils/constants';

type FacebookAuthPayload = {
  readonly facebook_token: string;
  readonly facebook_id: string;
};

type SmsAuthPayload = {
  readonly phone_number: string;
  readonly otp_code: string;
};

type AuthResponse = {
  readonly data: {
    readonly api_token: string;
    readonly refresh_token?: string;
    readonly is_new_user: boolean;
  };
};

export class AuthModule {
  constructor(private readonly client: ApiClient) {}

  async loginWithFacebook(facebookToken: string, facebookId: string): Promise<AuthToken> {
    const payload: FacebookAuthPayload = {
      facebook_token: facebookToken,
      facebook_id: facebookId,
    };

    const response = await this.client.post<AuthResponse>(
      ENDPOINTS.AUTH_FACEBOOK,
      payload
    );

    const token: AuthToken = {
      token: response.data.api_token,
      refreshToken: response.data.refresh_token,
    };

    this.client.setAuthToken(token.token);
    return token;
  }

  async loginWithSms(phoneNumber: string, otpCode: string): Promise<AuthToken> {
    const payload: SmsAuthPayload = {
      phone_number: phoneNumber,
      otp_code: otpCode,
    };

    const response = await this.client.post<AuthResponse>(
      ENDPOINTS.AUTH_SMS,
      payload
    );

    const token: AuthToken = {
      token: response.data.api_token,
      refreshToken: response.data.refresh_token,
    };

    this.client.setAuthToken(token.token);
    return token;
  }

  setToken(token: string): void {
    this.client.setAuthToken(token);
  }

  logout(): void {
    this.client.clearAuthToken();
  }

  isAuthenticated(): boolean {
    return this.client.getAuthToken() !== null;
  }
}
