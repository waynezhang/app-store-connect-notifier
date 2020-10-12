import { Notifier } from './notifier';
import { AppVersion } from '../api/app-version';
import { TestFlightBuild } from '../api/testflight-build';
import { formatEnumString } from '../util/string-utils';

class ConsoleNotifier implements Notifier {

  async notify(appVersion: AppVersion) {
    console.log(`[${appVersion.app.name}] version ${appVersion.version} has changed to ${formatEnumString(appVersion.state)}`);
  }

  async notifyTestFlightBuild(build: TestFlightBuild) {
    const message = [
      `[${build.app.name}] TestFlight build ${build.version}(${build.appVersion}) has changed to ${formatEnumString(build.processingState)}`,
      `(Internal: ${formatEnumString(build.internalBuildState)}, External: ${formatEnumString(build.externalBuildState)})`
    ].join(' ');
    console.log(message);
  }
}

export default ConsoleNotifier;
