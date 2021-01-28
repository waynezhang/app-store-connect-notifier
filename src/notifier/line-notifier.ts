import { Notifier } from './notifier';
import { LineNotify } from '@inkohx/line-notify';
import { AppVersion } from '../api/app-version';
import { TestFlightBuild } from '../api/testflight-build';
import { formatEnumString } from '../util/string-utils';
import { Metric } from '../api/app-metric';

class LINENotifier implements Notifier {

  private notifier: LineNotify;

  constructor(token: string) {
    this.notifier = new LineNotify(token);
  }

  setUp() {
    // NOTHING
  }

  tearDown() {
    // NOTHING
  }

  async notify(appVersion: AppVersion) {
    const messageLines: string[] = [];
    messageLines.push(`*${appVersion.app.name} ${appVersion.version}* has changed to *${formatEnumString(appVersion.state)}*`);
    if (appVersion.phasedRelease) {
      messageLines.push(`Phased Release: *${formatEnumString(appVersion.phasedRelease.state)}* , Percentage: *${appVersion.phasedRelease.percentage}%* (Day: ${appVersion.phasedRelease.currentDayNumber})`);
    }
    await this.notifier.send({ message: messageLines.join('\n') });
  }

  async notifyTestFlightBuild(build: TestFlightBuild): Promise<void> {
    const message = [
      `[TestFlight] *${build.app.name} ${build.version}* (${build.appVersion}) has changed to *${formatEnumString(build.processingState)}*`,
      `Internal Test: *${formatEnumString(build.internalBuildState)}*`,
      `External Test: *${formatEnumString(build.externalBuildState)}*`,
    ].join('\n');
    this.notifier.send({ message });
  }

  async notifyMetric(_metric: Metric) {
    // NOTHING
  }
}

export default LINENotifier;
