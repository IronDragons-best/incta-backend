export interface RmqMessage<T> {
  data: T;
  options?: Record<string, any>;
}

export type EmailInfoInputDto = {
  email: string;
  login: string;
  confirmCode: string;
};
