import { Request } from 'express';

export type ClientInfoType = {
  ip: string;
  browser: string;
  os: string;
  device: string;
  userAgentString: string;
};

export interface RequestWithClient extends Request {
  clientInfo: ClientInfoType;
}
