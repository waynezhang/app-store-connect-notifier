const Notifier = require('./notifier');
const lineNotify = require('line-notify-nodejs');

class LINENotifier extends Notifier {
  constructor(token) {
    super()
    this.notifier = lineNotify(token);
  }

  async notify(appVersion) {
    let messageLines = [];
    messageLines.push(`*${appVersion.app.name} ${appVersion.version}* has changed to *${appVersion.stateString}*`);
    if (appVersion.phasedRelease) {
      messageLines.push(`Phased Release: *${appVersion.phasedRelease.phasedReleaseState}* , Percentage: *${appVersion.phasedRelease.percentage}%* (Day: ${appVersion.phasedRelease.currentDayNumber})`);
    }
    this.notifier.notify({ message: messageLines.join('\n') });
  }

  async notifyTestFlightBuild(build) {
    this.notifier.notify({
      message: `[TestFlight] *${build.app.name} ${build.version}* (${build.appVersion}) has changed to *${build.processingStateString}*\nInternal Test: *${build.internalBuildStateString}*\nExternal Test: *${build.externalBuildStateString}*`
    });
  }
}

module.exports = LINENotifier;
