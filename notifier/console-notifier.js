const Notifier = require('./notifier');

class ConsoleNotifier extends Notifier {
  constructor() {
    super()
  }

  async notify(appVersion) {
    console.log(`[${appVersion.app.name}] version ${appVersion.version} has changed to ${appVersion.state}`);
  }

  async notifyTestFlightBuild(build) {
    console.log(`[${build.app.name}] TestFlight build ${build.version}(${build.appVersion}) has changed to ${build.processingStateString} (Internal: ${build.internalBuildStateString}, External: ${build.externalBuildStateString})`);
  }
}

module.exports = ConsoleNotifier;
