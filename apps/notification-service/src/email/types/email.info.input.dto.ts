import { AuthProvider, OauthTemplateType } from '@common';

export interface RmqMessage<T> {
  data: T;
  options?: Record<string, any>;
}

export type EmailInfoInputDto = {
  email: string;
  login: string;
  confirmCode: string;
};

export type OauthInputDto = {
  template: OauthTemplateType;
  login: string;
  email: string;
  provider: AuthProvider;
};
