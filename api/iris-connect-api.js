const ConnectAPI = require('./connect-api');

const got = require('got');
const {CookieJar} = require('tough-cookie');
const cookieJar = new CookieJar();

const jsonClient = got.extend({
  responseType: 'json',
  cookieJar: cookieJar
});

class IrisConnectAPI extends ConnectAPI {

  constructor(user, password) {
    super()
    this.user = user;
    this.password = password;
  }

  async login() {
    try {
      const authKeyResponse = await jsonClient('https://appstoreconnect.apple.com/olympus/v1/app/config?hostname=itunesconnect.apple.com');
      const { body } = await jsonClient.post('https://idmsa.apple.com/appleauth/auth/signin', {
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

  apiClient() {
    return jsonClient.extend({
      prefixUrl: 'https://appstoreconnect.apple.com/iris/v1'
    });
  }
}

module.exports = IrisConnectAPI;
