import { ConnectAPI } from './connect-api';
import { CookieJar } from 'tough-cookie';
import got from 'got';

class IrisConnectAPI implements ConnectAPI {

  private readonly jsonClient: typeof got

  constructor(private user: string, private password: string) {
    const cookieJar = new CookieJar();
    this.jsonClient = got.extend({
      responseType: 'json',
      cookieJar
    });
  }

  async login() {
    try {
      const authKeyResponse: any = await this.jsonClient('https://appstoreconnect.apple.com/olympus/v1/app/config?hostname=itunesconnect.apple.com');
      const { body } = await this.jsonClient.post('https://idmsa.apple.com/appleauth/auth/signin', {
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Apple-Widget-Key': authKeyResponse.body.authServiceKey,
          'Accept': 'application/json, text/javascript'
        },
        json: {
          accountName: this.user,
          password: this.password,
          rememberMe: true
        }
      });
    } catch (err) {
      console.log(`Failed to login ${err}`);
    }
  }

  requestClient(): typeof got {
    return this.jsonClient.extend({
      prefixUrl: 'https://appstoreconnect.apple.com/iris/v1'
    });
  }
}

export default IrisConnectAPI;
