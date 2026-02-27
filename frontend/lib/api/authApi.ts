import axios from "axios";
import { apiClient } from "./apiClient";

export type LoginWithPasswordRequest = {
  mobile: string;
  password: string;
};

export type LoginWithPasswordResponse = {
  access: string;
  refresh: string;
};

export type RequestOTPRequest = {
  mobile: string;
};

export type RequestOTPResponse = {
  detail: string;
};

export type VerifyOTPRequest = {
  mobile: string;
  token: string;
};

export type VerifyOTPResponse = {
  token: string;
};

export const authApi = {
  /**
   * Request OTP code via SMS
   */
  async requestOTP(data: RequestOTPRequest): Promise<RequestOTPResponse> {
    const { data: response } = await apiClient.post<RequestOTPResponse>(
      "/auth/account/mobile/",
      data
    );
    return response;
  },

  /**
   * Verify OTP code and get authentication token
   */
  async verifyOTP(data: VerifyOTPRequest): Promise<VerifyOTPResponse> {
    const { data: response } = await apiClient.post<VerifyOTPResponse>(
      "/auth/account/token/",
      data
    );
    return response;
  },

  /**
   * Login with mobile and password
   */
  async loginWithPassword(
    data: LoginWithPasswordRequest
  ): Promise<LoginWithPasswordResponse> {
    const { data: response } = await apiClient.post<LoginWithPasswordResponse>(
      "/token/obtain/",
      data
    );
    return response;
  },
};
