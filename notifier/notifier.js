class Notifier {
  constructor() { }

  async notify(appVersion) {
    throw 'Not Implemented'
  }

  async notifyTestFlightBuild(build) {
    throw 'Not Implemented'
  }
}

module.exports = Notifier;
