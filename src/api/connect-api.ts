import got from 'got';

export interface ConnectAPI {
  login(): Promise<void>;
  requestClient(): typeof got;
}
