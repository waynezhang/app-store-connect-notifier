const { formatState } = require('../util/string-utils');
const AppState = require('./appstate');

class AppVersion {
  constructor(app, response, extra) {
    this.app = app;
    this.state = response.attributes.appStoreState;
    this.stateString = formatState(this.state);
    this.version = response.attributes.versionString;
    this.iconUrl = extra.storeIcon.templateUrl
                      .replace('{w}', '512')
                      .replace('{h}', '512')
                      .replace('{f}', 'png');
    if (extra.phasedRelease) {
      this.phasedRelease = extra.phasedRelease;
      this.phasedRelease['percentage'] = {
        1: 1,
        2: 2,
        3: 5,
        4: 10,
        5: 20,
        6: 50,
        7: 100
      }[extra.phasedRelease.currentDayNumber];
      if (this.phasedRelease.phasedReleaseState == 'COMPLETE') {
        this.phasedRelease['percentage'] = 100;
      }
    }
  }

  versionKey() {
    return `${this.app.bundleId}-${this.version}`;
  }

  versionState() {
    let ret = [
      this.state
    ];
    let phasedRelease = this.phasedRelease;
    if (phasedRelease && phasedRelease.startDate) {
      ret = [
        ...ret,
        phasedRelease.phasedReleaseState,
        phasedRelease.startDate,
        phasedRelease.totalPauseDuration,
        phasedRelease.currentDayNumber
      ];
    }
    return ret.join('-');
  }
}

module.exports = AppVersion;
