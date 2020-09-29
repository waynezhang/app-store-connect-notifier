const ConnectAPI = require('./connect-api');
const fs = require('fs')
const jwt = require('jsonwebtoken');
const got = require('got');

class AppStoreConnectAPI extends ConnectAPI {

  constructor(issuerId, keyId, keyFile) {
    super()

    this.issuerId = issuerId;
    this.keyId = keyId;
    this.secret = fs.readFileSync(keyFile);
  }

  async login() {
    // nothing to do
  }

  apiClient() {
    const token = jwt.sign(
      { },
      this.secret,
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

module.exports = AppStoreConnectAPI;
