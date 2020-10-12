import { ConnectAPI } from './connect-api';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import got from 'got';

class AppStoreConnectAPI implements ConnectAPI {

  constructor(private readonly issuerId: string, private readonly keyId: string, private readonly keyFile: string) {}

  async login() { /* NOTHING TO DO */ }

  requestClient(): typeof got {
    const secret = fs.readFileSync(this.keyFile).toString();
    const token = jwt.sign(
      { },
      secret,
      {
        algorithm: 'ES256',
        keyid: this.keyId,
        expiresIn: '10m',
        issuer: this.issuerId,
        audience: 'appstoreconnect-v1',
      }
    );

    return got.extend({
      prefixUrl: 'https://api.appstoreconnect.apple.com/v1',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'json'
    });
  }
}

export default AppStoreConnectAPI;
