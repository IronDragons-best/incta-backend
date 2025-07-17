export type ClientInfoType = {
  ip: string;
  browser: string;
  os: string;
  device: string;
  userAgentString: string;
};
declare module 'express' {
  interface Request {
    clientInfo: ClientInfoType;
  }
}
